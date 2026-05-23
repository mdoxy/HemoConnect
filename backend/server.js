import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import donorRoutes from './routes/donor.js';
import requestRoutes from './routes/request.js';
import priorityRoutes from './routes/priority.js';
import nearbyRoutes from './routes/nearby.js';
import connectDB from './config/db.js';
import { startEscalationJob } from './cron/escalationJob.js';
import { rebuildQueue } from './services/queue/priorityQueue.js';
import Request from './models/Request.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFiles = [
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '.env.local'),
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];

envFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
});

const app = express();
const httpServer = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

let hasStarted = false;

// Middleware
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

const explicitOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isAllowed = explicitOrigins.includes(origin)
      || allowedOriginPatterns.some((pattern) => pattern.test(origin));

    if (isAllowed) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger to verify traffic from frontend to backend
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Serve static files from uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/donorapplications', donorRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/priority', priorityRoutes);
app.use('/api/nearby', nearbyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'Server is running', api: '/api/health' });
});

const startServer = async () => {
  if (hasStarted) {
    console.warn('Server start skipped: already running in this process');
    return;
  }

  let dbConnected = false;

  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error('MongoDB unavailable, starting server in degraded mode:', error.message);
  }

  app.locals.dbConnected = dbConnected;

  // ── Priority System Startup ────────────────────────────────────────────
  if (dbConnected) {
    // 1. Rebuild the in-memory priority queue from pending DB requests
    try {
      const pending = await Request.find({ status: 'Pending' }).select(
        '_id priorityScore submittedAt bloodGroup'
      );
      const items = pending.map((r) => ({
        requestId: String(r._id),
        score: r.priorityScore || 0,
        createdAt: r.submittedAt,
        bloodGroup: r.bloodGroup,
      }));
      rebuildQueue(items);
    } catch (e) {
      console.warn('[Startup] Could not rebuild priority queue:', e.message);
    }

    // 2. Start the escalation cron job (runs every 30 minutes)
    startEscalationJob();
  }

  const basePort = Number(process.env.PORT) || 5000;
  const allowPortFallback = process.env.PORT_FALLBACK === 'true';
  const maxAttempts = allowPortFallback ? 10 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = basePort + attempt;

    try {
      await new Promise((resolve, reject) => {
        const server = httpServer.listen(port, () => {
          hasStarted = true;
          console.log(`Server running on http://localhost:${port}`);
          resolve(server);
        });

        server.once('error', reject);
      });

      return;
    } catch (error) {
      if (error.code === 'EADDRINUSE' && allowPortFallback && attempt < maxAttempts - 1) {
        console.warn(`Port ${port} is in use. Retrying on port ${port + 1}...`);
        continue;
      }

      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Stop the existing process or enable PORT_FALLBACK=true.`);
      }

      throw error;
    }
  }
};

startServer();

