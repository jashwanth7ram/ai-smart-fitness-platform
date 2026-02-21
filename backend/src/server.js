/**
 * AI Fitness Tracker — API Entry Point
 * Production-ready Express server with security middleware
 */
import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
