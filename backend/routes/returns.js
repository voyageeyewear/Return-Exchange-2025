const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { sendEmail } = require('../utils/email');

const router = express.Router();

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

// Submit return/exchange request
router.post('/submit', upload.single('image'), (req, res) => {
  const { orderId, orderItemId, customerName, customerEmail, customerMobile, actionType, reason, otherReason, exchangeDetails } = req.body;
  
  if (!orderId || !orderItemId || !customerName || !customerEmail || !actionType || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate unique request ID
  const requestId = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const query = `
    INSERT INTO return_requests (
      request_id, order_id, order_item_id, customer_name, customer_email, 
      customer_mobile, action_type, reason, other_reason, exchange_details, image_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    requestId, orderId, orderItemId, customerName, customerEmail,
    customerMobile, actionType, reason, otherReason, exchangeDetails, imagePath
  ], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to submit request' });
    }

    // Log status history
    db.run('INSERT INTO status_history (request_id, new_status, changed_by) VALUES (?, ?, ?)',
      [requestId, 'Pending', 'Customer']
    );

    // Send confirmation email to customer
    sendEmail({
      to: customerEmail,
      subject: `${actionType} Request Submitted - ${requestId}`,
      html: `
        <h2>Your ${actionType} Request Has Been Submitted</h2>
        <p>Dear ${customerName},</p>
        <p>We have received your ${actionType.toLowerCase()} request.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>We will review your request and contact you shortly.</p>
        <p>Thank you for your patience!</p>
      `
    });

    res.json({
      message: 'Request submitted successfully',
      requestId: requestId
    });
  });
});

// Get request status by request ID
router.get('/status/:requestId', (req, res) => {
  const { requestId } = req.params;

  const query = `
    SELECT rr.*, oi.product_name, oi.product_image, oi.sku, o.order_number
    FROM return_requests rr
    JOIN order_items oi ON rr.order_item_id = oi.id
    JOIN orders o ON rr.order_id = o.id
    WHERE rr.request_id = ?
  `;

  db.get(query, [requestId], (err, request) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ request });
  });
});

module.exports = router;

