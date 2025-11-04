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
                <span>₹{parseFloat(request.price).toFixed(2)}</span>
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
                  <strong>Exchange Notes:</strong>
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

            {/* Exchange Product Information */}
            {request.action_type === 'Exchange' && request.exchange_product_name && (
              <div className="admin-card" style={{ background: '#f0f9ff', border: '2px solid #0ea5e9' }}>
                <h2 style={{ color: '#0c4a6e' }}>🔄 Exchange Product</h2>
                
                <div className="detail-row">
                  <strong>Exchange Product:</strong>
                  <span>{request.exchange_product_name}</span>
                </div>
                
                {request.exchange_product_sku && (
                  <div className="detail-row">
                    <strong>SKU:</strong>
                    <span>{request.exchange_product_sku}</span>
                  </div>
                )}
                
                {request.exchange_product_price && (
                  <div className="detail-row">
                    <strong>Price:</strong>
                    <span>₹{parseFloat(request.exchange_product_price).toFixed(2)}</span>
                  </div>
                )}
                
                {request.price_difference !== undefined && request.price_difference !== 0 && (
                  <div className="detail-row">
                    <strong>Price Difference:</strong>
                    <span style={{ 
                      color: request.price_difference > 0 ? '#dc2626' : '#059669',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {request.price_difference > 0 ? '+' : ''}₹{parseFloat(request.price_difference).toFixed(2)}
                      {request.price_difference > 0 ? ' (Customer pays extra)' : ' (Refund to customer)'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Information */}
            {request.payment_status && request.payment_status !== 'Not Required' && (
              <div className="admin-card" style={{ 
                background: request.payment_status === 'Paid' ? '#d1fae5' : '#fef3c7',
                border: `2px solid ${request.payment_status === 'Paid' ? '#10b981' : '#f59e0b'}`
              }}>
                <h2 style={{ color: request.payment_status === 'Paid' ? '#065f46' : '#92400e' }}>
                  💳 Payment Information
                </h2>
                
                <div className="detail-row">
                  <strong>Payment Status:</strong>
                  <span 
                    className="status-badge"
                    style={{ 
                      background: request.payment_status === 'Paid' ? '#10b981' : '#f59e0b',
                      color: 'white'
                    }}
                  >
                    {request.payment_status}
                  </span>
                </div>
                
                {request.payment_method && (
                  <div className="detail-row">
                    <strong>Payment Method:</strong>
                    <span>{request.payment_method}</span>
                  </div>
                )}
                
                {request.payment_transaction_id && (
                  <div className="detail-row">
                    <strong>Transaction ID:</strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                      {request.payment_transaction_id}
                    </span>
                  </div>
                )}
                
                {request.payment_date && (
                  <div className="detail-row">
                    <strong>Payment Date:</strong>
                    <span>{new Date(request.payment_date).toLocaleString()}</span>
                  </div>
                )}
                
                {request.price_difference > 0 && (
                  <div className="detail-row">
                    <strong>Amount Paid:</strong>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#065f46' }}>
                      ₹{parseFloat(request.price_difference).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Discount Code / Refund Information */}
            {request.refund_amount && request.refund_amount > 0 && (
              <div className="admin-card" style={{ 
                background: '#d1fae5',
                border: '2px solid #10b981'
              }}>
                <h2 style={{ color: '#065f46' }}>
                  🎁 Discount Code / Refund Information
                </h2>
                
                <div className="detail-row">
                  <strong>Refund Amount:</strong>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#059669' 
                  }}>
                    ₹{parseFloat(request.refund_amount).toFixed(2)}
                  </span>
                </div>
                
                {request.credit_option && (
                  <div className="detail-row">
                    <strong>Credit Option:</strong>
                    <span 
                      className="status-badge"
                      style={{ 
                        background: request.credit_option === 'next_order' ? '#667eea' : '#10b981',
                        color: 'white'
                      }}
                    >
                      {request.credit_option === 'next_order' ? '🎁 Discount Code for Next Order' : '💳 Applied to Exchange'}
                    </span>
                  </div>
                )}
                
                {request.discount_code && (
                  <>
                    <div className="detail-row">
                      <strong>Discount Code:</strong>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#065f46',
                        letterSpacing: '1px',
                        background: '#f0fdf4',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'inline-block'
                      }}>
                        {request.discount_code}
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <strong>Code Status:</strong>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: request.discount_code_status === 'Active' ? '#10b981' : '#f59e0b',
                          color: 'white'
                        }}
                      >
                        {request.discount_code_status || 'Active'}
                      </span>
                    </div>
                    
                    {request.discount_code_expiry && (
                      <div className="detail-row">
                        <strong>Expires On:</strong>
                        <span>{new Date(request.discount_code_expiry).toLocaleDateString()}</span>
                        <span style={{ 
                          marginLeft: '10px',
                          fontSize: '12px',
                          color: '#059669'
                        }}>
                          ({Math.ceil((new Date(request.discount_code_expiry) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  border: '1px solid #10b981'
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#065f46' }}>
                    {request.credit_option === 'next_order' && request.discount_code 
                      ? '💡 This discount code has been sent to the customer\'s email and can be used for future purchases.'
                      : '💡 The credit has been applied to this exchange transaction as requested by the customer.'}
                  </p>
                </div>
              </div>
            )}

            {/* Store Credit Information */}
            {request.action_type === 'Return' && request.store_credit_amount && request.store_credit_amount > 0 && (
              <div className="admin-card" style={{ 
                background: '#f3e8ff',
                border: '2px solid #7c3aed'
              }}>
                <h2 style={{ color: '#5b21b6' }}>
                  💳 Store Credit Information
                </h2>
                
                <div className="detail-row">
                  <strong>Credit Amount:</strong>
                  <span style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#7c3aed' 
                  }}>
                    ₹{parseFloat(request.store_credit_amount).toFixed(2)}
                  </span>
                </div>
                
                {request.store_credit_code && (
                  <>
                    <div className="detail-row">
                      <strong>Store Credit Code:</strong>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        color: '#5b21b6',
                        letterSpacing: '1px',
                        background: '#faf5ff',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '2px solid #7c3aed'
                      }}>
                        {request.store_credit_code}
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <strong>Credit Status:</strong>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: request.store_credit_status === 'Active' ? '#7c3aed' : '#f59e0b',
                          color: 'white'
                        }}
                      >
                        {request.store_credit_status || 'Inactive'}
                      </span>
                    </div>
                    
                    {request.store_credit_expiry && (
                      <div className="detail-row">
                        <strong>Expires On:</strong>
                        <span>{new Date(request.store_credit_expiry).toLocaleDateString()}</span>
                        <span style={{ 
                          marginLeft: '10px',
                          fontSize: '12px',
                          color: '#7c3aed'
                        }}>
                          ({Math.ceil((new Date(request.store_credit_expiry) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#faf5ff',
                  borderRadius: '6px',
                  border: '1px solid #7c3aed'
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#5b21b6' }}>
                    💡 This store credit has been generated for the approved return and sent to the customer's email.
                  </p>
                </div>
              </div>
            )}
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

