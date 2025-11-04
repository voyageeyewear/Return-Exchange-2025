import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token) {
      navigate('/admin', { replace: true });
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, filter, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDateDropdown && !event.target.closest('.date-range-dropdown')) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDateDropdown]);

  const fetchData = async (token) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const requestsResponse = await axios.get('/api/admin/requests', {
        headers,
        params: { status: filter !== 'All' ? filter : undefined, search }
      });
      
      const statsResponse = await axios.get('/api/admin/stats', { headers });
      
      setRequests(requestsResponse.data.requests);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('❌ Dashboard fetch error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
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

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Pending': 'status-pending',
      'Approved': 'status-approved',
      'Rejected': 'status-rejected',
      'In Progress': 'status-progress',
      'Completed': 'status-completed'
    };
    return statusMap[status] || 'status-pending';
  };

  const getRefundStatusClass = (status) => {
    if (status === 'Pending') return 'refund-pending';
    if (status === 'NA' || status === 'Not Required') return 'refund-na';
    return 'refund-completed';
  };

  // Filter requests by date range
  const filterByDateRange = (requests) => {
    if (dateRange === 'all') {
      console.log('📅 Date filter: All Time, showing all', requests.length, 'requests');
      return requests;
    }
    
    const now = new Date();
    const daysMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
      '6months': 180
    };
    
    const days = daysMap[dateRange];
    if (!days) return requests;
    
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    console.log('📅 Filtering for last', days, 'days. Cutoff date:', cutoffDate.toLocaleDateString());
    
    const filtered = requests.filter(request => {
      const requestDate = new Date(request.submitted_date);
      return requestDate >= cutoffDate;
    });
    
    console.log('📊 Filtered results:', filtered.length, 'of', requests.length, 'requests');
    return filtered;
  };

  const filteredRequests = filterByDateRange(requests);

  const getFilteredCount = (filterType) => {
    if (filterType === 'All') return stats.total || 0;
    if (filterType === 'OPEN') return stats.pending || 0;
    if (filterType === 'Closed') return stats.completed || 0;
    if (filterType === 'FAILED') return stats.rejected || 0;
    return 0;
  };

  const getDateRangeLabel = () => {
    const labels = {
      'all': 'All Time',
      '7days': 'Last 7 days',
      '30days': 'Last 30 days',
      '90days': 'Last 90 days',
      '6months': 'Last 6 months'
    };
    return labels[dateRange] || 'Date range';
  };

  return (
    <div className="modern-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Return & Exchange Portal</h1>
          <p>Welcome back, {user?.name || 'Admin'}!</p>
        </div>
        <div className="header-right">
          <Link to="/admin/shopify-orders" className="header-btn">
            🛍️ Shopify Orders
          </Link>
          <Link to="/admin/debug-orders" className="header-btn">
            🔍 Debug
          </Link>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Filter Tabs */}
        <div className="filter-tabs-modern">
          <div className="tabs-left">
            <button
              className={`tab-modern ${filter === 'All' ? 'active' : ''}`}
              onClick={() => setFilter('All')}
            >
              All Requests ({getFilteredCount('All')})
            </button>
            <button
              className={`tab-modern ${filter === 'Pending' ? 'active' : ''}`}
              onClick={() => setFilter('Pending')}
            >
              OPEN({getFilteredCount('OPEN')})
            </button>
            <button
              className={`tab-modern ${filter === 'Completed' ? 'active' : ''}`}
              onClick={() => setFilter('Completed')}
            >
              Closed({getFilteredCount('Closed')})
            </button>
            <button
              className={`tab-modern ${filter === 'Rejected' ? 'active' : ''}`}
              onClick={() => setFilter('Rejected')}
            >
              FAILED({getFilteredCount('FAILED')})
            </button>
          </div>
          <button className="add-view-btn">
            + Add view (3/10)
          </button>
        </div>

        {/* Search and Filters */}
        <div className="search-filters-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="date-range-dropdown">
            <button 
              className="filter-btn"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
            >
              {getDateRangeLabel()} ▼
            </button>
            {showDateDropdown && (
              <div className="date-dropdown-menu">
                <button
                  className={`dropdown-item ${dateRange === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange('all');
                    setShowDateDropdown(false);
                  }}
                >
                  All Time
                </button>
                <button
                  className={`dropdown-item ${dateRange === '7days' ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange('7days');
                    setShowDateDropdown(false);
                  }}
                >
                  Last 7 days
                </button>
                <button
                  className={`dropdown-item ${dateRange === '30days' ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange('30days');
                    setShowDateDropdown(false);
                  }}
                >
                  Last 30 days
                </button>
                <button
                  className={`dropdown-item ${dateRange === '90days' ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange('90days');
                    setShowDateDropdown(false);
                  }}
                >
                  Last 90 days
                </button>
                <button
                  className={`dropdown-item ${dateRange === '6months' ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange('6months');
                    setShowDateDropdown(false);
                  }}
                >
                  Last 6 months
                </button>
              </div>
            )}
          </div>
          <button className="filter-btn">Shipment status ▼</button>
          <button className="filter-btn">
            All filters <span className="filter-icon">⚙️</span>
          </button>
          <button className="clear-btn" onClick={() => {
            setDateRange('all');
            setSearch('');
            setFilter('All');
          }}>Clear all</button>
          <button className="actions-btn">Actions ▼</button>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> requests
            {dateRange !== 'all' && <span> (filtered by {getDateRangeLabel()})</span>}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No requests found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" />
                  </th>
                  <th>Requested on</th>
                  <th>RAN</th>
                  <th>Order ID</th>
                  <th>AWB</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Refund Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="checkbox-col">
                      <input type="checkbox" />
                    </td>
                    <td className="date-col">
                      {new Date(request.submitted_date).toLocaleString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <Link to={`/admin/request/${request.id}`} className="link-blue">
                        {request.request_id}
                      </Link>
                    </td>
                    <td>#{request.order_number}</td>
                    <td>
                      {request.shopify_order_id ? (
                        <span className="link-blue">{request.shopify_order_id.substring(0, 14)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`type-badge ${request.action_type.toLowerCase()}`}>
                        {request.action_type}
                      </span>
                    </td>
                    <td>
                      <span className="reason-text">
                        {request.reason || 'other reason'}
                      </span>
                    </td>
                    <td>
                      <div className="product-cell">
                        {request.product_image ? (
                          <img 
                            src={request.product_image} 
                            alt={request.product_name}
                            className="product-thumb"
                          />
                        ) : (
                          <div className="product-placeholder">👓</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status === 'Pending' ? 'Pickup created' : 
                         request.status === 'In Progress' ? 'Creating pickup' :
                         request.status === 'Completed' ? 'Pickup created' :
                         request.status === 'Approved' ? 'Pickup created' :
                         'Pickup generated'}
                      </span>
                    </td>
                    <td>
                      <span className={`refund-badge ${getRefundStatusClass(request.refund_status || 'Pending')}`}>
                        {request.refund_status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/admin/request/${request.id}`}
                        className="action-btn"
                      >
                        Close
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
  );
}

export default AdminDashboard;
