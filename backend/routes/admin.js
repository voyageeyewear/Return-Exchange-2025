const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// Generate unique store credit code
function generateStoreCreditCode() {
  const prefix = 'STORE';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${timestamp}-${random}`;
}

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Get all return/exchange requests (Shopify integrated)
router.get('/requests', (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  
  let query = `SELECT * FROM return_requests WHERE 1=1`;
  const params = [];
  
  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (search) {
    query += ' AND (request_id LIKE ? OR customer_name LIKE ? OR order_number LIKE ? OR product_name LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  
  query += ' ORDER BY submitted_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, requests) => {
    if (err) {
      console.error('❌ Error fetching requests:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Add return window status to each request
    const requestsWithReturnWindow = requests.map(request => {
      // Calculate return window status based on order date
      // We need to get the order date from Shopify or use submitted_date as fallback
      const orderDate = new Date(request.submitted_date); // Using submitted_date as fallback
      const currentDate = new Date();
      const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));
      const isWithinReturnWindow = daysDifference <= 3;
      
      return {
        ...request,
        is_within_return_window: isWithinReturnWindow,
        days_since_order: daysDifference
      };
    });

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM return_requests WHERE 1=1';
    const countParams = [];
    
    if (status && status !== 'All') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        requests: requestsWithReturnWindow,
        total: countResult ? countResult.total : 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    });
  });
});

// Get single request details (Shopify integrated)
router.get('/requests/:id', (req, res) => {
  db.get('SELECT * FROM return_requests WHERE id = ?', [req.params.id], (err, request) => {
    if (err) {
      console.error('❌ Error fetching request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get status history
    db.all('SELECT * FROM status_history WHERE request_id = ? ORDER BY changed_at DESC',
      [request.request_id],
      (err, history) => {
        res.json({
          request,
          history: history || []
        });
      }
    );
  });
});


// Update request status
router.put('/requests/:id/status', (req, res) => {
  const { status, notes, sendNotification } = req.body;
  const requestId = req.params.id;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  // First get the current request to access old status and customer info
  db.get('SELECT * FROM return_requests WHERE id = ?', [requestId], (err, request) => {
    if (err || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const oldStatus = request.status;
    
    // Prepare update data
    let updateData = [status, notes || request.admin_notes, requestId];
    let updateQuery = `
      UPDATE return_requests 
      SET status = ?, admin_notes = ?, updated_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // Generate store credit for approved returns
    if (status === 'Approved' && request.action_type === 'Return') {
      const storeCreditAmount = parseFloat(request.product_price) || 0;
      const storeCreditCode = generateStoreCreditCode();
      
      // Set expiry to 90 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);
      const storeCreditExpiry = expiryDate.toISOString();
      
      updateQuery = `
        UPDATE return_requests 
        SET status = ?, admin_notes = ?, updated_date = CURRENT_TIMESTAMP,
            store_credit_amount = ?, store_credit_code = ?, 
            store_credit_status = 'Active', store_credit_expiry = ?
        WHERE id = ?
      `;
      updateData = [status, notes || request.admin_notes, storeCreditAmount, storeCreditCode, storeCreditExpiry, requestId];
    }

    db.run(updateQuery, updateData, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update status' });
      }

      // Log status change
      db.run('INSERT INTO status_history (request_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
        [request.request_id, oldStatus, status, req.user.email]
      );

      // Send email notification if requested
      if (sendNotification && request.customer_email) {
        let emailContent = '';
        
        switch(status) {
          case 'Approved':
            if (request.action_type === 'Return') {
              // Get the updated request with store credit info
              db.get('SELECT * FROM return_requests WHERE id = ?', [requestId], (err, updatedRequest) => {
                if (err || !updatedRequest) {
                  console.error('Error fetching updated request for store credit:', err);
                  return;
                }
                
                const storeCreditAmount = parseFloat(updatedRequest.store_credit_amount) || 0;
                const storeCreditCode = updatedRequest.store_credit_code;
                const storeCreditExpiry = updatedRequest.store_credit_expiry;
                
                emailContent = `
                  <h2>Your Return Request Has Been Approved</h2>
                  <p>Dear ${request.customer_name},</p>
                  <p>Great news! Your return request has been approved.</p>
                  <p><strong>Request ID:</strong> ${request.request_id}</p>
                  <p><strong>Product:</strong> ${request.product_name}</p>
                  ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                  
                  ${storeCreditAmount > 0 ? `
                    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border: 3px solid #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                      <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 3em; margin-bottom: 15px;">🎁</div>
                        <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 24px;">Your Store Credit is Ready!</h3>
                      </div>
                      
                      <div style="background: #ffffff; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px dashed #10b981; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #059669; font-weight: 600;">Your Store Credit Code:</p>
                        <p style="margin: 0; font-size: 28px; font-weight: bold; color: #065f46; letter-spacing: 2px; font-family: monospace; background: #f0fdf4; padding: 15px; border-radius: 8px; border: 2px solid #10b981; display: inline-block;">
                          ${storeCreditCode}
                        </p>
                      </div>
                      
                      <div style="text-align: center;">
                        <p style="margin: 15px 0 0 0; font-size: 18px; color: #065f46; font-weight: 600;">
                          💰 Credit Amount: ₹${storeCreditAmount.toFixed(2)}
                        </p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #059669;">
                          Valid until ${new Date(storeCreditExpiry).toLocaleDateString()} (90 days)
                        </p>
                      </div>
                      
                      <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.7); border-radius: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #065f46; text-align: center;">
                          Use this store credit code during checkout for your next purchase!
                        </p>
                      </div>
                    </div>
                  ` : ''}
                  
                  <p>We will process your return shortly and keep you updated.</p>
                `;
                
                // Send the email with store credit info
                sendEmail({
                  to: request.customer_email,
                  subject: `Return Approved - Store Credit Generated - ${request.request_id}`,
                  html: emailContent
                });
              });
              return; // Exit early for return approval
            } else {
              // Exchange approval
              emailContent = `
                <h2>Your Exchange Request Has Been Approved</h2>
                <p>Dear ${request.customer_name},</p>
                <p>Great news! Your exchange request has been approved.</p>
                <p><strong>Request ID:</strong> ${request.request_id}</p>
                <p><strong>Original Product:</strong> ${request.product_name}</p>
                ${request.exchange_product_name ? `<p><strong>Exchange For:</strong> ${request.exchange_product_name}</p>` : ''}
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                <p>We will process your exchange shortly and keep you updated.</p>
              `;
            }
            break;
          case 'Rejected':
            emailContent = `
              <h2>Your ${request.action_type} Request Update</h2>
              <p>Dear ${request.customer_name},</p>
              <p>We have reviewed your ${request.action_type.toLowerCase()} request.</p>
              <p><strong>Request ID:</strong> ${request.request_id}</p>
              <p><strong>Status:</strong> ${status}</p>
              ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
              <p>If you have any questions, please contact our customer service.</p>
            `;
            break;
          case 'In Progress':
            emailContent = `
              <h2>Your ${request.action_type} Request is Being Processed</h2>
              <p>Dear ${request.customer_name},</p>
              <p>Your ${request.action_type.toLowerCase()} request is now being processed.</p>
              <p><strong>Request ID:</strong> ${request.request_id}</p>
              ${notes ? `<p><strong>Update:</strong> ${notes}</p>` : ''}
              <p>We'll notify you once it's completed.</p>
            `;
            break;
          case 'Completed':
            emailContent = `
              <h2>Your ${request.action_type} Request is Complete</h2>
              <p>Dear ${request.customer_name},</p>
              <p>Your ${request.action_type.toLowerCase()} request has been completed successfully!</p>
              <p><strong>Request ID:</strong> ${request.request_id}</p>
              ${notes ? `<p><strong>Details:</strong> ${notes}</p>` : ''}
              <p>Thank you for your patience!</p>
            `;
            break;
          default:
            emailContent = `
              <h2>Your ${request.action_type} Request Update</h2>
              <p>Dear ${request.customer_name},</p>
              <p>There's an update on your ${request.action_type.toLowerCase()} request.</p>
              <p><strong>Request ID:</strong> ${request.request_id}</p>
              <p><strong>New Status:</strong> ${status}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            `;
        }

        // Send email for non-return approvals
        if (request.action_type !== 'Return' || status !== 'Approved') {
          sendEmail({
            to: request.customer_email,
            subject: `${request.action_type} Request Update - ${request.request_id}`,
            html: emailContent
          });
        }
      }

      res.json({ message: 'Status updated successfully' });
    });
  });
});

// Get statistics
router.get('/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM return_requests',
    'SELECT COUNT(*) as pending FROM return_requests WHERE status = "Pending"',
    'SELECT COUNT(*) as approved FROM return_requests WHERE status = "Approved"',
    'SELECT COUNT(*) as inProgress FROM return_requests WHERE status = "In Progress"',
    'SELECT COUNT(*) as completed FROM return_requests WHERE status = "Completed"',
    'SELECT COUNT(*) as rejected FROM return_requests WHERE status = "Rejected"'
  ];

  const stats = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.get(query, (err, result) => {
      if (!err && result) {
        const key = Object.keys(result)[0];
        stats[key] = result[key];
      }
      
      completed++;
      if (completed === queries.length) {
        res.json(stats);
      }
    });
  });
});

module.exports = router;

