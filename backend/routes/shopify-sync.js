const express = require('express');
const { getShopifyOrders, getShopifyProducts } = require('../services/shopify');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get Shopify orders (admin only)
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Shopify orders request received');
    console.log('🔐 User:', req.user?.email);
    console.log('🔧 Shopify config check:', {
      hasStoreUrl: !!process.env.SHOPIFY_STORE_URL,
      hasToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      storeUrl: process.env.SHOPIFY_STORE_URL
    });
    
    const { limit = 50 } = req.query;
    console.log(`🛍️ Fetching ${limit} orders from Shopify...`);
    
    const orders = await getShopifyOrders(limit);
    console.log(`✅ Successfully fetched ${orders.length} orders`);
    
    res.json({
      success: true,
      count: orders.length,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.name,
        customerName: order.customer ? 
          `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 
          'Customer',
        customerEmail: order.email,
        orderDate: order.created_at,
        totalPrice: order.total_price,
        itemCount: order.line_items.length
      }))
    });
  } catch (error) {
    console.error('❌ Shopify orders error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    
    res.status(500).json({ 
      error: 'Failed to fetch Shopify orders',
      message: error.message,
      details: error.response?.data || error.toString(),
      statusCode: error.response?.status
    });
  }
});

// Get Shopify products (admin only)
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const products = await getShopifyProducts(limit);
    
    res.json({
      success: true,
      count: products.length,
      products: products.map(product => ({
        id: product.id,
        title: product.title,
        vendor: product.vendor,
        productType: product.product_type,
        variants: product.variants.length,
        image: product.image?.src || null
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch Shopify products',
      message: error.message 
    });
  }
});

module.exports = router;

