const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ Auth middleware: No token provided');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    console.log('🔐 Auth middleware: Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Auth middleware: Token valid for user:', decoded.email);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware: Token verification failed:', error.message);
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { authenticateToken };

