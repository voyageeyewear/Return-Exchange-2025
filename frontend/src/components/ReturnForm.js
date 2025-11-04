import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReturnPolicyModal from './ReturnPolicyModal';

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
    image: null,
    exchangeProduct: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState(null);
  const [priceDifference, setPriceDifference] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: 'UPI',
    upiId: '',
    transactionId: ''
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [creditOption, setCreditOption] = useState('next_order'); // 'next_order' or 'apply_now'
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem('orderData');
    
    if (storedOrder) {
      const orderData = JSON.parse(storedOrder);
      setOrder(orderData);
      
      // Find the selected item
      const item = orderData.items.find(i => i.id === parseInt(itemId));
      setSelectedItem(item);

      // Show policy modal if return window has expired
      if (orderData.isWithinReturnWindow === false) {
        setShowPolicyModal(true);
      }
    } else {
      navigate('/verify');
    }
  }, [orderId, itemId, navigate]);

  // Fetch products when action type is Exchange
  useEffect(() => {
    if (formData.actionType === 'Exchange') {
      fetchExchangeProducts();
    } else {
      setProducts([]);
      setFilteredProducts([]);
      setSelectedExchangeProduct(null);
      setPriceDifference(0);
      setShowPayment(false);
      setShowProductModal(false);
      setCurrentPage(1);
    }
  }, [formData.actionType]);

  // Filter products based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product => 
        product.title.toLowerCase().includes(query) ||
        product.variants.some(v => v.title.toLowerCase().includes(query) || v.sku?.toLowerCase().includes(query))
      );
      setFilteredProducts(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, products]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showProductModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showProductModal]);

  // Scroll to top when page changes
  useEffect(() => {
    const scrollContainer = document.getElementById('products-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const fetchExchangeProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await axios.get('/api/returns/exchange-products');
      const productsData = response.data.products || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load exchange products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleExchangeProductSelect = (productId, variantId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return;

    const variant = product.variants.find(v => v.id === parseInt(variantId));
    if (!variant) return;

    const exchangeProduct = {
      productId: product.id,
      variantId: variant.id,
      name: `${product.title} - ${variant.title}`,
      sku: variant.sku,
      price: parseFloat(variant.price),
      image: product.image
    };

    setSelectedExchangeProduct(exchangeProduct);

    // Calculate price difference
    const originalPrice = parseFloat(selectedItem?.price || 0);
    const newPrice = exchangeProduct.price;
    const difference = newPrice - originalPrice;
    setPriceDifference(difference);

    // Show payment if there's a price difference
    if (difference > 0) {
      setShowPayment(true);
    } else {
      setShowPayment(false);
      setPaymentData({ method: 'UPI', upiId: '', transactionId: '' });
    }

    // Close modal and reset search
    setShowProductModal(false);
    setSearchQuery('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If action type changes, reset reason and exchange product
    if (name === 'actionType') {
      setFormData({
        ...formData,
        [name]: value,
        reason: '' // Reset reason when action type changes
      });
      setSelectedExchangeProduct(null);
      setPriceDifference(0);
      setShowPayment(false);
      setCreditOption('next_order'); // Reset credit option
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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

    // Validate return window
    if (order && order.isWithinReturnWindow === false) {
      setError('The 3-day return/exchange window has expired for this order. Please contact customer service for assistance.');
      return;
    }

    // Validate exchange product selection
    if (formData.actionType === 'Exchange') {
      if (formData.reason === 'Exchange with different items' && !selectedExchangeProduct) {
        setError('Please select a product to exchange with');
        return;
      }
      if (formData.reason === 'Exchange' && !selectedExchangeProduct) {
        setError('Exchange product not set. Please try again.');
        return;
      }
    }

    // Validate payment for price difference
    if (showPayment && priceDifference > 0) {
      if (paymentData.method === 'UPI' && !paymentData.upiId) {
        setError('Please enter your UPI ID');
        return;
      }
      if (!paymentData.transactionId) {
        setError('Please enter transaction ID after completing payment');
        return;
      }
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      // Shopify integrated data
      submitData.append('orderNumber', order.orderNumber);
      submitData.append('shopifyOrderId', order.id || '');
      submitData.append('shopifyItemId', selectedItem.id);
      submitData.append('productName', selectedItem.product_name);
      submitData.append('productSku', selectedItem.sku);
      submitData.append('productPrice', selectedItem.price);
      submitData.append('customerName', order.customerName);
      submitData.append('customerEmail', order.customerEmail);
      submitData.append('customerMobile', order.customerMobile || '');
      submitData.append('actionType', formData.actionType);
      submitData.append('reason', formData.reason);
      submitData.append('otherReason', formData.otherReason);
      submitData.append('exchangeDetails', formData.exchangeDetails);

      // Exchange product data
      if (formData.actionType === 'Exchange' && selectedExchangeProduct) {
        submitData.append('exchangeProductId', selectedExchangeProduct.variantId);
        submitData.append('exchangeProductName', selectedExchangeProduct.name);
        submitData.append('exchangeProductSku', selectedExchangeProduct.sku);
        submitData.append('exchangeProductPrice', selectedExchangeProduct.price);
        submitData.append('priceDifference', priceDifference);

        // Credit option (when price difference is negative)
        if (priceDifference < 0) {
          submitData.append('creditOption', creditOption);
        }

        // Payment data
        if (priceDifference > 0 && paymentData.transactionId) {
          submitData.append('paymentStatus', 'Paid');
          submitData.append('paymentMethod', paymentData.method);
          submitData.append('paymentTransactionId', paymentData.transactionId);
        } else {
          submitData.append('paymentStatus', 'Not Required');
        }
      }
      
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
      console.error('Submit error:', err);
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

  const returnReasons = [
    'Received wrong item',
    'Item is damaged',
    'Size doesn\'t fit',
    'Changed my mind',
    'Quality not as expected',
    'Other'
  ];

  const exchangeReasons = [
    'Received wrong item',
    'Item is damaged',
    "Size doesn't fit",
    'Changed my mind',
    'Quality not as expected',
    'Exchange with different items',
    'Exchange',
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

        {/* Return Window Status */}
        {order && order.isWithinReturnWindow !== undefined && (
          <div className={`return-window-status ${order.isWithinReturnWindow ? 'eligible' : 'expired'}`}>
            {order.isWithinReturnWindow ? (
              <div style={{
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #10b981',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', marginRight: '8px' }}>✅</div>
                  <h4 style={{ margin: 0, color: '#065f46' }}>Return/Exchange Eligible</h4>
                </div>
                <p style={{ margin: '5px 0', color: '#059669', fontSize: '14px' }}>
                  You can return or exchange this item. 
                  {order.daysSinceOrder !== undefined && (
                    <span> {order.daysSinceOrder === 0 ? 'Ordered today' : `${order.daysSinceOrder} day${order.daysSinceOrder === 1 ? '' : 's'} since order`}.</span>
                  )}
                </p>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #ef4444',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '20px', marginRight: '8px' }}>❌</div>
                  <h4 style={{ margin: 0, color: '#dc2626' }}>Return Window Expired</h4>
                </div>
                <p style={{ margin: '5px 0', color: '#b91c1c', fontSize: '14px' }}>
                  The 3-day return/exchange window has expired for this order.
                  {order.daysSinceOrder !== undefined && (
                    <span> Order was placed {order.daysSinceOrder} day{order.daysSinceOrder === 1 ? '' : 's'} ago.</span>
                  )}
                </p>
                <p style={{ margin: '5px 0', fontSize: '13px', color: '#991b1b' }}>
                  For assistance, please contact our customer service.
                </p>
              </div>
            )}
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
              onChange={(e) => {
                const newReason = e.target.value;
                setFormData({
                  ...formData,
                  reason: newReason
                });

                // Handle exchange with same product
                if (formData.actionType === 'Exchange' && newReason === 'Exchange') {
                  // Auto-select same product for exchange
                  const sameProduct = {
                    productId: selectedItem.product_id || selectedItem.id,
                    variantId: selectedItem.id,
                    name: selectedItem.product_name,
                    sku: selectedItem.sku,
                    price: parseFloat(selectedItem.price),
                    image: selectedItem.product_image
                  };
                  setSelectedExchangeProduct(sameProduct);
                  setPriceDifference(0);
                  setShowPayment(false);
                  setShowProductModal(false); // Close modal if open
                } else if (formData.actionType === 'Exchange' && newReason === 'Exchange with different items') {
                  // Clear selection if switching to different items
                  setSelectedExchangeProduct(null);
                  setShowProductModal(false); // Close modal if open
                }
              }}
              required
            >
              <option value="">Select a reason</option>
              {(formData.actionType === 'Exchange' ? exchangeReasons : returnReasons).map((reason, index) => (
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

          {/* Exchange Product Selection - Only for "Exchange with different items" */}
          {formData.actionType === 'Exchange' && formData.reason === 'Exchange with different items' && (
            <>
              <div className="form-group">
                <label>Select Exchange Product *</label>
                {loadingProducts ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading products...
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setShowProductModal(true);
                      setCurrentPage(1);
                    }}
                    style={{ 
                      padding: '15px', 
                      fontSize: '16px',
                      background: selectedExchangeProduct ? '#10b981' : '#667eea',
                      border: 'none'
                    }}
                  >
                    {selectedExchangeProduct ? '✓ Product Selected - Click to Change' : '🔍 Browse & Select Exchange Product'}
                  </button>
                )}
              </div>

          {/* Exchange with Same Product Confirmation */}
          {formData.actionType === 'Exchange' && formData.reason === 'Exchange' && selectedExchangeProduct && (
            <div style={{ 
              background: '#d1fae5', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '2px solid #10b981'
            }}>
              <h4 style={{ marginBottom: '10px', color: '#065f46' }}>✓ Exchange with Same Product</h4>
              <p style={{ margin: 0, color: '#065f46' }}>
                You will receive a replacement of the same product: <strong>{selectedExchangeProduct.name}</strong>
              </p>
            </div>
          )}

              {/* Selected Exchange Product Display - Only for different items */}
              {formData.actionType === 'Exchange' && formData.reason === 'Exchange with different items' && selectedExchangeProduct && (
                <div style={{ 
                  background: '#f0f9ff', 
                  padding: window.innerWidth <= 768 ? '12px' : '15px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '2px solid #0ea5e9'
                }}>
                  <h4 style={{ 
                    marginBottom: window.innerWidth <= 768 ? '12px' : '10px', 
                    color: '#0c4a6e',
                    fontSize: window.innerWidth <= 768 ? '16px' : '18px'
                  }}>Exchange Product Selected</h4>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                    gap: window.innerWidth <= 768 ? '12px' : '15px', 
                    alignItems: window.innerWidth <= 768 ? 'stretch' : 'center'
                  }}>
                    {selectedExchangeProduct.image && (
                      <img 
                        src={selectedExchangeProduct.image} 
                        alt={selectedExchangeProduct.name}
                        style={{ 
                          width: window.innerWidth <= 768 ? '100%' : '80px', 
                          height: window.innerWidth <= 768 ? 'auto' : '80px',
                          maxHeight: window.innerWidth <= 768 ? '200px' : '80px',
                          objectFit: 'cover', 
                          borderRadius: '6px',
                          alignSelf: window.innerWidth <= 768 ? 'center' : 'flex-start'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '5px 0', 
                        fontWeight: '600',
                        fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word'
                      }}>{selectedExchangeProduct.name}</p>
                      <p style={{ 
                        margin: '5px 0',
                        fontSize: window.innerWidth <= 768 ? '13px' : '14px'
                      }}><strong>SKU:</strong> {selectedExchangeProduct.sku}</p>
                      <p style={{ 
                        margin: '5px 0',
                        fontSize: window.innerWidth <= 768 ? '15px' : '16px',
                        fontWeight: '600'
                      }}><strong>Price:</strong> ₹{selectedExchangeProduct.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Price Difference Display */}
                  {priceDifference !== 0 && (
                    <div style={{ 
                      marginTop: window.innerWidth <= 768 ? '12px' : '15px', 
                      padding: window.innerWidth <= 768 ? '12px' : '15px', 
                      background: priceDifference > 0 ? '#fef3c7' : '#d1fae5',
                      borderRadius: '6px',
                      border: `2px solid ${priceDifference > 0 ? '#f59e0b' : '#10b981'}`
                    }}>
                      {priceDifference > 0 ? (
                        <>
                          <p style={{ 
                            margin: 0, 
                            fontWeight: '600', 
                            fontSize: window.innerWidth <= 768 ? '15px' : '16px',
                            lineHeight: '1.4'
                          }}>
                            💰 Additional Payment Required: <span style={{ color: '#dc2626' }}>₹{priceDifference.toFixed(2)}</span>
                          </p>
                          <p style={{ 
                            margin: '8px 0 0 0', 
                            fontSize: window.innerWidth <= 768 ? '13px' : '14px', 
                            color: '#666',
                            wordBreak: 'break-word'
                          }}>
                            Original: ₹{parseFloat(selectedItem?.price || 0).toFixed(2)} → New: ₹{selectedExchangeProduct.price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p style={{ 
                            margin: 0, 
                            fontWeight: '600', 
                            fontSize: window.innerWidth <= 768 ? '15px' : '16px', 
                            marginBottom: window.innerWidth <= 768 ? '12px' : '15px',
                            lineHeight: '1.4'
                          }}>
                            💵 Credit Amount: <span style={{ color: '#059669', fontSize: window.innerWidth <= 768 ? '20px' : '18px' }}>₹{Math.abs(priceDifference).toFixed(2)}</span>
                          </p>
                          
                          {/* Credit Usage Options */}
                          <div style={{
                            background: '#ffffff',
                            padding: window.innerWidth <= 768 ? '12px' : '15px',
                            borderRadius: '8px',
                            marginTop: window.innerWidth <= 768 ? '8px' : '10px',
                            border: '2px solid #10b981'
                          }}>
                            <p style={{ 
                              margin: '0 0 12px 0', 
                              fontSize: window.innerWidth <= 768 ? '13px' : '14px', 
                              fontWeight: '600', 
                              color: '#065f46',
                              lineHeight: '1.4'
                            }}>
                              How would you like to use this credit?
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth <= 768 ? '12px' : '10px' }}>
                              <label style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                padding: window.innerWidth <= 768 ? '14px' : '12px',
                                borderRadius: '8px',
                                border: `2px solid ${creditOption === 'next_order' ? '#10b981' : '#e0e0e0'}`,
                                background: creditOption === 'next_order' ? '#f0fdf4' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: window.innerWidth <= 768 ? '60px' : 'auto'
                              }}>
                                <input
                                  type="radio"
                                  name="creditOption"
                                  value="next_order"
                                  checked={creditOption === 'next_order'}
                                  onChange={(e) => setCreditOption(e.target.value)}
                                  style={{ 
                                    marginRight: window.innerWidth <= 768 ? '10px' : '12px', 
                                    cursor: 'pointer',
                                    marginTop: '2px',
                                    flexShrink: 0,
                                    width: window.innerWidth <= 768 ? '20px' : '18px',
                                    height: window.innerWidth <= 768 ? '20px' : '18px'
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ 
                                    margin: 0, 
                                    fontWeight: '600', 
                                    fontSize: window.innerWidth <= 768 ? '14px' : '14px', 
                                    color: '#065f46',
                                    lineHeight: '1.3',
                                    marginBottom: '4px'
                                  }}>
                                    🎁 Get Discount Code for Next Order
                                  </p>
                                  <p style={{ 
                                    margin: 0, 
                                    fontSize: window.innerWidth <= 768 ? '12px' : '12px', 
                                    color: '#059669',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word'
                                  }}>
                                    Receive a discount code worth ₹{Math.abs(priceDifference).toFixed(2)} valid for 90 days
                                  </p>
                                </div>
                              </label>

                              <label style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                padding: window.innerWidth <= 768 ? '14px' : '12px',
                                borderRadius: '8px',
                                border: `2px solid ${creditOption === 'apply_now' ? '#10b981' : '#e0e0e0'}`,
                                background: creditOption === 'apply_now' ? '#f0fdf4' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: window.innerWidth <= 768 ? '60px' : 'auto'
                              }}>
                                <input
                                  type="radio"
                                  name="creditOption"
                                  value="apply_now"
                                  checked={creditOption === 'apply_now'}
                                  onChange={(e) => setCreditOption(e.target.value)}
                                  style={{ 
                                    marginRight: window.innerWidth <= 768 ? '10px' : '12px', 
                                    cursor: 'pointer',
                                    marginTop: '2px',
                                    flexShrink: 0,
                                    width: window.innerWidth <= 768 ? '20px' : '18px',
                                    height: window.innerWidth <= 768 ? '20px' : '18px'
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ 
                                    margin: 0, 
                                    fontWeight: '600', 
                                    fontSize: window.innerWidth <= 768 ? '14px' : '14px', 
                                    color: '#065f46',
                                    lineHeight: '1.3',
                                    marginBottom: '4px'
                                  }}>
                                    💳 Apply Credit to This Exchange
                                  </p>
                                  <p style={{ 
                                    margin: 0, 
                                    fontSize: window.innerWidth <= 768 ? '12px' : '12px', 
                                    color: '#059669',
                                    lineHeight: '1.4',
                                    wordBreak: 'break-word'
                                  }}>
                                    The ₹{Math.abs(priceDifference).toFixed(2)} credit will be applied to this exchange transaction
                                  </p>
                                </div>
                              </label>
                            </div>
                          </div>
                          
                          <p style={{ 
                            margin: window.innerWidth <= 768 ? '10px 0 0 0' : '12px 0 0 0', 
                            fontSize: window.innerWidth <= 768 ? '13px' : '14px', 
                            color: '#666',
                            wordBreak: 'break-word',
                            lineHeight: '1.4'
                          }}>
                            Original: ₹{parseFloat(selectedItem?.price || 0).toFixed(2)} → New: ₹{selectedExchangeProduct.price.toFixed(2)}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Section - Only for different items */}
              {formData.actionType === 'Exchange' && formData.reason === 'Exchange with different items' && showPayment && priceDifference > 0 && (
                <div style={{ 
                  background: '#fef3c7', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '2px solid #f59e0b'
                }}>
                  <h4 style={{ marginBottom: '15px', color: '#92400e' }}>💳 Payment Required</h4>
                  <p style={{ marginBottom: '15px', color: '#92400e' }}>
                    Please complete the payment of <strong>₹{priceDifference.toFixed(2)}</strong> using one of the methods below:
                  </p>

                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select
                      className="form-control"
                      value={paymentData.method}
                      onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                      required
                    >
                      <option value="UPI">UPI</option>
                      <option value="Card">Debit/Credit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  {paymentData.method === 'UPI' && (
                    <div className="form-group">
                      <label>UPI ID *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="yourname@upi"
                        value={paymentData.upiId}
                        onChange={(e) => setPaymentData({ ...paymentData, upiId: e.target.value })}
                        required
                      />
                      <small style={{ color: '#92400e', display: 'block', marginTop: '5px' }}>
                        Payment QR/Link will be sent to complete payment
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Transaction ID / Reference Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter transaction ID after payment"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                      required
                    />
                    <small style={{ color: '#92400e', display: 'block', marginTop: '5px' }}>
                      Complete payment first, then enter the transaction ID here
                    </small>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Exchange Details - Show for all exchange requests */}
          {formData.actionType === 'Exchange' && (
            <div className="form-group">
              <label htmlFor="exchangeDetails">Additional Exchange Notes (Optional)</label>
              <textarea
                id="exchangeDetails"
                name="exchangeDetails"
                className="form-control"
                placeholder="Any additional details about the exchange"
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
            className={`btn btn-primary btn-block ${!order?.isWithinReturnWindow ? 'btn-disabled' : ''}`}
            disabled={loading || !order?.isWithinReturnWindow}
            style={{
              opacity: order?.isWithinReturnWindow ? 1 : 0.6,
              cursor: order?.isWithinReturnWindow ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Submitting...' : 
             !order?.isWithinReturnWindow ? 'Return Window Expired' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: window.innerWidth <= 768 ? '0' : '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: window.innerWidth <= 768 ? '0' : '12px',
            maxWidth: window.innerWidth <= 768 ? '100%' : '900px',
            width: '100%',
            maxHeight: window.innerWidth <= 768 ? '100vh' : '90vh',
            height: window.innerWidth <= 768 ? '100vh' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: window.innerWidth <= 768 ? '15px 20px' : '20px 30px',
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: window.innerWidth <= 768 ? '18px' : '24px', 
                fontWeight: '600',
                lineHeight: '1.3'
              }}>
                Exchange with other items
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: window.innerWidth <= 768 ? '24px' : '28px',
                  cursor: 'pointer',
                  padding: '0',
                  width: window.innerWidth <= 768 ? '28px' : '32px',
                  height: window.innerWidth <= 768 ? '28px' : '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  flexShrink: 0
                }}
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ 
              padding: window.innerWidth <= 768 ? '15px 20px' : '20px 30px', 
              borderBottom: '1px solid #e0e0e0',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: window.innerWidth <= 768 ? '8px' : '10px' }}>
                <input
                  type="text"
                  placeholder="Search products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: window.innerWidth <= 768 ? '10px 15px' : '12px 20px',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#ddd'}
                />
                <button
                  style={{
                    padding: window.innerWidth <= 768 ? '10px 20px' : '12px 30px',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  SEARCH
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div 
              id="products-scroll-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: window.innerWidth <= 768 ? '15px' : '30px',
                WebkitOverflowScrolling: 'touch'
              }}>
              {(() => {
                // Flatten products with variants for pagination
                const allProductVariants = filteredProducts.flatMap(product =>
                  product.variants.map(variant => ({ product, variant }))
                );
                
                // Calculate pagination
                const totalPages = Math.ceil(allProductVariants.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentItems = allProductVariants.slice(startIndex, endIndex);

                if (filteredProducts.length === 0) {
                  return (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: window.innerWidth <= 768 ? '30px 20px' : '40px', 
                      color: '#666' 
                    }}>
                      <div style={{ fontSize: window.innerWidth <= 768 ? '36px' : '48px', marginBottom: '15px' }}>🔍</div>
                      <p style={{ fontSize: window.innerWidth <= 768 ? '16px' : '18px' }}>No products found</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: window.innerWidth <= 768 ? '15px' : '20px',
                      marginBottom: '20px'
                    }}>
                      {currentItems.map(({ product, variant }) => (
                      <div
                        key={`${product.id}-${variant.id}`}
                        style={{
                          border: '2px solid #e0e0e0',
                          borderRadius: window.innerWidth <= 768 ? '10px' : '8px',
                          padding: window.innerWidth <= 768 ? '15px' : '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: 'white',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e0e0e0';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {/* Product Image */}
                        <div style={{
                          width: '100%',
                          height: window.innerWidth <= 768 ? '250px' : '200px',
                          marginBottom: window.innerWidth <= 768 ? '12px' : '15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f5f5f5',
                          borderRadius: '6px'
                        }}>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/200/f0f0f0/666666?text=No+Image';
                              }}
                            />
                          ) : (
                            <div style={{ color: '#999', fontSize: '14px' }}>No Image</div>
                          )}
                        </div>

                        {/* Product Title */}
                        <h3 style={{
                          margin: '0 0 8px 0',
                          fontSize: window.innerWidth <= 768 ? '15px' : '16px',
                          fontWeight: '600',
                          textAlign: 'center',
                          lineHeight: '1.4',
                          minHeight: window.innerWidth <= 768 ? 'auto' : '44px'
                        }}>
                          {product.title} {variant.title !== 'Default Title' ? `| ${variant.title}` : ''}
                        </h3>

                        {/* SKU */}
                        {variant.sku && (
                          <p style={{
                            margin: '0 0 8px 0',
                            fontSize: window.innerWidth <= 768 ? '12px' : '13px',
                            color: '#666',
                            fontFamily: 'monospace'
                          }}>
                            {variant.sku}
                          </p>
                        )}

                        {/* Price */}
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: window.innerWidth <= 768 ? '18px' : '20px',
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          ₹ {parseFloat(variant.price).toFixed(2)}
                        </p>

                        {/* Select Button */}
                        <button
                          onClick={() => handleExchangeProductSelect(product.id, variant.id)}
                          disabled={!variant.available}
                          style={{
                            width: '100%',
                            padding: window.innerWidth <= 768 ? '14px' : '12px',
                            background: variant.available ? 'white' : '#ccc',
                            color: variant.available ? '#333' : '#666',
                            border: variant.available ? '2px solid #333' : '2px solid #ccc',
                            borderRadius: '6px',
                            fontSize: window.innerWidth <= 768 ? '15px' : '16px',
                            fontWeight: '600',
                            cursor: variant.available ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (variant.available) {
                              e.target.style.background = '#333';
                              e.target.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (variant.available) {
                              e.target.style.background = 'white';
                              e.target.style.color = '#333';
                            }
                          }}
                        >
                          {variant.available ? 'SELECT ITEM' : 'OUT OF STOCK'}
                        </button>
                      </div>
                    ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: window.innerWidth <= 768 ? '8px' : '10px',
                        padding: window.innerWidth <= 768 ? '20px 10px' : '20px',
                        borderTop: '1px solid #e0e0e0',
                        background: 'white'
                      }}>
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          style={{
                            padding: window.innerWidth <= 768 ? '10px 12px' : '10px 14px',
                            background: currentPage === 1 ? '#e0e0e0' : '#333',
                            color: currentPage === 1 ? '#999' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: window.innerWidth <= 768 ? '16px' : '16px',
                            fontWeight: '600',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ←
                        </button>

                        {/* Page Numbers */}
                        <div style={{ 
                          display: 'flex', 
                          gap: window.innerWidth <= 768 ? '6px' : '8px',
                          flexWrap: 'nowrap',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflowX: 'hidden'
                        }}>
                          {(() => {
                            const pageNumbers = [];
                            const maxVisiblePages = window.innerWidth <= 768 ? 3 : 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            
                            if (endPage - startPage < maxVisiblePages - 1) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            if (startPage > 1) {
                              pageNumbers.push(
                                <button
                                  key={1}
                                  onClick={() => setCurrentPage(1)}
                                  style={{
                                    padding: window.innerWidth <= 768 ? '8px 10px' : '10px 12px',
                                    background: 'white',
                                    color: '#333',
                                    border: '2px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: window.innerWidth <= 768 ? '14px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  1
                                </button>
                              );
                              if (startPage > 2) {
                                pageNumbers.push(
                                  <span key="dots1" style={{ padding: '0 5px', color: '#666' }}>...</span>
                                );
                              }
                            }

                            for (let i = startPage; i <= endPage; i++) {
                              pageNumbers.push(
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i)}
                                  style={{
                                    padding: window.innerWidth <= 768 ? '8px 10px' : '10px 12px',
                                    background: currentPage === i ? '#667eea' : 'white',
                                    color: currentPage === i ? 'white' : '#333',
                                    border: `2px solid ${currentPage === i ? '#667eea' : '#ddd'}`,
                                    borderRadius: '6px',
                                    fontSize: window.innerWidth <= 768 ? '14px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (currentPage !== i) {
                                      e.target.style.borderColor = '#667eea';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (currentPage !== i) {
                                      e.target.style.borderColor = '#ddd';
                                    }
                                  }}
                                >
                                  {i}
                                </button>
                              );
                            }

                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pageNumbers.push(
                                  <span key="dots2" style={{ padding: '0 5px', color: '#666' }}>...</span>
                                );
                              }
                              pageNumbers.push(
                                <button
                                  key={totalPages}
                                  onClick={() => setCurrentPage(totalPages)}
                                  style={{
                                    padding: window.innerWidth <= 768 ? '8px 10px' : '10px 12px',
                                    background: 'white',
                                    color: '#333',
                                    border: '2px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: window.innerWidth <= 768 ? '14px' : '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {totalPages}
                                </button>
                              );
                            }

                            return pageNumbers;
                          })()}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: window.innerWidth <= 768 ? '10px 12px' : '10px 14px',
                            background: currentPage === totalPages ? '#e0e0e0' : '#333',
                            color: currentPage === totalPages ? '#999' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: window.innerWidth <= 768 ? '16px' : '16px',
                            fontWeight: '600',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          →
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Return Policy Modal */}
      <ReturnPolicyModal
        isOpen={showPolicyModal}
        onClose={() => {
          setShowPolicyModal(false);
          navigate('/verify'); // Redirect to order verification
        }}
        orderDate={order?.orderDate}
        daysSinceOrder={order?.daysSinceOrder}
      />
    </div>
  );
}

export default ReturnForm;

