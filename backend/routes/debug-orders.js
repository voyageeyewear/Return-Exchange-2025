const express = require('express');
const { getShopifyOrders } = require('../services/shopify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Health check for debug route
router.get('/health', (req, res) => {
  console.log('🏥 Debug orders health check');
  res.json({ 
    status: 'ok', 
    message: 'Debug orders endpoint is accessible',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to list all orders (admin only)
router.get('/list', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Debug orders request received');
    console.log('🔐 User authenticated:', req.user ? 'YES' : 'NO');
    
    const orders = await getShopifyOrders(100);
    console.log(`✅ Fetched ${orders.length} orders from Shopify`);
    
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

