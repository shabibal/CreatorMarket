#!/bin/bash

echo "🚀 بدء عملية النشر لمنصة CreatorMarket"
echo "==========================================="

# بناء المشروع
echo "📦 بناء المشروع..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ فشل في بناء المشروع"
    exit 1
fi

echo "✅ تم بناء المشروع بنجاح"

# اختيار منصة النشر
echo ""
echo "اختر منصة النشر:"
echo "1) Vercel (موصى به)"
echo "2) Netlify"
echo "3) Firebase Hosting"
echo "4) GitHub Pages"
read -p "اختر رقم المنصة (1-4): " choice

case $choice in
    1)
        echo "🚀 نشر على Vercel..."
        npx vercel --prod
        ;;
    2)
        echo "🚀 نشر على Netlify..."
        npx netlify-cli deploy --prod --dir=dist
        ;;
    3)
        echo "🚀 نشر على Firebase..."
        firebase deploy --only hosting
        ;;
    4)
        echo "🚀 نشر على GitHub Pages..."
        npx gh-pages -d dist
        ;;
    *)
        echo "❌ خيار غير صحيح"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 تم النشر بنجاح!"
    echo "📋 تذكر إضافة متغيرات البيئة في لوحة تحكم المنصة:"
    echo "   - VITE_FIREBASE_API_KEY"
    echo "   - VITE_FIREBASE_AUTH_DOMAIN"
    echo "   - VITE_FIREBASE_PROJECT_ID"
    echo "   - VITE_FIREBASE_STORAGE_BUCKET"
    echo "   - VITE_FIREBASE_MESSAGING_SENDER_ID"
    echo "   - VITE_FIREBASE_APP_ID"
    echo "   - VITE_PAYPAL_CLIENT_ID"
    echo "   - VITE_PAYPAL_MODE=sandbox"
    echo "   - VITE_PLATFORM_FEE_PERCENT=0.5"
else
    echo "❌ فشل في النشر"
    exit 1
fi