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

// Initialize database
const db = require('./database');

// Verify Shopify connection (non-blocking)
const { verifyShopifyConnection } = require('./services/shopify');
verifyShopifyConnection().catch(err => {
  console.warn('⚠️ Shopify connection failed (will retry on API calls):', err.message);
});

// Import routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const returnRoutes = require('./routes/returns');
const adminRoutes = require('./routes/admin');
const shopifySyncRoutes = require('./routes/shopify-sync');
const debugOrdersRoutes = require('./routes/debug-orders');

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

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../frontend/build');
  
  app.use(express.static(frontendBuild));
  
  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📦 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`🔐 Admin login: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
});

