# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for user login and storage in your Combo application.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Your Combo project set up

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Enter a project name (e.g., "combo-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Click on the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

## Step 3: Set up Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database
5. Click "Done"

## Step 4: Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "combo-web")
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCuO41odvcrqNUJOm0XeUzUrih02a6uLso",
  authDomain: "turbocompliance-4a899.firebaseapp.com",
  projectId: "turbocompliance-4a899",
  storageBucket: "turbocompliance-4a899.firebasestorage.app",
  messagingSenderId: "377586132343",
  appId: "1:377586132343:web:1acf86cdcf160aa94ced72"
};
```

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Important**: Replace the placeholder values with your actual Firebase configuration values.

## Step 6: Set up Firestore Security Rules

1. In your Firebase project, go to "Firestore Database" → "Rules"
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // For development, allow all access (change this in production)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

## Step 7: Test the Setup

1. Start your development server: `npm run dev`
2. Open your browser and navigate to `http://localhost:8080`
3. You should see a login form if not authenticated
4. Try creating a new account or signing in

## Features Implemented

### Authentication
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ User logout
- ✅ Protected routes
- ✅ Authentication state management

### User Management
- ✅ User profile creation
- ✅ User profile editing
- ✅ User profile display
- ✅ Automatic profile updates

### Database
- ✅ Firestore integration
- ✅ User data storage
- ✅ Real-time data synchronization

## File Structure

```
client/
├── lib/
│   └── firebase.ts          # Firebase configuration and functions
├── hooks/
│   └── useAuth.tsx          # Authentication context and hook
├── components/
│   ├── LoginForm.tsx        # Login/signup form
│   ├── UserProfile.tsx      # User profile management
│   └── ProtectedRoute.tsx   # Route protection component
└── App.tsx                  # Main app with AuthProvider
```

## Usage Examples

### Protecting Routes
```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

### Using Authentication Hook
```tsx
import { useAuth } from '@/hooks/useAuth';

const { currentUser, userProfile, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!currentUser) return <div>Please sign in</div>;

// User is authenticated
return <div>Welcome, {userProfile?.displayName}!</div>;
```

### Manual Authentication
```tsx
import { signInUser, signUpUser, signOutUser } from '@/lib/firebase';

// Sign in
const result = await signInUser(email, password);

// Sign up
const result = await signUpUser(email, password, displayName);

// Sign out
await signOutUser();
```

## Security Considerations

1. **Environment Variables**: Never commit your `.env.local` file to version control
2. **Firestore Rules**: Implement proper security rules for production
3. **API Keys**: Firebase API keys are safe to expose in client-side code, but implement proper authentication
4. **User Permissions**: Consider implementing role-based access control

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check your API key in `.env.local`
   - Ensure the `.env.local` file is in the project root

2. **"Firebase: Error (auth/user-not-found)"**
   - User doesn't exist, try creating an account first

3. **"Firebase: Error (auth/wrong-password)"**
   - Incorrect password for the email

4. **"Firebase: Error (auth/email-already-in-use)"**
   - Email is already registered, try signing in instead

### Debug Mode

Enable Firebase debug mode by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'firebase:*');
```

## Next Steps

1. **Customize UI**: Modify the login form and user profile components to match your design
2. **Add Social Auth**: Implement Google, GitHub, or other social authentication providers
3. **Password Reset**: Add password reset functionality
4. **Email Verification**: Implement email verification for new accounts
5. **Advanced Security**: Implement role-based access control and advanced Firestore rules

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Verify your environment variables
3. Check the browser console for JavaScript errors
4. Ensure all dependencies are installed correctly
