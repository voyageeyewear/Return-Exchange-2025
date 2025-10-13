# 🚀 Setup Instructions

## ⚠️ Important: Environment Configuration

This repository does NOT include the `.env` file for security reasons. You must create it manually.

### Create `.env` file:

```bash
# Create .env in the root directory
cat > .env << 'EOF'
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development

# Shopify Configuration
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_api_access_token
SHOPIFY_API_VERSION=2024-10

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Admin Default Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF
```

### Get Your Shopify Credentials:

1. **Store URL**: Your Shopify store domain (e.g., `mystore.myshopify.com`)
2. **Access Token**: 
   - Go to Shopify Admin → Apps → Develop apps
   - Create a private app
   - Get Admin API access token (starts with `shpat_`)

## 📦 Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

## ▶️ Run the Application

```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

## 📚 Documentation

- **README.md** - Complete system overview
- **SETUP_GUIDE.md** - Detailed setup instructions
- **SHOPIFY_INTEGRATION.md** - Shopify integration details
- **API_DOCUMENTATION.md** - API reference
- **TROUBLESHOOTING.md** - Common issues and fixes

## 🔐 Security

- Never commit `.env` file
- Never commit API keys or tokens
- The `.env` file is in `.gitignore`

---

**For full documentation, see README.md**

