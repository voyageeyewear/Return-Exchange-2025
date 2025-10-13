# Return & Exchange System

A complete Return & Exchange management system with a user-facing portal for customers to submit return/exchange requests and an admin portal to manage those requests.

## 🎯 Features

### User Features
- **Order Verification**: Customers can verify their orders using order number and email/phone
- **View Order Details**: Display past order details with product information
- **Submit Return/Exchange Request**: Select products and provide reason for return or exchange
- **Image Upload**: Optional image upload to support the request
- **Confirmation**: Receive confirmation with unique request ID
- **Email Notifications**: Automatic email updates on request status

### Admin Features
- **Secure Login**: JWT-based authentication for admin access
- **Dashboard**: Overview of all return/exchange requests with statistics
- **Filter & Search**: Filter by status and search by request ID, customer, or order
- **Request Management**: View detailed information about each request
- **Status Updates**: Update request status with admin notes
- **Email Notifications**: Notify customers about status changes
- **Status History**: Track all status changes with timestamps

## 📋 System Requirements

- Node.js 14.x or higher
- npm or yarn
- Modern web browser

## 🚀 Installation & Setup

### 1. Install Backend Dependencies

```bash
# Install backend dependencies
npm install
```

### 2. Install Frontend Dependencies

```bash
# Navigate to frontend directory and install
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

The project includes a `.env` file with default configuration. You can modify it for your needs:

```env
PORT=5000
JWT_SECRET=return_exchange_secret_key_2025
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Admin Default Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

**Note**: Email notifications are optional. If not configured, the system will log email notifications to the console instead.

### 4. Running the Application

#### Option A: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

#### Option B: Run Both Simultaneously (requires concurrently package)

```bash
npm run dev:all
```

### 5. Access the Application

- **User Portal**: http://localhost:3000
- **Admin Portal**: http://localhost:3000/admin
- **Backend API**: http://localhost:5000/api

## 🔐 Default Admin Credentials

```
Email: admin@example.com
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

## 📦 Sample Test Data

The system comes with pre-populated sample orders for testing:

**Order 1:**
- Order Number: `ORD-2025-001`
- Email: `customer@example.com`
- Customer: John Doe
- Items: Classic Aviator Sunglasses, Round Frame Eyeglasses

**Order 2:**
- Order Number: `ORD-2025-002`
- Email: `jane@example.com`
- Customer: Jane Smith
- Items: Sport Sunglasses

## 📚 User Flow

### Customer Journey

1. **Visit Homepage** → Click "Start Return/Exchange"
2. **Order Verification** → Enter order number and email/phone
3. **View Order Details** → See all items from the order
4. **Select Item** → Click "Return/Exchange" on desired item
5. **Fill Return Form** → 
   - Choose Return or Exchange
   - Select reason
   - Add optional details and image
6. **Submit** → Receive confirmation with Request ID
7. **Email Updates** → Get notified about status changes

### Admin Journey

1. **Login** → Access admin portal with credentials
2. **Dashboard** → View all requests and statistics
3. **Filter/Search** → Find specific requests
4. **View Details** → Click on request to see full information
5. **Update Status** → Change status and add notes
6. **Send Notification** → Customer receives email update

## 🗂️ Project Structure

```
return-exchange/
├── backend/
│   ├── database.js          # Database schema and initialization
│   ├── server.js            # Express server setup
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Admin authentication routes
│   │   ├── orders.js        # Order verification routes
│   │   ├── returns.js       # Return/exchange submission routes
│   │   └── admin.js         # Admin management routes
│   └── utils/
│       └── email.js         # Email notification utility
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── OrderVerification.js
│       │   ├── OrderDetails.js
│       │   ├── ReturnForm.js
│       │   ├── Confirmation.js
│       │   └── admin/
│       │       ├── AdminLogin.js
│       │       ├── AdminDashboard.js
│       │       ├── RequestDetails.js
│       │       └── Admin.css
│       ├── App.js
│       ├── App.css
│       ├── index.js
│       └── index.css
├── uploads/                 # User uploaded images
├── database.db             # SQLite database (auto-created)
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Public Endpoints

**POST** `/api/orders/verify`
- Verify order by order number and contact info
- Body: `{ orderNumber, contact }`

**POST** `/api/returns/submit`
- Submit return/exchange request (multipart/form-data)
- Fields: orderId, orderItemId, customerName, customerEmail, actionType, reason, image (optional)

**GET** `/api/returns/status/:requestId`
- Get status of a return/exchange request

### Admin Endpoints (Requires Authentication)

**POST** `/api/auth/login`
- Admin login
- Body: `{ email, password }`

**GET** `/api/auth/verify`
- Verify JWT token

**GET** `/api/admin/requests`
- Get all return/exchange requests
- Query params: status, search, limit, offset

**GET** `/api/admin/requests/:id`
- Get single request details with history

**PUT** `/api/admin/requests/:id/status`
- Update request status
- Body: `{ status, notes, sendNotification }`

**GET** `/api/admin/stats`
- Get statistics (total, pending, approved, etc.)

## 📧 Email Configuration (Optional)

To enable email notifications:

1. **Using Gmail:**
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: https://myaccount.google.com/apppasswords
   - Update `.env` file with your Gmail and App Password

2. **Using Other SMTP Services:**
   - Update `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD` in `.env`

If email is not configured, notifications will be logged to the console.

## 🛡️ Security Features

- JWT-based authentication for admin access
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- File upload validation (type and size)
- CORS enabled for API security
- Input validation on all endpoints

## 🎨 UI/UX Features

- Beautiful gradient design
- Fully responsive layout
- Loading states and error handling
- Real-time status updates
- Status history tracking
- Image preview for uploads
- Empty states for better UX
- Confirmation messages

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop (1024px and above)
- Tablet (768px - 1023px)
- Mobile (below 768px)

## 🔄 Status Types

- **Pending**: Request submitted, awaiting review
- **In Progress**: Request is being processed
- **Approved**: Request has been approved
- **Rejected**: Request has been rejected
- **Completed**: Request has been completed

## 🚨 Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify all dependencies are installed: `npm install`
- Check `.env` file exists

### Frontend won't start
- Ensure you're in the `frontend` directory
- Run `npm install` in the frontend directory
- Check if port 3000 is available

### Database errors
- Delete `database.db` file and restart server to recreate
- Check file permissions in the project directory

### Email not sending
- Verify email credentials in `.env`
- Check if less secure apps are enabled (for Gmail)
- Use App Password instead of regular password
- Emails will be logged to console if configuration is missing

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] SMS notifications
- [ ] Refund tracking
- [ ] Shipping label generation
- [ ] Analytics dashboard
- [ ] Export reports (PDF, CSV)
- [ ] Customer chat support
- [ ] Mobile app (React Native)
- [ ] Integration with e-commerce platforms (Shopify, WooCommerce)
- [ ] Automated approval based on rules

## 📄 License

This project is open source and available for use and modification.

## 👨‍💻 Development

### Adding New Admin Users

You can add new admin users by inserting directly into the database:

```javascript
const bcrypt = require('bcryptjs');
const db = require('./backend/database');

const email = 'newadmin@example.com';
const password = 'newpassword';
const name = 'New Admin';

const passwordHash = bcrypt.hashSync(password, 10);
db.run('INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)',
  [email, passwordHash, name]
);
```

### Database Schema

The system uses SQLite with the following tables:
- `orders`: Store order information
- `order_items`: Store individual order items
- `return_requests`: Store return/exchange requests
- `status_history`: Track status changes
- `admin_users`: Store admin credentials

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using Node.js, Express, React, and SQLite**

