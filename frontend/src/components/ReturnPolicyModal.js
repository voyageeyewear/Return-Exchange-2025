import React from 'react';

function ReturnPolicyModal({ isOpen, onClose, orderDate, daysSinceOrder }) {
  if (!isOpen) return null;

  return (
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
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px 30px 20px',
          borderBottom: '2px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '32px', marginRight: '12px' }}>⏰</div>
            <h2 style={{ margin: 0, color: '#dc2626', fontSize: '24px' }}>
              Return Window Expired
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
          {/* Main Message */}
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #ef4444',
            marginBottom: '25px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ fontSize: '24px', marginRight: '10px' }}>❌</div>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>
                Return/Exchange Window Has Expired
              </h3>
            </div>
            <p style={{ margin: '0 0 10px 0', color: '#b91c1c', fontSize: '16px' }}>
              Unfortunately, the 3-day return/exchange window for this order has expired.
            </p>
            {orderDate && (
              <p style={{ margin: '0', color: '#991b1b', fontSize: '14px' }}>
                Order was placed on {new Date(orderDate).toLocaleDateString()} 
                {daysSinceOrder && ` (${daysSinceOrder} day${daysSinceOrder === 1 ? '' : 's'} ago)`}.
              </p>
            )}
          </div>

          {/* Return Policy Information */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
            marginBottom: '25px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '18px' }}>
              📋 Our Return Policy
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.6' }}>
              <li>Returns and exchanges must be requested within <strong>3 days</strong> of order delivery</li>
              <li>Items must be in original condition with tags attached</li>
              <li>Return shipping costs are the customer's responsibility</li>
              <li>Refunds will be processed within 5-7 business days after receiving the returned item</li>
              <li>Store credit will be issued for approved returns (valid for 90 days)</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div style={{
            background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #0ea5e9'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#0c4a6e', fontSize: '18px' }}>
              📞 Need Help?
            </h4>
            <p style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '14px' }}>
              If you have any questions or special circumstances, please contact our customer service team:
            </p>
            <div style={{ color: '#0c4a6e', fontSize: '14px' }}>
              <p style={{ margin: '5px 0' }}>📧 Email: support@goeye.in</p>
              <p style={{ margin: '5px 0' }}>📱 Phone: +91-XXXX-XXXX-XX</p>
              <p style={{ margin: '5px 0' }}>🕒 Hours: Mon-Fri 9AM-6PM IST</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 30px',
          borderTop: '2px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            Close
          </button>
          <button
            onClick={() => window.location.href = '/verify'}
            style={{
              padding: '12px 30px',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#0284c7'}
            onMouseLeave={(e) => e.target.style.background = '#0ea5e9'}
          >
            Check Another Order
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default ReturnPolicyModal;
