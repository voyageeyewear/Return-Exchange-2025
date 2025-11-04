const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { sendEmail } = require('../utils/email');
const { getShopifyProducts } = require('../services/shopify');

const router = express.Router();

// Generate unique discount code
function generateDiscountCode() {
  const prefix = 'EXCH';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${timestamp}-${random}`;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'return-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get available products for exchange
router.get('/exchange-products', async (req, res) => {
  try {
    console.log('📦 Fetching ALL products for exchange...');
    const products = await getShopifyProducts(null); // Get ALL products (no limit)
    
    // Format products for frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      variants: product.variants.map(variant => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        available: variant.inventory_quantity > 0
      })),
      image: product.images && product.images.length > 0 ? product.images[0].src : null
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('❌ Error fetching exchange products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Submit return/exchange request (Shopify integrated with exchange product)
router.post('/submit', upload.single('image'), (req, res) => {
  const { 
    orderNumber, shopifyOrderId, shopifyItemId, productName, productSku, productPrice,
    productImage,
    customerName, customerEmail, customerMobile, actionType, reason, 
    otherReason, exchangeDetails,
    // Exchange product fields
    exchangeProductId, exchangeProductName, exchangeProductSku, exchangeProductPrice,
    priceDifference, paymentStatus, paymentMethod, paymentTransactionId,
    creditOption
  } = req.body;
  
  if (!orderNumber || !shopifyItemId || !productName || !customerName || !customerEmail || !actionType || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // For exchanges, validate exchange product is provided
  if (actionType === 'Exchange' && !exchangeProductId) {
    return res.status(400).json({ error: 'Exchange product must be selected' });
  }

  // Generate unique request ID
  const requestId = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  // Calculate refund amount and generate discount code if price difference is negative
  const priceDiff = parseFloat(priceDifference) || 0;
  const refundAmount = priceDiff < 0 ? Math.abs(priceDiff) : 0;
  let discountCode = null;
  let discountCodeExpiry = null;
  const creditChoice = creditOption || 'next_order'; // Default to 'next_order' if not provided

  // Only generate discount code if customer chose "next_order" option
  if (refundAmount > 0 && creditChoice === 'next_order') {
    discountCode = generateDiscountCode();
    // Set expiry to 90 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90);
    discountCodeExpiry = expiryDate.toISOString();
  }

  const query = `
    INSERT INTO return_requests (
      request_id, order_number, shopify_order_id, shopify_item_id, 
      product_name, product_sku, product_price, product_image,
      customer_name, customer_email, customer_mobile, 
      action_type, reason, other_reason, exchange_details,
      exchange_product_id, exchange_product_name, exchange_product_sku, exchange_product_price,
      price_difference, payment_status, payment_method, payment_transaction_id,
      payment_date, refund_amount, credit_option, discount_code, discount_code_status, discount_code_expiry,
      image_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const paymentDate = paymentStatus === 'Paid' ? new Date().toISOString() : null;

  db.run(query, [
    requestId, orderNumber, shopifyOrderId, shopifyItemId,
    productName, productSku, productPrice, productImage || null,
    customerName, customerEmail, customerMobile,
    actionType, reason, otherReason, exchangeDetails,
    exchangeProductId || null, exchangeProductName || null, exchangeProductSku || null, exchangeProductPrice || null,
    priceDifference || 0, paymentStatus || 'Not Required', paymentMethod || null, paymentTransactionId || null,
    paymentDate, refundAmount, creditChoice, discountCode, discountCode ? 'Active' : null, discountCodeExpiry,
    imagePath
  ], function(err) {
    if (err) {
      console.error('❌ Error submitting return request:', err);
      return res.status(500).json({ error: 'Failed to submit request. Please try again.' });
    }

    // Log status history
    db.run('INSERT INTO status_history (request_id, new_status, changed_by) VALUES (?, ?, ?)',
      [requestId, 'Pending', 'Customer']
    );

    // Build email content
    let emailContent = `
      <h2>Your ${actionType} Request Has Been Submitted</h2>
      <p>Dear ${customerName},</p>
      <p>We have received your ${actionType.toLowerCase()} request.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Original Product:</strong> ${productName}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `;

    if (actionType === 'Exchange' && exchangeProductName) {
      emailContent += `
        <p><strong>Exchange For:</strong> ${exchangeProductName}</p>
      `;
      
      if (priceDiff > 0) {
        emailContent += `<p><strong>Additional Payment Required:</strong> ₹${priceDiff.toFixed(2)}</p>`;
        if (paymentStatus === 'Paid') {
          emailContent += `<p><strong>Payment Status:</strong> Paid (${paymentMethod})</p>`;
        }
      } else if (refundAmount > 0) {
        emailContent += `<p><strong>Credit Amount:</strong> ₹${refundAmount.toFixed(2)}</p>`;
        
        if (creditChoice === 'next_order' && discountCode) {
          emailContent += `
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #10b981;">
              <p style="margin: 0 0 10px 0;"><strong>🎁 Discount Code Generated!</strong></p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #065f46;">${discountCode}</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #059669;">
                Use this code for ₹${refundAmount.toFixed(2)} discount on your next purchase. Valid for 90 days.
              </p>
            </div>
          `;
        } else if (creditChoice === 'apply_now') {
          emailContent += `
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #10b981;">
              <p style="margin: 0 0 10px 0;"><strong>✅ Credit Applied to Exchange</strong></p>
              <p style="margin: 0; font-size: 14px; color: #059669;">
                The credit of ₹${refundAmount.toFixed(2)} has been applied to this exchange transaction.
              </p>
            </div>
          `;
        }
      }
    }

    emailContent += `
      <p>We will review your request and contact you shortly.</p>
      <p>Thank you for your patience!</p>
    `;

    // Send confirmation email to customer
    sendEmail({
      to: customerEmail,
      subject: `${actionType} Request Submitted - ${requestId}`,
      html: emailContent
    });

    console.log(`✅ ${actionType} request submitted: ${requestId} for order ${orderNumber}`);
    if (exchangeProductName) {
      console.log(`   Exchange product: ${exchangeProductName} (₹${exchangeProductPrice})`);
      if (priceDiff > 0) {
        console.log(`   Price difference: ₹${priceDiff} - Payment: ${paymentStatus}`);
      } else if (refundAmount > 0) {
        console.log(`   Refund amount: ₹${refundAmount} - Discount Code: ${discountCode}`);
      }
    }

    res.json({
      message: 'Request submitted successfully',
      requestId: requestId,
      discountCode: discountCode,
      refundAmount: refundAmount,
      discountCodeExpiry: discountCodeExpiry
    });
  });
});

// Get request status by request ID (Shopify integrated)
router.get('/status/:requestId', (req, res) => {
  const { requestId } = req.params;

  db.get('SELECT * FROM return_requests WHERE request_id = ?', [requestId], (err, request) => {
    if (err) {
      console.error('❌ Error fetching request status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ request });
  });
});

module.exports = router;

