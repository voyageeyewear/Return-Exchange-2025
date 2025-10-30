const express = require('express');
const { getShopifyOrderByName, getShopifyProduct } = require('../services/shopify');

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

    // Check if order is within 3-day return window
    const orderDate = new Date(shopifyOrder.created_at);
    const currentDate = new Date();
    
    // Normalize dates to start of day for accurate day calculation
    const orderDateNormalized = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    const currentDateNormalized = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    const daysDifference = Math.floor((currentDateNormalized - orderDateNormalized) / (1000 * 60 * 60 * 24));
    const isWithinReturnWindow = daysDifference <= 3;
    
    console.log(`📅 Order date: ${orderDate.toISOString()}`);
    console.log(`📅 Order date normalized: ${orderDateNormalized.toISOString()}`);
    console.log(`📅 Current date: ${currentDate.toISOString()}`);
    console.log(`📅 Current date normalized: ${currentDateNormalized.toISOString()}`);
    console.log(`📅 Days since order: ${daysDifference}`);
    console.log(`📅 Within return window: ${isWithinReturnWindow}`);

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
      isWithinReturnWindow: isWithinReturnWindow,
      daysSinceOrder: daysDifference,
      returnWindowExpiry: new Date(orderDate.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString(),
      items: await Promise.all(shopifyOrder.line_items.map(async (item) => {
        // Extract image URL from line item or fetch from product
        let imageUrl = null;
        
        // Try line item image first
        if (item.properties) {
          const imgProp = item.properties.find(p => p.name === '_image');
          if (imgProp) imageUrl = imgProp.value;
        }
        
        if (!imageUrl && item.image) {
          imageUrl = typeof item.image === 'string' ? item.image : item.image.src;
        }
        
        // If no image in line item, fetch from product API
        if (!imageUrl && item.product_id) {
          try {
            console.log(`🖼️  Fetching product ${item.product_id} for image...`);
            const product = await getShopifyProduct(item.product_id);
            
            if (product && product.images && product.images.length > 0) {
              console.log(`   ✅ Found ${product.images.length} images for product ${item.product_id}`);
              
              // Find image for this specific variant or use first image
              if (item.variant_id && product.variants) {
                const variant = product.variants.find(v => v.id === item.variant_id);
                if (variant && variant.image_id) {
                  const variantImage = product.images.find(img => img.id === variant.image_id);
                  imageUrl = variantImage ? variantImage.src : product.images[0].src;
                } else {
                  imageUrl = product.images[0].src;
                }
              } else {
                imageUrl = product.images[0].src;
              }
              console.log(`   📸 Using image: ${imageUrl}`);
            } else {
              console.log(`   ❌ No images found for product ${item.product_id}`);
            }
          } catch (err) {
            console.error(`   ❌ Failed to fetch product image for ${item.product_id}:`, err.message);
          }
        }
        
        // Final fallback
        if (!imageUrl) {
          imageUrl = `https://via.placeholder.com/100/f0f0f0/666666?text=${encodeURIComponent(item.name.substring(0, 20))}`;
        }

        return {
          id: item.id,
          product_name: item.name,
          product_image: imageUrl,
          sku: item.sku || item.variant_id || item.product_id,
          quantity: item.quantity,
          price: item.price,
          variant_id: item.variant_id,
          product_id: item.product_id
        };
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

