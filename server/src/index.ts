import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyConnection } from './db/pool';
import { syncDatabase } from './models'; // NEW
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import userRoutes from './routes/userRoutes';
import customerRoutes from './routes/customerRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import summaryRoutes from './routes/summaryRoutes';
import exportRoutes from './routes/exportRoutes';
import billRoutes from './routes/billRoutes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${_res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/report', summaryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', exportRoutes);
app.use('/api/bill', billRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing server...');
    
    // Verify database connection
    await verifyConnection();
    console.log('✅ Database connection verified');
    
    // Sync Sequelize models (creates/updates tables)
    await syncDatabase();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`⏰ Server started at: ${new Date().toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;
