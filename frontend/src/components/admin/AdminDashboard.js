import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    console.log('🔐 AdminDashboard: Checking auth...', { hasToken: !!token });

    if (!token) {
      console.log('❌ No token found, redirecting to login...');
      navigate('/admin', { replace: true });
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, filter, search]);

  const fetchData = async (token) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch requests
      const requestsResponse = await axios.get('/api/admin/requests', {
        headers,
        params: { status: filter !== 'All' ? filter : undefined, search }
      });
      
      // Fetch stats
      const statsResponse = await axios.get('/api/admin/stats', { headers });
      
      setRequests(requestsResponse.data.requests);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('❌ Unauthorized, clearing auth and redirecting...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetchData(token);
    }
  };

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
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>Return & Exchange Portal</h1>
            <p>Welcome back, {user?.name || 'Admin'}!</p>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-container">
        {/* Shopify Integration Buttons */}
        <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <Link 
            to="/admin/shopify-orders" 
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '1em' }}
          >
            🛍️ View Shopify Orders
          </Link>
          <Link 
            to="/admin/debug-orders" 
            className="btn btn-secondary"
            style={{ padding: '12px 24px', fontSize: '1em' }}
          >
            🔍 Debug Orders
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#667eea' }}>📊</div>
            <div className="stat-details">
              <h3>{stats.total || 0}</h3>
              <p>Total Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ffc107' }}>⏳</div>
            <div className="stat-details">
              <h3>{stats.pending || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#17a2b8' }}>🔄</div>
            <div className="stat-details">
              <h3>{stats.inProgress || 0}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#28a745' }}>✅</div>
            <div className="stat-details">
              <h3>{stats.completed || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="admin-controls">
          <div className="filter-tabs">
            {['All', 'Pending', 'In Progress', 'Approved', 'Rejected', 'Completed'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by Request ID, Customer, or Order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
            <button className="btn btn-primary" onClick={handleRefresh}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="admin-card">
          <h2>Return & Exchange Requests</h2>
          
          {loading ? (
            <div className="loading">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>📭</div>
              <h3>No requests found</h3>
              <p>There are no {filter !== 'All' ? filter.toLowerCase() : ''} requests at the moment.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Customer</th>
                    <th>Order Number</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(request => (
                    <tr key={request.id}>
                      <td><strong>{request.request_id}</strong></td>
                      <td>{request.customer_name}</td>
                      <td>{request.order_number}</td>
                      <td>
                        <div>
                          <div>{request.product_name}</div>
                          {request.action_type === 'Exchange' && request.exchange_product_name && (
                            <div style={{ 
                              marginTop: '5px', 
                              padding: '4px 8px', 
                              background: '#f0f9ff', 
                              borderRadius: '4px',
                              fontSize: '0.85em',
                              border: '1px solid #0ea5e9'
                            }}>
                              🔄 → {request.exchange_product_name}
                              {request.price_difference > 0 && (
                                <span style={{ color: '#dc2626', fontWeight: '600', marginLeft: '5px' }}>
                                  (+₹{parseFloat(request.price_difference).toFixed(2)})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className={`badge badge-${request.action_type.toLowerCase()}`}>
                            {request.action_type}
                          </span>
                          {request.payment_status === 'Paid' && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '0.75em', 
                                background: '#10b981', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '3px' 
                              }}>
                                💳 Paid
                              </span>
                            </div>
                          )}
                          {request.refund_amount > 0 && request.discount_code && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '0.75em', 
                                background: '#059669', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '3px' 
                              }}>
                                🎁 Code: {request.discount_code}
                              </span>
                            </div>
                          )}
                          {request.action_type === 'Return' && request.store_credit_amount > 0 && request.store_credit_code && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '0.75em', 
                                background: '#7c3aed', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '3px' 
                              }}>
                                💳 Store Credit: {request.store_credit_code}
                              </span>
                              <div style={{ 
                                fontSize: '0.7em', 
                                color: '#6b7280', 
                                marginTop: '2px' 
                              }}>
                                ₹{parseFloat(request.store_credit_amount).toFixed(2)} • {request.store_credit_status}
                              </div>
                            </div>
                          )}
                          {request.is_within_return_window !== undefined && (
                            <div style={{ marginTop: '4px' }}>
                              <span style={{ 
                                fontSize: '0.75em', 
                                background: request.is_within_return_window ? '#10b981' : '#ef4444', 
                                color: 'white', 
                                padding: '2px 6px', 
                                borderRadius: '3px' 
                              }}>
                                {request.is_within_return_window ? '✅ Within 3 days' : '❌ Outside 3 days'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{request.reason}</td>
                      <td>{new Date(request.submitted_date).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ background: getStatusColor(request.status) }}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <Link 
                          to={`/admin/request/${request.id}`}
                          className="btn-small btn-primary"
                        >
                          View Details
                        </Link>
                      </td>
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

export default AdminDashboard;

