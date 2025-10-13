# Shopify Integration Guide

## ✅ Integration Complete!

Your Return & Exchange system is now fully integrated with your Shopify store: **t3dirm-rf.myshopify.com**

## 🛍️ How It Works

### **Customer Side**
1. Customers enter their **real Shopify order number** (e.g., #1001, #1002)
2. System fetches the order directly from Shopify
3. Displays real products with images, SKUs, and prices
4. Customers can select items to return/exchange

### **Admin Side**
1. View all Shopify orders in the admin panel
2. Manage return/exchange requests
3. Real-time sync with your Shopify store

## 📋 Features

- ✅ **Real Product Data**: Fetches actual products from your Shopify store
- ✅ **Order Verification**: Validates orders using Shopify API
- ✅ **Product Images**: Displays real product images
- ✅ **Customer Information**: Uses actual customer emails and phone numbers
- ✅ **Live Data**: No sample data - everything is real

## 🔧 Configuration

Your Shopify credentials are stored in `.env`:

```env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_admin_api_token_here
SHOPIFY_API_VERSION=2024-10
```

**Note**: The `.env` file is not included in the repository for security reasons.

## 🚀 How to Use

### **For Customers:**

1. Go to http://localhost:3000
2. Click "Start Return/Exchange"
3. Enter your Shopify order number (e.g., #1001)
4. Enter the email you used when placing the order
5. Submit and view your real order with all products

### **For Admins:**

1. Login to admin panel: http://localhost:3000/admin
2. Click "🛍️ View Shopify Orders" button
3. See all recent orders from your Shopify store
4. Manage return/exchange requests

## 📡 API Endpoints

### **Public Endpoints:**

**POST** `/api/orders/verify`
- Verifies order from Shopify
- Matches email/phone with Shopify customer data

**POST** `/api/returns/submit`
- Submits return/exchange request
- Links to Shopify order ID

### **Admin Endpoints (Requires Auth):**

**GET** `/api/shopify/orders`
- Fetches recent orders from Shopify
- Returns formatted order list

**GET** `/api/shopify/products`
- Fetches products from Shopify
- Returns product catalog

## 🔐 Security

- Admin API token is stored securely in environment variables
- JWT authentication for admin access
- Order verification requires matching email/phone

## 📝 Testing

### **Test with Real Orders:**

1. Create a test order in your Shopify store
2. Note the order number (e.g., #1001)
3. Use the customer email from that order
4. Test the return/exchange flow

### **View Shopify Orders:**

1. Login to admin panel
2. Click "View Shopify Orders"
3. See all your real orders

## 🎯 What's Next?

Your system now:
- ✅ Fetches real orders from Shopify
- ✅ Displays actual products with images
- ✅ Verifies customer information
- ✅ Stores return/exchange requests in database
- ✅ Links requests to Shopify order IDs

## 🔄 Data Flow

```
Customer enters order # → System queries Shopify API → 
Validates customer email/phone → Displays real products → 
Customer selects item → Submits return/exchange → 
Saved to database with Shopify order ID → 
Admin can manage requests
```

## 🛠️ Troubleshooting

### **"Order not found" error:**
- Check the order number format (#1001, not 1001)
- Verify the email matches the Shopify order
- Ensure the order exists in your Shopify store

### **"Failed to verify order" error:**
- Check Shopify API credentials in `.env`
- Verify your access token is valid
- Check backend console logs for errors

### **No products showing:**
- Verify products exist in your Shopify store
- Check product images are set in Shopify
- Review backend logs for API errors

## 📊 Backend Console

When the server starts, you'll see:
```
✅ Shopify connected: Your Store Name
🚀 Server running on http://localhost:5000
```

If Shopify connection fails:
```
❌ Shopify connection failed: [error message]
```

## 🔗 Useful Links

- Shopify Admin: https://t3dirm-rf.myshopify.com/admin
- Shopify API Docs: https://shopify.dev/docs/api/admin-rest
- Your Store Frontend: https://t3dirm-rf.myshopify.com

---

**Your Return & Exchange system is now powered by real Shopify data!** 🎉

