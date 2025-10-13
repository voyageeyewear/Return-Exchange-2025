import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import OrderVerification from './components/OrderVerification';
import OrderDetails from './components/OrderDetails';
import ReturnForm from './components/ReturnForm';
import Confirmation from './components/Confirmation';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import RequestDetails from './components/admin/RequestDetails';
import ShopifyOrders from './components/admin/ShopifyOrders';
import DebugOrders from './components/admin/DebugOrders';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/verify" element={<OrderVerification />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/return/:orderId/:itemId" element={<ReturnForm />} />
          <Route path="/confirmation/:requestId" element={<Confirmation />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/request/:id" element={<RequestDetails />} />
          <Route path="/admin/shopify-orders" element={<ShopifyOrders />} />
          <Route path="/admin/debug-orders" element={<DebugOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <h1>Return & Exchange System</h1>
          <p>Easy returns and exchanges for your orders</p>
        </div>
        
        <div className="home-cards">
          <Link to="/verify" className="home-card">
            <div className="card-icon">📦</div>
            <h2>Start Return/Exchange</h2>
            <p>Verify your order and initiate a return or exchange request</p>
            <button className="btn btn-primary">Get Started</button>
          </Link>
          
          <Link to="/admin" className="home-card">
            <div className="card-icon">🔐</div>
            <h2>Admin Portal</h2>
            <p>Manage return and exchange requests</p>
            <button className="btn btn-secondary">Admin Login</button>
          </Link>
        </div>

        <div className="home-info">
          <div className="info-card">
            <h3>📋 Easy Process</h3>
            <p>Simple 3-step process to submit your return or exchange request</p>
          </div>
          <div className="info-card">
            <h3>⚡ Quick Response</h3>
            <p>Get updates on your request status via email</p>
          </div>
          <div className="info-card">
            <h3>🛡️ Secure</h3>
            <p>Your information is safe and secure with us</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

