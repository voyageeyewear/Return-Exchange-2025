import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReturnPolicyModal from './ReturnPolicyModal';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    // Get order data from sessionStorage
    const storedOrder = sessionStorage.getItem('orderData');
    
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // Debug logging
      console.log('Order data:', orderData);
      console.log('isWithinReturnWindow:', orderData.isWithinReturnWindow);
      console.log('daysSinceOrder:', orderData.daysSinceOrder);
    } else {
      // Redirect back if no order data found
      navigate('/verify');
    }
  }, [orderId, navigate]);

  const handleReturnExchange = (itemId) => {
    // Check if return window has expired
    if (order && order.isWithinReturnWindow === false) {
      setShowPolicyModal(true);
      return;
    }
    navigate(`/return/${orderId}/${itemId}`);
  };

  if (!order) {
    return (
      <div className="container">
        <div className="loading">Loading order details...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <a href="/verify" className="back-link">← Back to Search</a>
      
      <div className="card">
        <div className="card-header">
          <h1>Order Details</h1>
          <p>Select an item to return or exchange</p>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="order-info">
            <div className="order-info-item">
              <strong>Order Number</strong>
              <span>{order.orderNumber}</span>
            </div>
            <div className="order-info-item">
              <strong>Customer Name</strong>
              <span>{order.customerName}</span>
            </div>
            <div className="order-info-item">
              <strong>Order Date</strong>
              <span>{new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div className="order-info-item">
              <strong>Email</strong>
              <span>{order.customerEmail}</span>
            </div>
          </div>
        </div>

        {/* Return Window Status */}
        {order.isWithinReturnWindow !== undefined && (
          <div className={`return-window-status ${order.isWithinReturnWindow ? 'eligible' : 'expired'}`}>
            {order.isWithinReturnWindow ? (
              <div style={{
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #10b981',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '24px', marginRight: '10px' }}>✅</div>
                  <h3 style={{ margin: 0, color: '#065f46' }}>Return/Exchange Eligible</h3>
                </div>
                <p style={{ margin: '5px 0', color: '#059669' }}>
                  You can return or exchange items from this order. 
                  {order.daysSinceOrder !== undefined && (
                    <span> {order.daysSinceOrder === 0 ? 'Ordered today' : `${order.daysSinceOrder} day${order.daysSinceOrder === 1 ? '' : 's'} since order`}.</span>
                  )}
                </p>
                {order.returnWindowExpiry && (
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#047857' }}>
                    Return window expires: {new Date(order.returnWindowExpiry).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #ef4444',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '24px', marginRight: '10px' }}>❌</div>
                  <h3 style={{ margin: 0, color: '#dc2626' }}>Return/Exchange Window Expired</h3>
                </div>
                <p style={{ margin: '5px 0', color: '#b91c1c' }}>
                  The 3-day return/exchange window has expired for this order.
                  {order.daysSinceOrder !== undefined && (
                    <span> Order was placed {order.daysSinceOrder} day{order.daysSinceOrder === 1 ? '' : 's'} ago.</span>
                  )}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#991b1b' }}>
                  For assistance with this order, please contact our customer service.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="order-items">
          <h3>Order Items</h3>
          
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img 
                  src={item.product_image} 
                  alt={item.product_name}
                  className="item-image"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = `https://via.placeholder.com/100/f0f0f0/666666?text=No+Image`;
                  }}
                />
                <div className="item-details">
                  <h4>{item.product_name}</h4>
                  <p><strong>SKU:</strong> {item.sku}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Price:</strong> ₹{parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <button 
                    className={`btn ${order.isWithinReturnWindow ? 'btn-primary' : 'btn-disabled'}`}
                    onClick={() => handleReturnExchange(item.id)}
                    disabled={!order.isWithinReturnWindow}
                    style={{
                      opacity: order.isWithinReturnWindow ? 1 : 0.6,
                      cursor: order.isWithinReturnWindow ? 'pointer' : 'not-allowed',
                      pointerEvents: order.isWithinReturnWindow ? 'auto' : 'none'
                    }}
                    title={!order.isWithinReturnWindow ? 'Return window has expired (3 days limit)' : 'Click to return or exchange this item'}
                  >
                    {order.isWithinReturnWindow ? 'Return/Exchange' : 'Return Window Expired'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No items found in this order.</p>
          )}
        </div>
      </div>

      {/* Return Policy Modal */}
      <ReturnPolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        orderDate={order?.orderDate}
        daysSinceOrder={order?.daysSinceOrder}
      />
    </div>
  );
}

export default OrderDetails;

