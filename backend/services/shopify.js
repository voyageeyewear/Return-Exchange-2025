const axios = require('axios');

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

const shopifyAPI = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
});

// Get orders from Shopify
async function getShopifyOrders(limit = 50) {
  try {
    const response = await shopifyAPI.get('/orders.json', {
      params: {
        limit: limit,
        status: 'any',
        fields: 'id,name,email,phone,created_at,customer,line_items,total_price'
      }
    });
    return response.data.orders;
  } catch (error) {
    console.error('Error fetching Shopify orders:', error.message);
    throw error;
  }
}

// Get a single order by order number/name
async function getShopifyOrderByName(orderName) {
  try {
    const response = await shopifyAPI.get('/orders.json', {
      params: {
        name: orderName,
        status: 'any',
        fields: 'id,name,email,phone,created_at,customer,billing_address,shipping_address,line_items,total_price,contact_email'
      }
    });
    
    if (response.data.orders && response.data.orders.length > 0) {
      const order = response.data.orders[0];
      
      // If customer_id exists but customer object is missing, fetch customer details
      if (order.customer && order.customer.id && !order.customer.email) {
        try {
          const customerResponse = await shopifyAPI.get(`/customers/${order.customer.id}.json`);
          order.customer = customerResponse.data.customer;
        } catch (err) {
          console.log('Could not fetch customer details:', err.message);
        }
      }
      
      return order;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Shopify order:', error.message);
    return null;
  }
}

// Get order by Shopify order ID
async function getShopifyOrderById(orderId) {
  try {
    const response = await shopifyAPI.get(`/orders/${orderId}.json`);
    return response.data.order;
  } catch (error) {
    console.error('Error fetching Shopify order by ID:', error.message);
    return null;
  }
}

// Get products from Shopify
async function getShopifyProducts(limit = 50) {
  try {
    const response = await shopifyAPI.get('/products.json', {
      params: {
        limit: limit
      }
    });
    return response.data.products;
  } catch (error) {
    console.error('Error fetching Shopify products:', error.message);
    throw error;
  }
}

// Verify Shopify connection
async function verifyShopifyConnection() {
  try {
    const response = await shopifyAPI.get('/shop.json');
    console.log('✅ Shopify connected:', response.data.shop.name);
    return true;
  } catch (error) {
    console.error('❌ Shopify connection failed:', error.message);
    return false;
  }
}

module.exports = {
  getShopifyOrders,
  getShopifyOrderByName,
  getShopifyOrderById,
  getShopifyProducts,
  verifyShopifyConnection
};

