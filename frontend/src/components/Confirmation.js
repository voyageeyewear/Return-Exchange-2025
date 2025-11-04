import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Confirmation() {
  const { requestId } = useParams();
  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    // Fetch request details to get discount code
    const fetchRequestDetails = async () => {
      try {
        const response = await axios.get(`/api/returns/status/${requestId}`);
        if (response.data.request) {
          setRequestData(response.data.request);
        }
      } catch (err) {
        console.error('Error fetching request details:', err);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '4em', marginBottom: '20px' }}>✅</div>
        
        <h1 style={{ color: '#28a745', marginBottom: '20px' }}>Request Submitted Successfully!</h1>
        
        <div className="alert alert-success">
          <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>
            Your return/exchange request has been submitted.
          </p>
          <p style={{ fontSize: '1.4em', fontWeight: 'bold' }}>
            Request ID: {requestId}
          </p>
        </div>

        {/* Discount Code or Credit Applied Display */}
        {requestData && requestData.refund_amount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            padding: '25px',
            borderRadius: '12px',
            marginTop: '30px',
            border: '3px solid #10b981',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            {requestData.discount_code ? (
              // Discount Code for Next Order
              <>
                <div style={{ fontSize: '3em', marginBottom: '15px' }}>🎁</div>
                <h2 style={{ color: '#065f46', marginBottom: '15px', fontSize: '24px' }}>
                  Your Discount Code is Ready!
                </h2>
                <div style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '10px',
                  margin: '20px 0',
                  border: '2px dashed #10b981'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                    Your Discount Code:
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#065f46',
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    background: '#f0fdf4',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '2px solid #10b981'
                  }}>
                    {requestData.discount_code}
                  </p>
                </div>
                <p style={{ margin: '15px 0 0 0', fontSize: '16px', color: '#065f46', fontWeight: '600' }}>
                  💰 Discount Amount: ₹{parseFloat(requestData.refund_amount).toFixed(2)}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#059669' }}>
                  {requestData.discount_code_expiry 
                    ? `Valid until ${new Date(requestData.discount_code_expiry).toLocaleDateString()} (90 days)`
                    : 'Valid for 90 days'}
                </p>
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>
                    📧 A copy of this code has been sent to your email address.
                    <br />
                    Use this code during checkout for your next purchase!
                  </p>
                </div>
              </>
            ) : (
              // Credit Applied to Exchange
              <>
                <div style={{ fontSize: '3em', marginBottom: '15px' }}>✅</div>
                <h2 style={{ color: '#065f46', marginBottom: '15px', fontSize: '24px' }}>
                  Credit Applied to Exchange
                </h2>
                <div style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '10px',
                  margin: '20px 0',
                  border: '2px dashed #10b981'
                }}>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#065f46' }}>
                    ₹{parseFloat(requestData.refund_amount).toFixed(2)} Credit Applied
                  </p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#059669' }}>
                    The credit amount has been applied to this exchange transaction.
                  </p>
                </div>
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '8px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#065f46' }}>
                    📧 Confirmation details have been sent to your email address.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Store Credit Display for Returns */}
        {requestData && requestData.action_type === 'Return' && requestData.store_credit_amount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            padding: '25px',
            borderRadius: '12px',
            marginTop: '30px',
            border: '3px solid #7c3aed',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>💳</div>
              <h2 style={{ color: '#5b21b6', margin: '0 0 15px 0', fontSize: '24px' }}>
                Store Credit Generated!
              </h2>
              <p style={{ margin: 0, fontSize: '16px', color: '#6b21a8' }}>
                Your return has been approved and store credit has been generated
              </p>
            </div>
            
            <div style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '10px',
              margin: '20px 0',
              border: '2px dashed #7c3aed',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7c3aed', fontWeight: '600' }}>
                Your Store Credit Code:
              </p>
              <p style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#5b21b6',
                letterSpacing: '2px',
                fontFamily: 'monospace',
                background: '#faf5ff',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #7c3aed',
                display: 'inline-block'
              }}>
                {requestData.store_credit_code}
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '15px 0 0 0', fontSize: '18px', color: '#5b21b6', fontWeight: '600' }}>
                💰 Credit Amount: ₹{parseFloat(requestData.store_credit_amount).toFixed(2)}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#7c3aed' }}>
                Valid until {new Date(requestData.store_credit_expiry).toLocaleDateString()} (90 days)
              </p>
            </div>
            
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '8px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#5b21b6', textAlign: 'center' }}>
                📧 A copy of this store credit code has been sent to your email address.
                <br />
                Use this code during checkout for your next purchase!
              </p>
            </div>
          </div>
        )}

        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '10px', marginTop: '30px', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '15px' }}>What happens next?</h3>
          <ol style={{ lineHeight: '2', color: '#666' }}>
            <li>Our team will review your request within 24-48 hours</li>
            <li>You'll receive an email confirmation shortly</li>
            {requestData && requestData.discount_code && (
              <li style={{ color: '#10b981', fontWeight: '600' }}>
                ✅ Your discount code is ready! Check your email or see above.
              </li>
            )}
            {requestData && requestData.action_type === 'Return' && requestData.store_credit_amount > 0 && (
              <li style={{ color: '#7c3aed', fontWeight: '600' }}>
                💳 Your store credit is ready! Check your email or see above.
              </li>
            )}
            <li>We'll send you status updates via email</li>
            <li>Once approved, we'll provide further instructions</li>
          </ol>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">
            Return to Home
          </Link>
          <Link to="/verify" className="btn btn-secondary">
            Submit Another Request
          </Link>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#e7f3ff', borderRadius: '8px' }}>
          <p style={{ color: '#0c5460', margin: 0 }}>
            <strong>Important:</strong> Please save your Request ID ({requestId}) for future reference.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;

