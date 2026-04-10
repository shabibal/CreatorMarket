# 🚀 دليل نشر CreatorMarket

## الطرق المتاحة للنشر:

### 1. **Vercel (الأسرع والأسهل)**
```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# نشر المشروع
vercel --prod

# أو استخدام السكريبت الجاهز
chmod +x deploy.sh
./deploy.sh
```

### 2. **Netlify**
```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login

# نشر المشروع
npm run deploy:netlify
```

### 3. **Firebase Hosting**
```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# ربط المشروع (استبدل PROJECT_ID بمعرف مشروعك)
firebase use PROJECT_ID

# نشر
npm run deploy:firebase
```

## 🔧 إعداد متغيرات البيئة

### في Vercel:
1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. افتح مشروعك
3. اذهب إلى Settings → Environment Variables
4. أضف المتغيرات التالية:

```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_MODE=sandbox
VITE_PLATFORM_FEE_PERCENT=0.5
```

### في Netlify:
1. اذهب إلى [Netlify Dashboard](https://app.netlify.com)
2. افتح مشروعك
3. اذهب إلى Site Settings → Environment Variables
4. أضف نفس المتغيرات

### في Firebase:
1. اذهب إلى Firebase Console
2. افتح مشروعك
3. اذهب إلى Hosting → Environment Variables (إذا كان متوفراً)
4. أو أضف المتغيرات في ملف `.env.production`

## 🔒 تفعيل قواعد Firebase الأمنية

### Firestore Rules:
1. اذهب إلى Firebase Console
2. افتح مشروعك → Firestore Database
3. اذهب إلى Rules
4. انسخ محتوى ملف `firestore.rules` والصقه
5. اضغط Publish

### Storage Rules:
1. اذهب إلى Firebase Console
2. افتح مشروعك → Storage
3. اذهب إلى Rules
4. انسخ محتوى ملف `storage.rules` والصقه
5. اضغط Publish

## 🧪 اختبار الموقع

بعد النشر، تأكد من:

1. ✅ **التسجيل والدخول** يعملان
2. ✅ **نشر الخدمات** يعمل
3. ✅ **الدردشة** تعمل
4. ✅ **الإشعارات** تظهر
5. ✅ **المدفوعات** تعمل (في وضع sandbox)

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من console المتصفح للأخطاء
2. تأكد من صحة متغيرات البيئة
3. تحقق من تفعيل قواعد Firebase

## 🎯 المميزات الجاهزة

- ✅ نظام المصادقة الكامل
- ✅ إدارة الخدمات والمشاريع
- ✅ نظام الدردشة والمراسلة
- ✅ نظام الإشعارات المتقدم
- ✅ نظام المدفوعات عبر PayPal
- ✅ لوحة إدارة شاملة
- ✅ نظام الأمان المتقدم
- ✅ دعم اللغة العربية والإنجليزية