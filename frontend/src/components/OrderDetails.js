import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    // Get order data from sessionStorage
    const storedOrder = sessionStorage.getItem('orderData');
    
    if (storedOrder) {
      setOrder(JSON.parse(storedOrder));
    } else {
      // Redirect back if no order data found
      navigate('/verify');
    }
  }, [orderId, navigate]);

  const handleReturnExchange = (itemId) => {
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

        <div className="order-items">
          <h3>Order Items</h3>
          
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="order-item">
                <img 
                  src={item.product_image || '/placeholder-image.jpg'} 
                  alt={item.product_name}
                  className="item-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                  }}
                />
                <div className="item-details">
                  <h4>{item.product_name}</h4>
                  <p><strong>SKU:</strong> {item.sku}</p>
                  <p><strong>Quantity:</strong> {item.quantity}</p>
                  <p><strong>Price:</strong> ${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="item-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleReturnExchange(item.id)}
                  >
                    Return/Exchange
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No items found in this order.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;

