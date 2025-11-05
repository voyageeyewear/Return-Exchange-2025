const axios = require('axios');

// Trim whitespace from environment variables (Railway bug fix)
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL?.trim();
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN?.trim();
// Use 2023-10 which is guaranteed to be stable and available
const SHOPIFY_API_VERSION = '2023-10'; // Hardcoded stable version, ignoring env var completely

console.log('🔧 Shopify Config (after trim):', {
  storeUrl: SHOPIFY_STORE_URL,
  tokenLength: SHOPIFY_ACCESS_TOKEN?.length,
  tokenStart: SHOPIFY_ACCESS_TOKEN?.substring(0, 10),
  tokenEnd: SHOPIFY_ACCESS_TOKEN?.slice(-4)
});

// Validate Shopify configuration
if (!SHOPIFY_STORE_URL) {
  console.error('❌ SHOPIFY_STORE_URL is not set in environment variables');
}
if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ SHOPIFY_ACCESS_TOKEN is not set in environment variables');
}

const shopifyAPI = SHOPIFY_STORE_URL && SHOPIFY_ACCESS_TOKEN ? axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json'
  }
}) : null;

console.log('🔧 Shopify Configuration:', {
  storeUrl: SHOPIFY_STORE_URL ? '✅ Set' : '❌ Missing',
  accessToken: SHOPIFY_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
  apiVersion: SHOPIFY_API_VERSION,
  baseURL: shopifyAPI ? shopifyAPI.defaults.baseURL : 'Not configured'
});

// Get orders from Shopify
async function getShopifyOrders(limit = 50) {
  if (!shopifyAPI) {
    throw new Error('Shopify API not configured. Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables.');
  }
  
  try {
    const url = `/orders.json`;
    const fullUrl = `${shopifyAPI.defaults.baseURL}${url}`;
    console.log(`🔗 Calling Shopify API: ${fullUrl}`);
    
    const response = await shopifyAPI.get(url, {
      params: {
        limit: limit,
        status: 'any',
        fields: 'id,name,email,phone,created_at,customer,line_items,total_price'
      }
    });
    return response.data.orders;
  } catch (error) {
    console.error('❌ Error fetching Shopify orders:', error.message);
    console.error('❌ Shopify API URL:', shopifyAPI.defaults.baseURL);
    console.error('❌ Response status:', error.response?.status);
    console.error('❌ Response data:', JSON.stringify(error.response?.data));
    throw error;
  }
}

// Get a single order by order number/name
async function getShopifyOrderByName(orderName) {
  try {
    // Fetch order without field restrictions to get ALL data
    const response = await shopifyAPI.get('/orders.json', {
      params: {
        name: orderName,
        status: 'any'
      }
    });
    
    if (response.data.orders && response.data.orders.length > 0) {
      let order = response.data.orders[0];
      
      console.log(`📦 Raw order data for ${orderName}:`, {
        email: order.email,
        contact_email: order.contact_email,
        phone: order.phone,
        customer_id: order.customer?.id,
        customer_email: order.customer?.email,
        customer_phone: order.customer?.phone
      });
      
      // Always fetch customer details separately if customer ID exists
      if (order.customer && order.customer.id) {
        try {
          console.log(`🔄 Fetching full customer details for customer ID: ${order.customer.id}`);
          const customerResponse = await shopifyAPI.get(`/customers/${order.customer.id}.json`);
          const fullCustomer = customerResponse.data.customer;
          
          console.log(`✅ Full customer data:`, {
            id: fullCustomer.id,
            email: fullCustomer.email,
            phone: fullCustomer.phone,
            default_address_phone: fullCustomer.default_address?.phone
          });
          
          // Merge customer data into order
          order.customer = fullCustomer;
          
          // Also set top-level email and phone if missing
          if (!order.email && fullCustomer.email) {
            order.email = fullCustomer.email;
          }
          if (!order.phone && fullCustomer.phone) {
            order.phone = fullCustomer.phone;
          }
          if (!order.contact_email && fullCustomer.email) {
            order.contact_email = fullCustomer.email;
          }
          
        } catch (err) {
          console.error('❌ Could not fetch customer details:', err.message);
        }
      }
      
      console.log(`📧 Final contact info for ${orderName}:`, {
        email: order.email,
        contact_email: order.contact_email,
        customer_email: order.customer?.email
      });
      
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
async function getShopifyProducts(limit = null) {
  if (!shopifyAPI) {
    throw new Error('Shopify API not configured');
  }

  try {
    let allProducts = [];
    let hasNextPage = true;
    let pageInfo = null;
    let pageCount = 0;
    const maxPages = limit ? Math.ceil(limit / 250) : 999; // Safety limit: max 999 pages

    console.log(`🔍 Starting to fetch products (limit: ${limit || 'ALL'})...`);

    // Shopify max limit is 250 per request, so we need to paginate
    while (hasNextPage && pageCount < maxPages) {
      const params = {
        limit: 250
      };

      // Add page_info for pagination if available
      if (pageInfo) {
        params.page_info = pageInfo;
      }

      const response = await shopifyAPI.get('/products.json', { params });
      const products = response.data.products || [];
      
      allProducts = allProducts.concat(products);
      pageCount++;

      console.log(`📦 Fetched page ${pageCount}: ${products.length} products (Total: ${allProducts.length})`);

      // Check if there's a next page using Link header
      const linkHeader = response.headers.link;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        // Extract page_info from Link header
        const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        console.log('✅ No more pages available');
        hasNextPage = false;
      }

      // Safety check - if we have the requested limit, stop
      if (limit && allProducts.length >= limit) {
        allProducts = allProducts.slice(0, limit);
        console.log(`✅ Reached requested limit of ${limit} products`);
        break;
      }

      // If we got less than 250 products, we've reached the end
      if (products.length < 250) {
        console.log('✅ Received less than 250 products, end reached');
        hasNextPage = false;
      }
    }

    console.log(`✅ Total products fetched: ${allProducts.length} (from ${pageCount} pages)`);
    return allProducts;
  } catch (error) {
    console.error('❌ Error fetching Shopify products:', error.message);
    throw error;
  }
}

// Get product by ID
async function getShopifyProduct(productId) {
  try {
    const response = await shopifyAPI.get(`/products/${productId}.json`);
    return response.data.product;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error.message);
    return null;
  }
}

// Get variant by ID (includes image)
async function getShopifyVariant(variantId) {
  try {
    const response = await shopifyAPI.get(`/variants/${variantId}.json`);
    return response.data.variant;
  } catch (error) {
    console.error(`Error fetching variant ${variantId}:`, error.message);
    return null;
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
  getShopifyProduct,
  getShopifyVariant,
  verifyShopifyConnection
};

