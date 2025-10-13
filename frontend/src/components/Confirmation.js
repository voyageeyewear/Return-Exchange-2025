import React from 'react';
import { useParams, Link } from 'react-router-dom';

function Confirmation() {
  const { requestId } = useParams();

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

        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '10px', marginTop: '30px', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '15px' }}>What happens next?</h3>
          <ol style={{ lineHeight: '2', color: '#666' }}>
            <li>Our team will review your request within 24-48 hours</li>
            <li>You'll receive an email confirmation shortly</li>
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

