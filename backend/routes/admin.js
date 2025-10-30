const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

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

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM return_requests WHERE 1=1';
    const countParams = [];
    
    if (status && status !== 'All') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      res.json({
        requests,
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
    const updateQuery = `
      UPDATE return_requests 
      SET status = ?, admin_notes = ?, updated_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(updateQuery, [status, notes || request.admin_notes, requestId], function(err) {
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
            emailContent = `
              <h2>Your ${request.action_type} Request Has Been Approved</h2>
              <p>Dear ${request.customer_name},</p>
              <p>Good news! Your ${request.action_type.toLowerCase()} request has been approved.</p>
              <p><strong>Request ID:</strong> ${request.request_id}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
              <p>We will process your request shortly and keep you updated.</p>
            `;
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

        sendEmail({
          to: request.customer_email,
          subject: `${request.action_type} Request Update - ${request.request_id}`,
          html: emailContent
        });
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

