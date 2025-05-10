import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
// import WebSocket from 'ws';
import routes from './routes';
// import periodicScrapeController from './controllers/periodicScrapeController';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// // Create WebSocket server
// const wss = new WebSocket.Server({ server });

// // WebSocket connection handler
// wss.on('connection', (ws) => {
//   console.log('WebSocket client connected');
  
//   // Register WebSocket for updates
//   periodicScrapeController.registerWebSocket(ws);
  
//   // Send initial message
//   ws.send(JSON.stringify({ type: 'connected', message: 'Connected to news scraper WebSocket server' }));
  
//   // Handle ping/pong to keep connection alive
//   const pingInterval = setInterval(() => {
//     if (ws.readyState === WebSocket.OPEN) {
//       ws.ping();
//     }
//   }, 30000);

//   ws.on('close', () => {
//     console.log('WebSocket client disconnected');
//     clearInterval(pingInterval);
//   });
// });

// Middleware
app.use(cors());
app.use(express.json());

// Add request timeout for long scraping operations
app.use((req, res, next) => {
  res.setTimeout(300000, () => {
    res.status(408).send('Request timeout');
  });
  next();
});

// Routes
app.use('/api', routes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`News scraper server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/...`);
  console.log(`WebSocket server running at ws://localhost:${PORT}`);
  
//   // Initialize default periodic scrapers
//   periodicScrapeController.initializeDefaultScrapers()
//     .then(() => {
//       console.log('Default scrapers initialized successfully');
//     })
//     .catch(error => {
//       console.error('Error initializing default scrapers:', error);
//     });
}); 