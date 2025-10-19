#!/bin/bash

# PayPal Setup Script for Combo AI
echo "🔧 PayPal Integration Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
    echo "✅ .env file created"
else
    echo "📝 .env file already exists"
fi

echo ""
echo "🔑 PayPal Configuration Required"
echo "==============================="
echo ""
echo "To complete PayPal integration, you need to:"
echo ""
echo "1. 🌐 Go to PayPal Developer Dashboard:"
echo "   https://developer.paypal.com/"
echo ""
echo "2. 🔐 Sign in with your PayPal account (suyiliu561@gmail.com)"
echo ""
echo "3. 📱 Create a new application:"
echo "   - Choose 'Sandbox' for testing"
echo "   - Choose 'Live' for production"
echo ""
echo "4. 📋 Copy your Client ID and add it to .env file:"
echo ""
echo "   VITE_PAYPAL_CLIENT_ID_SANDBOX=your_sandbox_client_id_here"
echo "   VITE_PAYPAL_CLIENT_ID_PROD=your_live_client_id_here"
echo ""
echo "5. 🔄 Restart the development server:"
echo "   npm run dev"
echo ""
echo "📞 About Phone Verification:"
echo "============================"
echo ""
echo "PayPal may send SMS verification codes to your registered phone number"
echo "when you create a new PayPal account or make payments. This is normal"
echo "PayPal security behavior, not related to your app login."
echo ""
echo "🔍 Current .env file contents:"
echo "============================="
if [ -f .env ]; then
    grep -E "(PAYPAL|VITE)" .env || echo "No PayPal configuration found"
else
    echo "No .env file found"
fi
echo ""
echo "✅ Setup complete! Follow the steps above to configure PayPal."
