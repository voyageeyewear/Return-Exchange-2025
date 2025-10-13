const express = require('express');
const { getShopifyOrderByName } = require('../services/shopify');

const router = express.Router();

// Verify order by order number and email/mobile - NOW USING SHOPIFY
router.post('/verify', async (req, res) => {
  const { orderNumber, contact } = req.body;

  if (!orderNumber || !contact) {
    return res.status(400).json({ error: 'Order number and contact information are required' });
  }

  try {
    console.log(`🔍 Searching for order: ${orderNumber} with contact: ${contact}`);
    
    // Fetch order from Shopify
    const shopifyOrder = await getShopifyOrderByName(orderNumber);

    if (!shopifyOrder) {
      console.log(`❌ Order ${orderNumber} not found in Shopify`);
      return res.status(404).json({ 
        error: `Order ${orderNumber} not found in your Shopify store. Please verify the order number.` 
      });
    }
    
    console.log(`✅ Found order ${shopifyOrder.name} in Shopify`);

    // Verify contact information (email or phone) - check multiple sources
    const customerEmail = shopifyOrder.contact_email || 
                         shopifyOrder.email || 
                         shopifyOrder.customer?.email || 
                         shopifyOrder.customer?.default_address?.email || '';
    const customerPhone = shopifyOrder.phone || 
                         shopifyOrder.customer?.phone || 
                         shopifyOrder.customer?.default_address?.phone || '';
    const billingPhone = shopifyOrder.billing_address?.phone || '';
    const shippingPhone = shopifyOrder.shipping_address?.phone || '';
    
    console.log(`   Customer object:`, shopifyOrder.customer ? 'exists' : 'missing');
    console.log(`   Available emails: contact_email="${shopifyOrder.contact_email}", email="${shopifyOrder.email}", customer.email="${shopifyOrder.customer?.email}"`);
    
    // Normalize phone numbers (remove all non-digits)
    const normalizePhone = (phone) => phone ? phone.replace(/\D/g, '') : '';
    const inputContact = contact.toLowerCase().trim();
    const inputPhone = normalizePhone(contact);
    
    // Check if contact matches email or any phone number
    const contactMatch = 
      // Email match
      (customerEmail && customerEmail.toLowerCase() === inputContact) ||
      // Phone matches (check all possible phone fields)
      (inputPhone && (
        normalizePhone(customerPhone) === inputPhone ||
        normalizePhone(billingPhone) === inputPhone ||
        normalizePhone(shippingPhone) === inputPhone ||
        customerPhone === contact ||
        billingPhone === contact ||
        shippingPhone === contact
      ));

    if (!contactMatch) {
      console.log(`❌ Contact mismatch for order ${shopifyOrder.name}`);
      console.log(`   Order email: ${customerEmail || 'NONE'}`);
      console.log(`   Order phones: ${customerPhone || 'NONE'}, ${billingPhone || 'NONE'}, ${shippingPhone || 'NONE'}`);
      console.log(`   Input contact: ${contact}`);
      
      // Check if order has ANY contact info
      const hasAnyContact = customerEmail || customerPhone || billingPhone || shippingPhone;
      
      if (!hasAnyContact) {
        return res.status(404).json({ 
          error: `Order ${shopifyOrder.name} found, but it has no email or phone number in Shopify. Please add customer contact information to this order in Shopify admin, or contact support.` 
        });
      }
      
      return res.status(404).json({ 
        error: `Order ${shopifyOrder.name} found, but the contact information doesn't match. Order has email: ${customerEmail || 'None'}, phone: ${customerPhone || billingPhone || shippingPhone || 'None'}. Please use the exact contact info from your order.` 
      });
    }

    // Format order data
    const formattedOrder = {
      id: shopifyOrder.id,
      orderNumber: shopifyOrder.name,
      customerName: shopifyOrder.customer ? 
        `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim() : 
        shopifyOrder.billing_address?.name || 'Customer',
      customerEmail: customerEmail,
      customerMobile: customerPhone || billingPhone || shippingPhone,
      orderDate: shopifyOrder.created_at,
      totalPrice: shopifyOrder.total_price,
      items: shopifyOrder.line_items.map(item => ({
        id: item.id,
        product_name: item.name,
        product_image: item.properties?.find(p => p.name === '_image')?.value || 
                      (item.image ? item.image : 
                      `https://via.placeholder.com/100?text=${encodeURIComponent(item.name)}`),
        sku: item.sku || item.variant_id || item.product_id,
        quantity: item.quantity,
        price: item.price,
        variant_id: item.variant_id,
        product_id: item.product_id
      }))
    };

    console.log(`✅ Order ${shopifyOrder.name} verified for ${customerEmail || customerPhone}`);

    res.json({
      message: 'Order found',
      order: formattedOrder
    });

  } catch (error) {
    console.error('Error verifying order:', error);
    res.status(500).json({ 
      error: 'Failed to verify order. Please try again.' 
    });
  }
});

module.exports = router;

