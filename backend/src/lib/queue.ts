import { Queue, Worker, Job } from 'bullmq';
import logger from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Parse Redis URL into connection options
const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
};

const connection = parseRedisUrl(REDIS_URL);

// Lazy-initialized queues (only created when Redis is available)
let emailQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let queuesInitialized = false;

/**
 * Initialize queues only when needed
 */
const initQueues = () => {
  if (queuesInitialized || !REDIS_ENABLED) return;
  
  try {
    emailQueue = new Queue('email', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });

    notificationQueue = new Queue('notification', {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 1000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 50 },
      },
    });
    
    queuesInitialized = true;
    logger.info('Job queues initialized');
  } catch (err) {
    logger.debug('Job queues unavailable (Redis not connected)');
  }
};

// ===========================
// Workers
// ===========================
let emailWorker: Worker | null = null;
let notificationWorker: Worker | null = null;

/**
 * Initialize job queue workers
 * Call this in server startup
 */
export const initWorkers = () => {
  if (!REDIS_ENABLED) {
    logger.info('Redis disabled, job queues not initialized');
    return;
  }
  
  try {
    initQueues();
    
    emailWorker = new Worker(
      'email',
      async (job: Job) => {
        const { type, payload } = job.data;
        logger.info(`Processing email job: ${type}, id: ${job.id}`);

        switch (type) {
          case 'welcome': {
            const { sendWelcomeEmail } = await import('./email');
            await sendWelcomeEmail(payload.email, payload.name);
            break;
          }
          case 'password-reset': {
            const { sendPasswordResetEmail } = await import('./email');
            await sendPasswordResetEmail(payload.email, payload.name, payload.resetUrl);
            break;
          }
          case 'verification': {
            const { sendVerificationEmail } = await import('./email');
            await sendVerificationEmail(payload.email, payload.name, payload.verifyUrl);
            break;
          }
          case 'notification': {
            const { sendNotificationEmail } = await import('./email');
            await sendNotificationEmail(payload.email, payload.subject, payload.message);
            break;
          }
          case 'custom': {
            const { sendEmail } = await import('./email');
            await sendEmail(payload.to, payload.subject, payload.body);
            break;
          }
          default:
            logger.warn(`Unknown email job type: ${type}`);
        }
      },
      { connection, concurrency: 5 }
    );

    emailWorker.on('completed', (job) => {
      logger.debug(`Email job completed: ${job.id}`);
    });

    emailWorker.on('failed', (job, err) => {
      logger.error(`Email job failed: ${job?.id}`, err);
    });

    notificationWorker = new Worker(
      'notification',
      async (job: Job) => {
        const { userId, type, title, message, link } = job.data;
        logger.info(`Processing notification job: ${type}, user: ${userId}`);

        const { createNotification } = await import('../controllers/notificationController');
        await createNotification(userId, type, title, message, link);
      },
      { connection, concurrency: 10 }
    );

    notificationWorker.on('completed', (job) => {
      logger.debug(`Notification job completed: ${job.id}`);
    });

    notificationWorker.on('failed', (job, err) => {
      logger.error(`Notification job failed: ${job?.id}`, err);
    });

    logger.info('Job queue workers initialized');
  } catch (err) {
    logger.warn('Job queue workers could not start (Redis might be unavailable):', err);
  }
};

/**
 * Graceful shutdown of workers
 */
export const shutdownWorkers = async () => {
  await emailWorker?.close();
  await notificationWorker?.close();
  await emailQueue?.close();
  await notificationQueue?.close();
  logger.info('Job queue workers shut down');
};

/**
 * Add an email to the queue
 */
export const queueEmail = async (type: string, payload: any) => {
  try {
    if (!emailQueue) throw new Error('Queue not available');
    await emailQueue.add(type, { type, payload });
  } catch {
    // If queue unavailable, send directly
    logger.debug('Queue unavailable, sending email directly');
    const { sendEmail } = await import('./email');
    if (type === 'custom') {
      await sendEmail(payload.to, payload.subject, payload.body);
    }
  }
};

/**
 * Add a notification to the queue
 */
export const queueNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) => {
  try {
    if (!notificationQueue) throw new Error('Queue not available');
    await notificationQueue.add('create', { userId, type, title, message, link });
  } catch {
    // If queue unavailable, create directly
    const { createNotification } = await import('../controllers/notificationController');
    await createNotification(userId, type as any, title, message, link);
  }
};

export { emailQueue, notificationQueue };
export default { emailQueue, notificationQueue, initWorkers, shutdownWorkers, queueEmail, queueNotification };
