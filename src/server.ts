
import cluster from 'cluster';
import os from 'os';
import app from './app';
import { config } from './app/config';



const numCPUs = os.cpus().length; // Get the number of CPU cores

// Master process code
if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exits
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Create a new worker if one dies
  });

} else {
  // Worker process code
  const server = app.listen(config.app.port, () => {
    console.log(`🚀 Worker process ${process.pid} running on port ${config.app.port}`);
    console.log(`📍 Environment: ${config.app.nodeEnv || process.env.NODE_ENV}`);
    console.log(`🌐 Local URL: http://localhost:${config.app.port}`);
  });

  // Graceful shutdown handling for workers
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} received SIGTERM, shutting down gracefully`);
    server.close(() => {
      console.log(`Worker ${process.pid} terminated`);
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log(`Worker ${process.pid} received SIGINT, shutting down gracefully`);
    server.close(() => {
      console.log(`Worker ${process.pid} terminated`);
      process.exit(0);
    });
  });

  // Handle uncaught exceptions in workers
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  // Handle unhandled promise rejections in workers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
      process.exit(1);
    });
  });
}