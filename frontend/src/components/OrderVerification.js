import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function OrderVerification() {
  const [formData, setFormData] = useState({
    orderNumber: '',
    contact: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/orders/verify', formData);
      
      if (response.data.order) {
        // Store order data in sessionStorage for the next page
        sessionStorage.setItem('orderData', JSON.stringify(response.data.order));
        navigate(`/order/${response.data.order.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <a href="/" className="back-link">← Back to Home</a>
      
      <div className="card">
        <div className="card-header">
          <h1>Find Your Order</h1>
          <p>Enter your Shopify order number and contact information</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="orderNumber">Shopify Order Number *</label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              className="form-control"
              placeholder="e.g., #1001 or 1001"
              value={formData.orderNumber}
              onChange={handleChange}
              required
            />
            <small style={{ color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block' }}>
              Find this in your Shopify order confirmation email
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="contact">Email or Phone Number *</label>
            <input
              type="text"
              id="contact"
              name="contact"
              className="form-control"
              placeholder="Email or phone from your Shopify order"
              value={formData.contact}
              onChange={handleChange}
              required
            />
            <small style={{ color: '#666', fontSize: '0.85em', marginTop: '5px', display: 'block' }}>
              Enter the email or phone number you used when placing the order
            </small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Find My Order'}
          </button>
        </form>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #4CAF50' }}>
          <h3 style={{ marginBottom: '15px', color: '#333', fontSize: '1.2em' }}>✅ How to Find Your Order</h3>
          <ol style={{ color: '#666', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Order Number:</strong> Check your Shopify order confirmation email (e.g., #1001, #1002)</li>
            <li><strong>Contact Info:</strong> Use the email or phone number from your order</li>
            <li><strong>Phone Format:</strong> Any format works - (123) 456-7890, 1234567890, +1-123-456-7890</li>
          </ol>
          <div style={{ marginTop: '15px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #ddd' }}>
            <strong style={{ color: '#4CAF50' }}>🛍️ Live Shopify Integration</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em', color: '#666' }}>
              Your real products and orders are fetched directly from your Shopify store!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderVerification;

