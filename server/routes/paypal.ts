import { RequestHandler } from "express";
import { z } from "zod";

// PayPal webhook payload validation schema
const PayPalWebhookSchema = z.object({
  orderID: z.string(),
  payerID: z.string(),
  paymentDetails: z.object({
    id: z.string(),
    status: z.string(),
    purchase_units: z.array(z.object({
      amount: z.object({
        value: z.string(),
        currency_code: z.string(),
      }),
    })),
    payer: z.object({
      payer_id: z.string(),
      email_address: z.string().optional(),
    }),
  }),
  userEmail: z.string().email().optional(),
});

// PayPal order verification schema
const PayPalOrderSchema = z.object({
  orderID: z.string(),
  payerID: z.string(),
  paymentDetails: z.any(),
  userEmail: z.string().email().optional(),
});

export const handlePayPalWebhook: RequestHandler = async (req, res) => {
  try {
    console.log('PayPal webhook received:', req.body);

    // Validate the request body
    const validationResult = PayPalWebhookSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('Invalid PayPal webhook payload:', validationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: validationResult.error.errors,
      });
    }

    const { orderID, payerID, paymentDetails, userEmail } = validationResult.data;

    // Verify the payment with PayPal
    const isPaymentVerified = await verifyPayPalPayment(orderID, payerID);
    
    if (!isPaymentVerified) {
      console.error('PayPal payment verification failed for order:', orderID);
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
      });
    }

    // Process the successful payment
    await processSuccessfulPayment({
      orderID,
      payerID,
      paymentDetails,
      userEmail,
    });

    console.log('PayPal payment processed successfully:', orderID);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      orderID,
    });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Verify PayPal payment with PayPal API
async function verifyPayPalPayment(orderID: string, payerID: string): Promise<boolean> {
  try {
    // Check for live credentials first, fallback to sandbox
    const clientId = process.env.PAYPAL_CLIENT_ID_LIVE || process.env.PAYPAL_CLIENT_ID_SANDBOX;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET_LIVE || process.env.PAYPAL_CLIENT_SECRET_SANDBOX;
    const environment = process.env.PAYPAL_CLIENT_ID_LIVE ? 'live' : 'sandbox';

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured');
      return false;
    }

    console.log('PayPal verification - Client ID:', clientId ? 'Present' : 'Missing');
    console.log('PayPal verification - Client Secret:', clientSecret ? 'Present' : 'Missing');
    console.log('PayPal verification - Environment:', environment);
    console.log('PayPal verification - PAYPAL_CLIENT_ID_LIVE exists:', !!process.env.PAYPAL_CLIENT_ID_LIVE);
    console.log('PayPAL verification - PAYPAL_CLIENT_ID_SANDBOX exists:', !!process.env.PAYPAL_CLIENT_ID_SANDBOX);

    // Get access token
    const apiUrl = `https://api-m.${environment === 'live' ? 'paypal' : 'sandbox.paypal'}.com/v1/oauth2/token`;
    console.log('PayPal API URL:', apiUrl);
    
    const tokenResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get PayPal access token');
      console.error('Response status:', tokenResponse.status);
      console.error('Response statusText:', tokenResponse.statusText);
      const errorText = await tokenResponse.text();
      console.error('Response body:', errorText);
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify the order
    const orderResponse = await fetch(`https://api-m.${environment === 'live' ? 'paypal' : 'sandbox.paypal'}.com/v2/checkout/orders/${orderID}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!orderResponse.ok) {
      console.error('Failed to verify PayPal order');
      return false;
    }

    const orderData = await orderResponse.json();
    
    // Check if order is approved and payer matches
    return orderData.status === 'COMPLETED' && orderData.payer?.payer_id === payerID;

  } catch (error) {
    console.error('PayPal verification error:', error);
    return false;
  }
}

// Process successful payment
async function processSuccessfulPayment(paymentData: {
  orderID: string;
  payerID: string;
  paymentDetails: any;
  userEmail?: string;
}) {
  try {
    const { orderID, payerID, paymentDetails, userEmail } = paymentData;

    // Log the successful payment
    console.log('Processing successful payment:', {
      orderID,
      payerID,
      amount: paymentDetails.purchase_units?.[0]?.amount?.value,
      currency: paymentDetails.purchase_units?.[0]?.amount?.currency_code,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    // Here you would typically:
    // 1. Update user's subscription status in your database
    // 2. Send confirmation email
    // 3. Grant premium features
    // 4. Log transaction for accounting

    // For now, we'll just log it
    const paymentRecord = {
      orderID,
      payerID,
      amount: paymentDetails.purchase_units?.[0]?.amount?.value,
      currency: paymentDetails.purchase_units?.[0]?.amount?.currency_code,
      userEmail,
      status: 'completed',
      timestamp: new Date().toISOString(),
      paymentDetails,
    };

    // In a real application, you would save this to your database
    console.log('Payment record created:', paymentRecord);

    // You could also send a confirmation email here
    if (userEmail) {
      console.log(`Sending confirmation email to: ${userEmail}`);
      // await sendConfirmationEmail(userEmail, paymentRecord);
    }

  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

// Additional endpoint for manual payment verification (if needed)
export const handlePayPalVerification: RequestHandler = async (req, res) => {
  try {
    const validationResult = PayPalOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload',
        details: validationResult.error.errors,
      });
    }

    const { orderID, payerID } = validationResult.data;

    const isVerified = await verifyPayPalPayment(orderID, payerID);

    res.json({
      success: true,
      verified: isVerified,
      orderID,
    });

  } catch (error) {
    console.error('PayPal verification endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
