# How to Test with Real Shopify Orders

## 📋 Testing Instructions

### Step 1: Find Your Shopify Orders

1. Go to your Shopify Admin: https://t3dirm-rf.myshopify.com/admin
2. Click on **Orders** in the left menu
3. You'll see a list of all your orders

### Step 2: Note the Order Details

For each order, note:
- **Order Number** (e.g., #1001, #1002, #1003)
- **Customer Email** (shown in the order details)
- **Customer Phone** (shown in the order details)

### Step 3: Test in Return/Exchange System

1. Go to: http://localhost:3000
2. Click **"Start Return/Exchange"**
3. Enter the order number (include the # symbol or just the number)
4. Enter EITHER:
   - The customer's **email address**, OR
   - The customer's **phone number**

### 📱 Phone Number Formats Supported

The system accepts phone numbers in ANY format:
- `+1234567890`
- `(123) 456-7890`
- `123-456-7890`
- `1234567890`
- `+91 98765 43210`

The system automatically normalizes all formats!

## ✅ What Happens

1. System connects to Shopify API
2. Fetches the order by order number
3. Checks if the email/phone matches:
   - Customer email
   - Customer phone
   - Billing address phone
   - Shipping address phone
4. If match found → Shows order details with real products
5. If no match → Shows error message

## 🔍 Example Test Cases

### Test Case 1: Email Verification
```
Order Number: #1001
Contact: customer@example.com
Result: ✅ Should find order if email matches
```

### Test Case 2: Phone Verification
```
Order Number: #1001
Contact: +1234567890
Result: ✅ Should find order if phone matches
```

### Test Case 3: Phone Verification (Different Format)
```
Order Number: #1001
Contact: (123) 456-7890
Result: ✅ Should find order (same number, different format)
```

### Test Case 4: Wrong Contact
```
Order Number: #1001
Contact: wrong@email.com
Result: ❌ Should show "Order not found" error
```

## 🛍️ Create a Test Order in Shopify

If you don't have any orders yet:

1. Go to Shopify Admin → Orders → Create order
2. Add a customer (with email and phone)
3. Add products
4. Complete the order
5. Use that order number and contact info to test

## 📊 Backend Logs

When you verify an order, check the backend terminal. You'll see:
```
✅ Order #1001 verified for customer@example.com
```

Or if verification fails:
```
Order not found or contact doesn't match
```

## 🔧 Troubleshooting

### "Order not found" but order exists in Shopify:

1. **Check the order number format:**
   - Try with # symbol: `#1001`
   - Try without: `1001`

2. **Check the contact information:**
   - Make sure email is exactly as shown in Shopify
   - Phone number can be in any format (system normalizes it)

3. **Check Shopify API connection:**
   - Look at backend terminal for connection status
   - Should see: `✅ Shopify connected: Your Store Name`

### Phone number not matching:

The system checks multiple phone fields:
- Customer phone
- Billing address phone
- Shipping address phone

Make sure at least ONE of these matches your input.

## 📝 Notes

- Order numbers in Shopify typically look like: #1001, #1002, etc.
- The system is case-insensitive for emails
- Phone numbers are normalized (all non-digits removed for comparison)
- Both email AND phone can be used for verification
- Real product images from Shopify are displayed

---

**Ready to test?** Create or find an order in Shopify and try it out! 🚀

