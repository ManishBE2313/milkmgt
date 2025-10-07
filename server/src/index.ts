import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyConnection } from './db/pool';
import { createTables } from './db/init';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import userRoutes from './routes/userRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import summaryRoutes from './routes/summaryRoutes';
import exportRoutes from './routes/exportRoutes';
import customerRoutes from './routes/customerRoutes'; // NEW
import billRoutes from './routes/billRoutes';

// Load environment variables
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
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/customers', customerRoutes); // NEW
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/report', summaryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', exportRoutes);
app.use('/api/bill', billRoutes); 
// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing server...');
    
    // Verify database connection
    await verifyConnection();
    console.log('✅ Database connection verified');
    
    // Create tables if they don't exist
    await createTables();
    console.log('✅ Database tables ready');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
