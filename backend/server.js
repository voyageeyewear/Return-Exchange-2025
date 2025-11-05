require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Initialize database with error handling
let db;
try {
  db = require('./database');
  console.log('✅ Database module loaded');
} catch (err) {
  console.error('❌ Database initialization error:', err.message);
  // Continue without database - API will return errors
}

// Verify Shopify connection (non-blocking)
try {
  const { verifyShopifyConnection } = require('./services/shopify');
  verifyShopifyConnection().catch(err => {
    console.warn('⚠️ Shopify connection failed (will retry on API calls):', err.message);
  });
} catch (err) {
  console.error('⚠️ Shopify service error:', err.message);
}

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const returnRoutes = require('./routes/returns');
const adminRoutes = require('./routes/admin');
const shopifySyncRoutes = require('./routes/shopify-sync');
const debugOrdersRoutes = require('./routes/debug-orders');

// General request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/debug')) {
    console.log('🔍 Debug route accessed:', req.method, req.originalUrl);
    console.log('🔑 Has Authorization:', !!req.headers.authorization);
  }
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shopify', shopifySyncRoutes);
app.use('/api/debug/orders', debugOrdersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Return & Exchange System API is running' });
});

// Environment check endpoint (for debugging)
app.get('/api/env-check', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasShopifyUrl: !!process.env.SHOPIFY_STORE_URL,
    hasShopifyToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
    hasJwtSecret: !!process.env.JWT_SECRET,
    shopifyApiVersion: process.env.SHOPIFY_API_VERSION || 'not set',
    // Show first/last 4 chars only for security
    shopifyUrlPreview: process.env.SHOPIFY_STORE_URL ? 
      `${process.env.SHOPIFY_STORE_URL.substring(0, 4)}...${process.env.SHOPIFY_STORE_URL.slice(-4)}` : 
      'not set',
    // Show full store URL for debugging (remove this after fixing)
    shopifyStoreUrl: process.env.SHOPIFY_STORE_URL,
    shopifyTokenPreview: process.env.SHOPIFY_ACCESS_TOKEN ? 
      `${process.env.SHOPIFY_ACCESS_TOKEN.substring(0, 10)}...${process.env.SHOPIFY_ACCESS_TOKEN.slice(-4)}` : 
      'not set'
  });
});

// Serve frontend static files in production
const frontendBuild = path.join(__dirname, '../frontend/build');

// Check if build directory exists
if (fs.existsSync(frontendBuild)) {
  console.log(`✅ Frontend build found at: ${frontendBuild}`);
  app.use(express.static(frontendBuild));
  
  // Handle React routing - return all requests to React app (MUST be last)
  // Only for non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
} else {
  console.error(`❌ Frontend build NOT found at: ${frontendBuild}`);
  console.error(`❌ Expected path: ${frontendBuild}`);
  console.error(`📁 Current directory: ${__dirname}`);
  console.error(`📂 Directory contents:`, fs.readdirSync(__dirname));
  
  app.get('*', (req, res) => {
    res.status(404).send(`
      <h1>Frontend build not found</h1>
      <p>Expected location: ${frontendBuild}</p>
      <p>Please ensure the build was created during deployment</p>
    `);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📦 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`🔐 Admin login: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Working directory: ${__dirname}`);
  console.log('='.repeat(60));
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

