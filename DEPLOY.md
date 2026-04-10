# CreatorMarket - Deployment Guide

## 🚀 Render.com (Backend API - Required for Stripe)

### Setup:
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo (with `server/` folder)
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`

### Environment Variables (in Render Dashboard):
```
STRIPE_SECRET_KEY=sk_test_51TKcn8Q1mS0ypodBVcDEViWlAkj1gaElMUYZz4rky96eLib9Sh3vZPax81FBjoUxp8ZM0PVFtLaBXgsprMrwZ3Kv00fEIhqje0
PAYPAL_CLIENT_ID=ARJjSzbXEKwJnB86Yf3WS8WSRqipIA3nGv0rFgTbVmg9lkAJGMNKazJSneT_1CFRREBdMWjmMlDsMtH9
PAYPAL_SECRET=EAVljo3MuMAa4AdbP8g0TY77Cjv9qlhwm-5bQG2EqdcnXOU974zLDFdaU891X8-AszAaHiCg5Gqiav8z
PLATFORM_FEE_PERCENT=10
FRONTEND_URL=https://creatormarket-e6b2f.web.app
```

### Get API URL:
After deploy, copy the Render URL (e.g., `https://your-app.onrender.com`)

---

## Firebase Hosting (Frontend)
The production build is ready in the `dist` folder containing:
- `index.html` - Main HTML file
- `assets/index-X83UCkSM.js` - JavaScript bundle
- `assets/index-CYWqxUUB.css` - CSS styles

## Firebase Hosting Deployment

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init hosting
```
Select your project: `creatormarket-e6b2f`
Public directory: `dist`

4. Deploy:
```bash
firebase deploy --only hosting
```

## Alternative: Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## Alternative: Netlify Deployment

1. Drag and drop the `dist` folder to Netlify Drop zone
   or use CLI:
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Alternative: Traditional Hosting

Upload the contents of `dist` folder to your hosting provider (cPanel, GoDaddy, etc.) via FTP/File Manager.

## Firebase Console Manual Deployment

1. Go to https://console.firebase.google.com/
2. Select project: `creatormarket-e6b2f`
3. Go to Hosting
4. Click "Upload files" and select all files from `dist` folder

## Live URL
After deployment, your site will be available at:
https://creatormarket-e6b2f.web.app