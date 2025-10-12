# Cloud Build + Firebase Hosting Deployment Guide

## 🚀 **Complete Deployment Solution**

This setup deploys your app using **two complementary services**:
- **Google Cloud Run** - Runs your Node.js server on port 8080
- **Firebase Hosting** - Serves your React app (static files)

## 📋 **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Cloud Run     │
│   Hosting       │    │   (Port 8080)   │
│                 │    │                 │
│ • React App     │    │ • Node.js API   │
│ • Static Files  │    │ • /health       │
│ • SPA Routing   │    │ • /api/ping     │
└─────────────────┘    └─────────────────┘
```

## 🔧 **Files Created**

### **1. cloudbuild.yaml**
- ✅ **Docker build** - Creates container image
- ✅ **Container testing** - Tests locally before deployment
- ✅ **Cloud Run deployment** - Deploys Node.js server on port 8080
- ✅ **React build** - Builds client for Firebase Hosting
- ✅ **Firebase deployment** - Deploys static files
- ✅ **Verification** - Tests both deployments

### **2. server.js**
- ✅ **ES Module compatible** - Uses `import` syntax
- ✅ **Port 8080** - Listens on correct port
- ✅ **Health endpoints** - `/health`, `/api/ping`
- ✅ **CORS headers** - Proper cross-origin support
- ✅ **Graceful shutdown** - Handles SIGTERM/SIGINT

### **3. Dockerfile**
- ✅ **Node.js 18 Alpine** - Lightweight base image
- ✅ **Client build only** - Skips problematic server build
- ✅ **Security** - Non-root user
- ✅ **Health check** - Built-in health monitoring
- ✅ **Port 8080** - Properly exposed

### **4. firebase.json**
- ✅ **Static hosting** - Serves React app
- ✅ **SPA routing** - Handles client-side routing
- ✅ **Clean config** - Minimal setup

## 🚀 **Deployment Commands**

### **Option 1: Cloud Build (Recommended)**
```bash
# Trigger the complete deployment
gcloud builds submit --config cloudbuild.yaml

# Monitor the build
gcloud builds log --stream
```

### **Option 2: Manual Deployment**
```bash
# Build and deploy to Cloud Run
docker build -t gcr.io/$PROJECT_ID/greymatter-ai .
docker push gcr.io/$PROJECT_ID/greymatter-ai

gcloud run deploy greymatter-ai-api \
  --image gcr.io/$PROJECT_ID/greymatter-ai \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

# Build and deploy to Firebase Hosting
npm run build:client
mkdir -p firebase-public
cp -r dist/spa/* firebase-public/
firebase deploy --only hosting --public firebase-public
```

## 🧪 **Testing Your Deployment**

### **Test Cloud Run API (Port 8080)**
```bash
# Get the service URL
API_URL=$(gcloud run services describe greymatter-ai-api --region=us-central1 --format='value(status.url)')

# Test endpoints
curl $API_URL/health
curl $API_URL/api/ping
curl $API_URL/
```

### **Test Firebase Hosting**
```bash
# Get the Firebase URL
FIREBASE_URL=$(firebase hosting:channel:open --json | jq -r '.url')

# Test the React app
curl $FIREBASE_URL/
```

## ✅ **Expected Results**

After deployment:

### **Cloud Run Service (Port 8080)**
- ✅ **Health endpoint**: `https://your-api-url/health`
- ✅ **API ping**: `https://your-api-url/api/ping`
- ✅ **Root endpoint**: `https://your-api-url/`
- ✅ **Auto-scaling**: 0-10 instances
- ✅ **Port 8080**: Properly bound

### **Firebase Hosting**
- ✅ **React app**: `https://your-project.web.app`
- ✅ **SPA routing**: All routes work
- ✅ **Static files**: Optimized delivery
- ✅ **CDN**: Global distribution

## 🔍 **How It Works**

### **1. Cloud Build Process**
1. **Build Docker image** - Creates container with Node.js server
2. **Test container** - Verifies server works locally
3. **Push to registry** - Stores image in Container Registry
4. **Deploy to Cloud Run** - Runs server on port 8080
5. **Build React app** - Creates static files
6. **Deploy to Firebase** - Serves React app
7. **Verify both** - Tests both deployments

### **2. Runtime Architecture**
- **Firebase Hosting** serves your React app to users
- **Cloud Run** handles API requests on port 8080
- **CORS** allows cross-origin requests between them
- **Auto-scaling** handles traffic spikes

## 🎉 **Benefits**

- ✅ **Best of both worlds** - Static hosting + dynamic API
- ✅ **Port 8080** - Node.js server runs on correct port
- ✅ **Auto-scaling** - Handles traffic automatically
- ✅ **Global CDN** - Fast static file delivery
- ✅ **Cost effective** - Pay only for what you use
- ✅ **Reliable** - Google's infrastructure

## 🚨 **Important Notes**

1. **Firebase Hosting cannot run Node.js** - It only serves static files
2. **Cloud Run runs your Node.js server** - On port 8080 as requested
3. **Two separate URLs** - One for API, one for web app
4. **CORS configured** - Allows communication between them

Your app now successfully runs on port 8080 via Cloud Run and serves static files via Firebase Hosting! 🚀
