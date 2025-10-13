import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    fetchRequestDetails(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const fetchRequestDetails = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequest(response.data.request);
      setHistory(response.data.history);
      setNewStatus(response.data.request.status);
      setNotes(response.data.request.admin_notes || '');
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setUpdating(true);
    setMessage('');

    try {
      await axios.put(
        `/api/admin/requests/${id}/status`,
        {
          status: newStatus,
          notes: notes,
          sendNotification: sendEmail
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('Status updated successfully!');
      
      // Refresh data
      fetchRequestDetails(token);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="admin-dashboard">
        <div className="admin-container">
          <div className="alert alert-error">Request not found</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#ffc107',
      'Approved': '#28a745',
      'Rejected': '#dc3545',
      'In Progress': '#17a2b8',
      'Completed': '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Request Details</h1>
            <p>Request ID: {request.request_id}</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="details-grid">
          {/* Left Column - Request Info */}
          <div>
            <div className="admin-card">
              <h2>Request Information</h2>
              
              <div className="detail-row">
                <strong>Request ID:</strong>
                <span>{request.request_id}</span>
              </div>
              <div className="detail-row">
                <strong>Action Type:</strong>
                <span className={`badge badge-${request.action_type.toLowerCase()}`}>
                  {request.action_type}
                </span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span 
                  className="status-badge"
                  style={{ background: getStatusColor(request.status) }}
                >
                  {request.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Submitted Date:</strong>
                <span>{new Date(request.submitted_date).toLocaleString()}</span>
              </div>
              {request.updated_date && (
                <div className="detail-row">
                  <strong>Last Updated:</strong>
                  <span>{new Date(request.updated_date).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="admin-card">
              <h2>Customer Information</h2>
              
              <div className="detail-row">
                <strong>Name:</strong>
                <span>{request.customer_name}</span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{request.customer_email}</span>
              </div>
              {request.customer_mobile && (
                <div className="detail-row">
                  <strong>Mobile:</strong>
                  <span>{request.customer_mobile}</span>
                </div>
              )}
            </div>

            <div className="admin-card">
              <h2>Order & Product Details</h2>
              
              <div className="detail-row">
                <strong>Order Number:</strong>
                <span>{request.order_number}</span>
              </div>
              <div className="detail-row">
                <strong>Order Date:</strong>
                <span>{new Date(request.order_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>Product:</strong>
                <span>{request.product_name}</span>
              </div>
              <div className="detail-row">
                <strong>SKU:</strong>
                <span>{request.sku}</span>
              </div>
              <div className="detail-row">
                <strong>Quantity:</strong>
                <span>{request.quantity}</span>
              </div>
              <div className="detail-row">
                <strong>Price:</strong>
                <span>${parseFloat(request.price).toFixed(2)}</span>
              </div>
              
              {request.product_image && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Product Image:</strong>
                  <img 
                    src={request.product_image}
                    alt={request.product_name}
                    style={{ 
                      maxWidth: '200px', 
                      borderRadius: '8px', 
                      marginTop: '10px',
                      display: 'block'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="admin-card">
              <h2>Return/Exchange Details</h2>
              
              <div className="detail-row">
                <strong>Reason:</strong>
                <span>{request.reason}</span>
              </div>
              
              {request.other_reason && (
                <div className="detail-row">
                  <strong>Additional Details:</strong>
                  <span>{request.other_reason}</span>
                </div>
              )}
              
              {request.exchange_details && (
                <div className="detail-row">
                  <strong>Exchange Details:</strong>
                  <span>{request.exchange_details}</span>
                </div>
              )}
              
              {request.image_path && (
                <div style={{ marginTop: '15px' }}>
                  <strong>Uploaded Image:</strong>
                  <img 
                    src={request.image_path}
                    alt="Customer upload"
                    style={{ 
                      maxWidth: '100%', 
                      borderRadius: '8px', 
                      marginTop: '10px',
                      display: 'block'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Status Management */}
          <div>
            <div className="admin-card">
              <h2>Update Status</h2>
              
              {message && (
                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
                  {message}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Admin Notes</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows="5"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this request..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                  <span>Send email notification to customer</span>
                </label>
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>

            <div className="admin-card">
              <h2>Status History</h2>
              
              {history.length === 0 ? (
                <p style={{ color: '#666' }}>No status changes yet</p>
              ) : (
                <div className="history-timeline">
                  {history.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-dot" style={{ background: getStatusColor(item.new_status) }}></div>
                      <div className="history-content">
                        <div className="history-status">
                          {item.old_status && `${item.old_status} → `}
                          <strong>{item.new_status}</strong>
                        </div>
                        <div className="history-meta">
                          {new Date(item.changed_at).toLocaleString()}
                          {item.changed_by && ` • by ${item.changed_by}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestDetails;

