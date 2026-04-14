import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import donorRoutes from './routes/donor.js';
import requestRoutes from './routes/request.js';
import connectDB from './config/db.js';

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

  const basePort = Number(process.env.PORT) || 5000;
  const allowPortFallback = process.env.PORT_FALLBACK === 'true';
  const maxAttempts = allowPortFallback ? 10 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const port = basePort + attempt;

    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
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

