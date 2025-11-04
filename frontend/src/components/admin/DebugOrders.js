import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

function DebugOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Fetching debug orders...');
      const response = await axios.get('/api/debug/orders/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Debug orders response:', response.data);
      setOrders(response.data.orders || []);
      setError('');
    } catch (err) {
      console.error('❌ Debug orders error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to fetch orders';
      const errorDetails = err.response?.data?.details ? `\n${err.response.data.details}` : '';
      setError(errorMsg + errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied: ${text}`);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>🔍 Debug Orders</h1>
            <p>View all order details to help with troubleshooting</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>All Orders with Contact Details ({filteredOrders.length})</h2>
            <button className="btn btn-primary" onClick={fetchOrders}>
              🔄 Refresh
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by order number, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
            <strong>💡 How to use this page:</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
              Find your order number below, then use the EXACT email or phone shown to test the return system.
              Click any value to copy it to your clipboard.
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ whiteSpace: 'pre-wrap' }}>
              <strong>Error:</strong> {error}
              <div style={{ marginTop: '10px' }}>
                <button className="btn btn-primary" onClick={fetchOrders} style={{ fontSize: '0.9em' }}>
                  🔄 Try Again
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading orders from Shopify...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>📭</div>
              <h3>No orders found</h3>
              <p>No orders match your search criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {filteredOrders.map((order, index) => (
                <div key={index} style={{ 
                  marginBottom: '20px', 
                  padding: '20px', 
                  background: '#f9f9f9', 
                  borderRadius: '8px',
                  border: '2px solid #4CAF50'
                }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '15px' 
                  }}>
                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Order Number
                      </strong>
                      <div 
                        onClick={() => copyToClipboard(order.orderNumber)}
                        style={{ 
                          padding: '10px', 
                          background: '#fff', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: '1px solid #ddd',
                          fontWeight: 'bold',
                          fontSize: '1.1em',
                          color: '#333'
                        }}
                        title="Click to copy"
                      >
                        {order.orderNumber} 📋
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Customer Email
                      </strong>
                      <div 
                        onClick={() => order.customerEmail && copyToClipboard(order.customerEmail)}
                        style={{ 
                          padding: '10px', 
                          background: order.customerEmail ? '#fff' : '#ffebee', 
                          borderRadius: '4px',
                          cursor: order.customerEmail ? 'pointer' : 'default',
                          border: '1px solid #ddd',
                          fontSize: '0.95em'
                        }}
                        title={order.customerEmail ? "Click to copy" : "No email"}
                      >
                        {order.customerEmail || '❌ No email'} {order.customerEmail && '📋'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Customer Name
                      </strong>
                      <div style={{ 
                        padding: '10px', 
                        background: '#fff', 
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        fontSize: '0.95em'
                      }}>
                        {order.customerName || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Customer Phone
                      </strong>
                      <div 
                        onClick={() => order.phone && copyToClipboard(order.phone)}
                        style={{ 
                          padding: '10px', 
                          background: order.phone ? '#fff' : '#ffebee', 
                          borderRadius: '4px',
                          cursor: order.phone ? 'pointer' : 'default',
                          border: '1px solid #ddd',
                          fontSize: '0.95em'
                        }}
                        title={order.phone ? "Click to copy" : "No phone"}
                      >
                        {order.phone || '❌ No phone'} {order.phone && '📋'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Billing Phone
                      </strong>
                      <div 
                        onClick={() => order.billingPhone && copyToClipboard(order.billingPhone)}
                        style={{ 
                          padding: '10px', 
                          background: order.billingPhone ? '#fff' : '#f5f5f5', 
                          borderRadius: '4px',
                          cursor: order.billingPhone ? 'pointer' : 'default',
                          border: '1px solid #ddd',
                          fontSize: '0.95em'
                        }}
                        title={order.billingPhone ? "Click to copy" : "No billing phone"}
                      >
                        {order.billingPhone || 'None'} {order.billingPhone && '📋'}
                      </div>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: '#666', fontSize: '0.85em', marginBottom: '5px' }}>
                        Shipping Phone
                      </strong>
                      <div 
                        onClick={() => order.shippingPhone && copyToClipboard(order.shippingPhone)}
                        style={{ 
                          padding: '10px', 
                          background: order.shippingPhone ? '#fff' : '#f5f5f5', 
                          borderRadius: '4px',
                          cursor: order.shippingPhone ? 'pointer' : 'default',
                          border: '1px solid #ddd',
                          fontSize: '0.95em'
                        }}
                        title={order.shippingPhone ? "Click to copy" : "No shipping phone"}
                      >
                        {order.shippingPhone || 'None'} {order.shippingPhone && '📋'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
                    <strong style={{ color: '#2e7d32' }}>✅ Test this order:</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                      Use order number: <strong>{order.orderNumber}</strong> with email: <strong>{order.customerEmail || 'No email available'}</strong>
                      {order.phone && <> or phone: <strong>{order.phone}</strong></>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DebugOrders;

