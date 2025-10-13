# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Start the Backend Server

Open a terminal and run:

```bash
npm start
```

You should see:
```
🚀 Server running on http://localhost:5000
📦 API available at http://localhost:5000/api
🔐 Admin login: admin@example.com
✅ Default admin created: admin@example.com / admin123
✅ Sample orders created for testing
```

### 3. Start the Frontend

Open a **NEW** terminal (keep the backend running) and run:

```bash
cd frontend
npm start
```

The browser should automatically open to http://localhost:3000

## 🎉 You're Ready!

### Test the User Portal

1. Go to http://localhost:3000
2. Click "Start Return/Exchange"
3. Enter test order:
   - Order Number: `ORD-2025-001`
   - Email: `customer@example.com`
4. Click "Find My Order"
5. Select an item and click "Return/Exchange"
6. Fill out the form and submit

### Test the Admin Portal

1. Go to http://localhost:3000/admin
2. Login with:
   - Email: `admin@example.com`
   - Password: `admin123`
3. View the submitted request in the dashboard
4. Click "View Details" to manage the request

## 🔧 Configuration (Optional)

### Enable Email Notifications

Edit the `.env` file in the root directory:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in the `.env` file

### Change Admin Password

Edit `.env` file:

```env
ADMIN_EMAIL=youradmin@example.com
ADMIN_PASSWORD=your_secure_password
```

Then delete `database.db` and restart the server.

## 📝 Quick Reference

### URLs
- **Home**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:5000/api

### Test Data
- **Order 1**: ORD-2025-001 / customer@example.com
- **Order 2**: ORD-2025-002 / jane@example.com
- **Admin**: admin@example.com / admin123

### Commands
```bash
# Start backend
npm start

# Start frontend
cd frontend && npm start

# Start both (requires setup)
npm run dev:all
```

## ❓ Common Issues

### Port Already in Use

**Backend (Port 5000):**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 [PID]
```

**Frontend (Port 3000):**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# For frontend
cd frontend
rm -rf node_modules
npm install
```

### Database Issues

```bash
# Delete and recreate database
rm database.db
npm start
```

## ✅ Verification Checklist

- [ ] Backend server starts successfully
- [ ] Frontend opens in browser
- [ ] Can verify test order
- [ ] Can submit return/exchange request
- [ ] Can login to admin portal
- [ ] Can view requests in admin dashboard
- [ ] Can update request status

## 🎯 Next Steps

1. Customize the design to match your brand
2. Configure email notifications
3. Add your own orders to the database
4. Change default admin credentials
5. Deploy to production

---

**Need help?** Check the full README.md for detailed documentation.

