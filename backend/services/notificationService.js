import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize environment variables first
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') }); // fallback to root

// ─── Firebase Admin SDK Initialization ───────────────────────────────
let firebaseInitialized = false;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.resolve(__dirname, '..', 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
      credential: cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠️  Firebase service account file not found. Push notifications will be disabled.');
    console.warn(`   Expected path: ${serviceAccountPath}`);
    console.warn('   Set FIREBASE_SERVICE_ACCOUNT_PATH in .env or place firebase-service-account.json in backend/');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
}

// ─── Nodemailer (Gmail SMTP) Initialization ─────────────────────────
let emailTransporter = null;

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 465;
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;

if (SMTP_USER && SMTP_PASS) {
  const isGmail = SMTP_HOST === 'smtp.gmail.com' && !process.env.SMTP_HOST;
  
  emailTransporter = nodemailer.createTransport(
    isGmail 
      ? {
          service: 'gmail',
          auth: { user: SMTP_USER, pass: SMTP_PASS },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
        }
      : {
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465, // true for 465, false for 587
          auth: { user: SMTP_USER, pass: SMTP_PASS },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
        }
  );

  // Verify connection on startup
  emailTransporter.verify()
    .then(() => console.log(`✅ Nodemailer (${isGmail ? 'Gmail' : SMTP_HOST}) connected successfully`))
    .catch((err) => console.error('❌ Nodemailer connection failed:', err.message));
} else {
  console.warn('⚠️  SMTP_USER / SMTP_PASS not set. Email notifications will be disabled.');
  console.warn('   Set SMTP_USER and SMTP_PASS in your backend/.env file');
}

// ─── Push Notification Service ───────────────────────────────────────

/**
 * Send a push notification to a specific user by their userId.
 * Automatically fetches all registered FCM tokens for that user
 * and sends using Firebase multicast.
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 * @param {object} [data] - Optional key-value data payload
 * @returns {Promise<object>} - Result summary
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  if (!firebaseInitialized) {
    console.warn('Push notification skipped: Firebase not initialized');
    return { success: false, reason: 'firebase_not_initialized' };
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return { success: false, reason: 'no_tokens' };
    }

    const tokens = user.fcmTokens.map((t) => t.token);

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        clickAction: 'OPEN_APP',
      },
      tokens,
    };

    const response = await getMessaging().sendEachForMulticast(message);

    console.log(`Push sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failures`);

    // Prune invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens = [];

      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token'
            || errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { token: { $in: invalidTokens } } },
        });
        console.log(`Pruned ${invalidTokens.length} invalid FCM token(s) for user ${userId}`);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error(`Push notification error for user ${userId}:`, error.message);
    return { success: false, reason: 'send_error', error: error.message };
  }
}

// ─── Email Notification Service ──────────────────────────────────────

/**
 * Send a transactional email via Nodemailer (Gmail SMTP).
 * Works with any recipient — no domain verification or sandbox restrictions.
 *
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - HTML email body
 * @returns {Promise<object>} - Send result or error
 */
export async function sendEmail(to, subject, html) {
  if (!emailTransporter) {
    console.warn('Email skipped: SMTP not configured');
    return { success: false, reason: 'smtp_not_configured' };
  }

  try {
    const info = await emailTransporter.sendMail({
      from: `HemoConnect <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to}: ${subject} (messageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error to ${to}:`, error.message);
    return { success: false, reason: 'send_error', error: error.message };
  }
}

// ─── Email Templates ─────────────────────────────────────────────────

/**
 * Generate a styled HTML email for blood request status changes.
 *
 * @param {object} request - The blood request document
 * @param {string} status - 'Approved' or 'Rejected'
 * @returns {string} HTML string
 */
export function buildStatusChangeEmail(request, status) {
  const isApproved = status === 'Approved';
  const statusColor = isApproved ? '#16a34a' : '#dc2626';
  const statusEmoji = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:12px 12px 0 0;padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">🩸 HemoConnect</h1>
          <p style="color:#fca5a5;margin:8px 0 0;font-size:14px;">Blood Request Status Update</p>
        </div>

        <!-- Body -->
        <div style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:24px;">
            <span style="display:inline-block;background:${statusColor}15;color:${statusColor};padding:8px 24px;border-radius:50px;font-weight:600;font-size:16px;">
              ${statusEmoji} ${statusText}
            </span>
          </div>

          <p style="color:#374151;font-size:16px;line-height:1.6;">
            Dear <strong>${request.requesterName || 'User'}</strong>,
          </p>
          
          <p style="color:#374151;font-size:16px;line-height:1.6;">
            Your blood request has been <strong style="color:${statusColor};">${statusText.toLowerCase()}</strong> by the hospital.
          </p>

          <!-- Request Details -->
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #e5e7eb;">
            <h3 style="margin:0 0 16px;color:#111827;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Request Details</h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Patient Name</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${request.patientName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Blood Group</td>
                <td style="padding:8px 0;color:#dc2626;font-size:14px;font-weight:600;text-align:right;">${request.bloodGroup}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Units Required</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${request.unitsRequired}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Hospital</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${request.hospitalName}</td>
              </tr>
            </table>
          </div>

          ${request.hospitalRemarks ? `
          <div style="background:#eff6ff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #3b82f6;">
            <p style="margin:0 0 4px;color:#1e40af;font-size:12px;font-weight:600;text-transform:uppercase;">Hospital Remarks</p>
            <p style="margin:0;color:#1e3a5f;font-size:14px;">${request.hospitalRemarks}</p>
          </div>
          ` : ''}

          ${!isApproved && request.rejectionReason ? `
          <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #dc2626;">
            <p style="margin:0 0 4px;color:#991b1b;font-size:12px;font-weight:600;text-transform:uppercase;">Rejection Reason</p>
            <p style="margin:0;color:#7f1d1d;font-size:14px;">${request.rejectionReason}</p>
          </div>
          ` : ''}

          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-top:24px;">
            ${isApproved
              ? 'Please contact the hospital for further details and next steps regarding blood collection.'
              : 'You may contact the hospital for more information or submit a new request.'}
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:24px;padding:16px;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            This is an automated notification from HemoConnect.
          </p>
          <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">
            © ${new Date().getFullYear()} HemoConnect. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Notification Dispatcher (Convenience) ───────────────────────────

/**
 * Dispatch both push and email notifications for a blood request status change.
 * Fire-and-forget: errors are logged but never thrown.
 *
 * @param {object} request - The blood request document (must include userId / requestorId)
 * @param {string} newStatus - 'Approved' | 'Rejected'
 */
export async function notifyRequestStatusChange(request, newStatus) {
  const userId = request.userId || request.requestorId;

  // Push notification (non-blocking)
  const pushTitle = newStatus === 'Approved'
    ? '✅ Blood Request Approved!'
    : '❌ Blood Request Update';

  const pushBody = newStatus === 'Approved'
    ? `Your request for ${request.unitsRequired} unit(s) of ${request.bloodGroup} blood at ${request.hospitalName} has been approved.`
    : `Your blood request at ${request.hospitalName} was not approved. Please check for details.`;

  const pushPromise = sendPushNotification(userId, pushTitle, pushBody, {
    requestId: String(request._id),
    status: newStatus,
    type: 'request_status_change',
  });

  // Email notification (non-blocking)
  let emailPromise = Promise.resolve({ success: false, reason: 'no_email' });

  if (request.requesterEmail) {
    const subject = newStatus === 'Approved'
      ? '✅ Your Blood Request Has Been Approved — HemoConnect'
      : '❌ Blood Request Status Update — HemoConnect';

    const html = buildStatusChangeEmail(request, newStatus);
    emailPromise = sendEmail(request.requesterEmail, subject, html);
  }

  // Fire both concurrently, log results
  const [pushResult, emailResult] = await Promise.allSettled([pushPromise, emailPromise]);

  console.log(`Notification dispatch for request ${request._id}:`, {
    push: pushResult.status === 'fulfilled' ? pushResult.value : pushResult.reason,
    email: emailResult.status === 'fulfilled' ? emailResult.value : emailResult.reason,
  });
}

/**
 * Send an OTP verification email.
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - 6 digit OTP
 * @returns {Promise<object>} - Send result or error
 */
export async function sendVerificationEmail(email, otp) {
  const subject = 'Your HemoConnect Verification Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🩸 HemoConnect</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2>Verify Your Email Address</h2>
        <p>Please use the following One-Time Password (OTP) to complete your registration:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; border-radius: 4px;">
          <h1 style="letter-spacing: 5px; color: #dc2626; margin: 0;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail(email, subject, html);
}

export default {
  sendPushNotification,
  sendEmail,
  buildStatusChangeEmail,
  notifyRequestStatusChange,
  sendVerificationEmail,
};
