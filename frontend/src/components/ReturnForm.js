import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ReturnForm() {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    actionType: 'Return',
    reason: '',
    otherReason: '',
    exchangeDetails: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('orderData');
    
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // Find the selected item
      const item = orderData.items.find(i => i.id === parseInt(itemId));
      setSelectedItem(item);
    } else {
      navigate('/verify');
    }
  }, [orderId, itemId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('orderId', orderId);
      submitData.append('orderItemId', itemId);
      submitData.append('customerName', order.customerName);
      submitData.append('customerEmail', order.customerEmail);
      submitData.append('customerMobile', order.customerMobile || '');
      submitData.append('actionType', formData.actionType);
      submitData.append('reason', formData.reason);
      submitData.append('otherReason', formData.otherReason);
      submitData.append('exchangeDetails', formData.exchangeDetails);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await axios.post('/api/returns/submit', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.requestId) {
        navigate(`/confirmation/${response.data.requestId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!order || !selectedItem) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const reasons = [
    'Received wrong item',
    'Item is damaged',
    'Size doesn\'t fit',
    'Changed my mind',
    'Quality not as expected',
    'Other'
  ];

  return (
    <div className="container">
      <a href={`/order/${orderId}`} className="back-link">← Back to Order</a>
      
      <div className="card">
        <div className="card-header">
          <h1>Return / Exchange Request</h1>
          <p>Complete the form below to submit your request</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Selected Item Display */}
        <div className="order-item" style={{ marginBottom: '30px' }}>
          <img 
            src={selectedItem.product_image || '/placeholder-image.jpg'} 
            alt={selectedItem.product_name}
            className="item-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100?text=No+Image';
            }}
          />
          <div className="item-details">
            <h4>{selectedItem.product_name}</h4>
            <p><strong>SKU:</strong> {selectedItem.sku}</p>
            <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
            <p><strong>Price:</strong> ${parseFloat(selectedItem.price).toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Action Type */}
          <div className="form-group">
            <label>Action Type *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="actionType"
                  value="Return"
                  checked={formData.actionType === 'Return'}
                  onChange={handleChange}
                />
                <span>Return</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="actionType"
                  value="Exchange"
                  checked={formData.actionType === 'Exchange'}
                  onChange={handleChange}
                />
                <span>Exchange</span>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label htmlFor="reason">Reason for {formData.actionType} *</label>
            <select
              id="reason"
              name="reason"
              className="form-control"
              value={formData.reason}
              onChange={handleChange}
              required
            >
              <option value="">Select a reason</option>
              {reasons.map((reason, index) => (
                <option key={index} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Other Reason Text */}
          {formData.reason === 'Other' && (
            <div className="form-group">
              <label htmlFor="otherReason">Please specify *</label>
              <textarea
                id="otherReason"
                name="otherReason"
                className="form-control"
                placeholder="Please provide more details about your reason"
                value={formData.otherReason}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {/* Exchange Details */}
          {formData.actionType === 'Exchange' && (
            <div className="form-group">
              <label htmlFor="exchangeDetails">Exchange Details (Size/Color/Other)</label>
              <textarea
                id="exchangeDetails"
                name="exchangeDetails"
                className="form-control"
                placeholder="e.g., Size L instead of M, Black color instead of White"
                value={formData.exchangeDetails}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Image Upload */}
          <div className="form-group">
            <label>Upload Image (Optional)</label>
            <div className="file-upload">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label htmlFor="image" className="file-upload-label">
                📷 Click to upload an image (Max 5MB)
              </label>
              {imagePreview && (
                <div className="file-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReturnForm;

