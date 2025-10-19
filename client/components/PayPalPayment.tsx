import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface PayPalPaymentProps {
  userEmail?: string;
}

const PayPalButtonWrapper: React.FC<{ amount: string; currency: string; onSuccess: (details: any) => void; onError: (error: any) => void }> = ({ 
  amount, 
  currency, 
  onSuccess, 
  onError 
}) => {
  const [{ isPending }] = usePayPalScriptReducer();

  return (
    <>
      {isPending && <div className="text-center py-4">Loading PayPal...</div>}
      <PayPalButtons
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount,
                  currency_code: currency,
                },
                payee: {
                  email_address: 'suyiliu561@gmail.com', // Your business account
                },
                description: 'Combo AI Premium Service',
              },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order!.capture().then((details) => {
            onSuccess(details);
          });
        }}
        onError={(error) => {
          onError(error);
        }}
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
        }}
      />
    </>
  );
};

export const PayPalPayment: React.FC<PayPalPaymentProps> = ({ userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handlePaymentSuccess = async (details: any) => {
    setPaymentStatus('processing');
    
    try {
      // Send payment details to your server for verification
      const response = await fetch('/api/paypal/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: details.id,
          payerID: details.payer.payer_id,
          paymentDetails: details,
          userEmail: userEmail,
        }),
      });

      if (response.ok) {
        setPaymentStatus('success');
        setPaymentDetails(details);
        
        // Close dialog after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
          setPaymentStatus('idle');
          setPaymentDetails(null);
        }, 3000);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('error');
      setErrorMessage('Payment verification failed. Please contact support.');
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('PayPal payment error:', error);
    setPaymentStatus('error');
    setErrorMessage('Payment failed. Please try again.');
  };

  const resetPaymentState = () => {
    setPaymentStatus('idle');
    setPaymentDetails(null);
    setErrorMessage('');
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetPaymentState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          <CreditCard className="h-4 w-4" />
          💳 PayPal Payment
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            💳 PayPal Payment
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            This will open PayPal's secure payment system. You'll need to log into your PayPal account or create one to complete the payment.
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {paymentStatus === 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Premium Service</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  $2.99 USD
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Unlock premium features including:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Advanced compliance analysis</li>
                    <li>Priority support</li>
                    <li>Extended project limits</li>
                    <li>Custom integrations</li>
                  </ul>
                </div>
                
                <div className="border-t pt-4">
                  {!import.meta.env.VITE_PAYPAL_CLIENT_ID_LIVE && !import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-yellow-600 mb-2">PayPal Not Configured</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        PayPal integration needs to be set up with your credentials.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-left text-sm">
                        <p className="text-yellow-800">
                          <strong>To fix this:</strong>
                        </p>
              <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
                <li>Get your PayPal Client ID from PayPal Developer Dashboard</li>
                <li>Add VITE_PAYPAL_CLIENT_ID_LIVE to your .env file for live mode</li>
                <li>Or add VITE_PAYPAL_CLIENT_ID_SANDBOX for sandbox mode</li>
                <li>Restart the development server</li>
              </ol>
                      </div>
                    </div>
                  ) : (
                    <PayPalScriptProvider
                      options={{
                        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID_LIVE || import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX,
                        currency: 'USD',
                        intent: 'capture',
                      }}
                    >
                    <PayPalButtonWrapper
                      amount="2.99"
                      currency="USD"
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    </PayPalScriptProvider>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Thank you for your payment. Your premium features are now active.
              </p>
              {paymentDetails && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-left">
                  <p className="text-xs text-green-800">
                    <strong>Transaction ID:</strong> {paymentDetails.id}
                  </p>
                  <p className="text-xs text-green-800">
                    <strong>Amount:</strong> ${paymentDetails.purchase_units[0]?.amount?.value} USD
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage || 'An error occurred during payment processing.'}
              </p>
              <Button 
                onClick={resetPaymentState}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayPalPayment;
