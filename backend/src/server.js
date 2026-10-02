import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Setup Socket.IO Server
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Attach socket handlers
  setupSocketHandlers(io);

  // Start listening
  server.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`🚀 IntellMeet Backend Server is running on port ${PORT}`);
    logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
    logger.info(`👥 Module: Backend & Database API`);
    logger.info(`=======================================================`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error(`Critical error starting server: ${err.message}`);
  process.exit(1);
});
