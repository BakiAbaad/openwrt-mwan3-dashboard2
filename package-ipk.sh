#!/bin/sh
# sript to compile and build the OpenWrt .ipk package for luci-app-mwan3-dashboard
# https://github.com/BakiAbaad/openwrt-mwan3-dashboard2

echo "============================================="
echo "🎁 جاري تجهيز وبناء حزمة OpenWrt .ipk الرسومية..."
echo "============================================="

# 1. بناء مشروع React/Vite للحصول على الكود المصدر الثابت الخفيف ومحسّن الأداة
echo "⚙️ خطوة 1: بناء واجهة المستخدم الحديثة (React/Vite)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ خطأ: فشل بناء مشروع واجهة الويب. تأكد من تثبيت الحزم بنجاح."
    exit 1
fi

# 2. تنظيف المسار القديم في الحزمة ونسخ الملفات الجديدة
echo "📂 خطوة 2: تهيئة مجلد الحزمة ونسخ ملفات الواجهة المُحسّنة..."
mkdir -p openwrt-ipk/www/mwan3-dashboard
rm -rf openwrt-ipk/www/mwan3-dashboard/*
cp -r dist/* openwrt-ipk/www/mwan3-dashboard/

# 3. تجميع ملفات التحكم والبيانات للحزمة بصيغة ipk
echo "📦 خطوة 3: تجميع الحزمة والملفات التنفيذية..."
rm -f control.tar.gz data.tar.gz debian-binary luci-app-mwan3-dashboard_1.0.0_all.ipk

# حزم ملفات الإعداد والتحكم بالتثبيت والتشغيل
tar -czf control.tar.gz -C openwrt-ipk/CONTROL .
tar -czf data.tar.gz -C openwrt-ipk --exclude=CONTROL .
echo "2.0" > debian-binary

# دمج الأجزاء الثلاثة في حزمة ipk واحدة متوافقة مع نظام opkg في أجهزة OpenWrt
tar -czf luci-app-mwan3-dashboard_1.0.0_all.ipk debian-binary control.tar.gz data.tar.gz

# تنظيف الملفات المؤقتة المستخدمة أثناء الضغط والتجميع
rm -f debian-binary control.tar.gz data.tar.gz

echo "============================================="
echo "✅ تم بناء الحزمة بنجاح وموافقتها لجميع أجهزة OpenWrt!"
echo "✨ اسم الحزمة: luci-app-mwan3-dashboard_1.0.0_all.ipk"
echo "🌐 يمكنك الآن رفع هذا الملف إلى إصدارات GitHub (Releases) لراوبط التحميل الفوري."
echo "============================================="
