const express = require('express');
const { getShopifyOrders } = require('../services/shopify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check for debug route (no auth required)
router.get('/health', (req, res) => {
  console.log('🏥 Debug orders health check');
  res.json({ 
    status: 'ok', 
    message: 'Debug orders endpoint is accessible',
    timestamp: new Date().toISOString(),
    route: '/api/debug/orders/health'
  });
});

// Test endpoint with auth but no Shopify call
router.get('/test-auth', authenticateToken, (req, res) => {
  console.log('🧪 Debug orders auth test');
  res.json({
    status: 'ok',
    message: 'Authentication successful',
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to list all orders (admin only)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Debug orders request received');
    console.log('🔐 User authenticated:', req.user ? 'YES' : 'NO');
    console.log('👤 User email:', req.user?.email);
    
    // Check Shopify credentials
    if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
      console.error('❌ Missing Shopify credentials');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Shopify credentials not configured',
        details: 'SHOPIFY_STORE_URL or SHOPIFY_ACCESS_TOKEN is missing'
      });
    }
    
    console.log('🛍️ Fetching orders from Shopify...');
    let orders;
    try {
      orders = await getShopifyOrders(100);
      console.log(`✅ Fetched ${orders.length} orders from Shopify`);
    } catch (shopifyError) {
      console.error('❌ Shopify API error:', shopifyError.message);
      return res.status(500).json({
        error: 'Shopify API error',
        message: shopifyError.message,
        details: 'Failed to fetch orders from Shopify. Check server logs for details.'
      });
    }
    
    const formattedOrders = orders.map(order => ({
      orderNumber: order.name,
      customerEmail: order.email || order.customer?.email,
      customerName: order.customer ? 
        `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 
        'N/A',
      phone: order.phone || order.customer?.phone,
      billingPhone: order.billing_address?.phone,
      shippingPhone: order.shipping_address?.phone,
      orderDate: order.created_at,
      itemCount: order.line_items?.length || 0
    }));

    console.log(`📤 Sending ${formattedOrders.length} formatted orders`);
    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });
  } catch (error) {
    console.error('❌ Debug orders error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch orders',
      message: error.message,
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

