import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

function ShopifyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchShopifyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchShopifyOrders = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('/api/shopify/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      
      setOrders(response.data.orders);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch Shopify orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Shopify Orders</h1>
            <p>Real orders from your Shopify store</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Recent Orders ({orders.length})</h2>
            <button className="btn btn-primary" onClick={fetchShopifyOrders}>
              🔄 Refresh
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading Shopify orders...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>🛍️</div>
              <h3>No orders found</h3>
              <p>No orders available in your Shopify store yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td><strong>{order.orderNumber}</strong></td>
                      <td>{order.customerName}</td>
                      <td>{order.customerEmail}</td>
                      <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td>{order.itemCount} items</td>
                      <td>${parseFloat(order.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopifyOrders;

