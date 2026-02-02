# 🚀 كيفية تشغيل المشروع

## 📋 المتطلبات

تأكد من تثبيت:
- Node.js (v18 أو أحدث)
- MongoDB (محلي أو MongoDB Atlas)
- Git

## 🔧 خطوات التشغيل

### 1. تثبيت MongoDB (إذا لم يكن مثبتاً)

**الطريقة الأسهل - MongoDB Atlas (مجاني على السحابة):**
1. اذهب إلى https://www.mongodb.com/cloud/atlas
2. أنشئ حساب مجاني
3. أنشئ Cluster جديد (FREE Tier)
4. احصل على Connection String
5. ضعه في ملف `.env` في Backend

**أو تثبيت MongoDB محلياً:**
- Windows: قم بتنزيل MongoDB Community Server من الموقع الرسمي

### 2. تشغيل Backend

```bash
# انتقل لمجلد Backend
cd backend

# تثبيت المكتبات
npm install

# تأكد من إعداد ملف .env (موجود بالفعل)
# يمكنك تعديله إذا كنت تستخدم MongoDB Atlas

# تشغيل السيرفر في وضع التطوير
npm run dev
```

السيرفر سيعمل على: http://localhost:5000

### 3. تشغيل Frontend (في terminal جديد)

```bash
# انتقل لمجلد Frontend
cd frontend

# تثبيت المكتبات
npm install

# تشغيل التطبيق
npm run dev
```

التطبيق سيعمل على: http://localhost:3000

## 🎯 الاستخدام

1. افتح http://localhost:3000
2. سجل حساب جديد من صفحة Register
3. ابدأ في إضافة العملاء والصفقات والمهام
4. استمتع باستخدام الـ CRM!

## 📝 ملاحظات مهمة

### البيانات التجريبية
- يمكنك إنشاء عدة حسابات لاختبار النظام
- كل مستخدم يرى بياناته الخاصة فقط

### الأمان
- الـ JWT Token يتم حفظه في localStorage
- كلمات المرور مشفرة باستخدام bcrypt
- كل API محمي بـ Authentication middleware

### المشاكل الشائعة

**مشكلة: MongoDB connection error**
- تأكد من تشغيل MongoDB محلياً
- أو تأكد من صحة Connection String في `.env`

**مشكلة: Port already in use**
- غير PORT في Backend `.env` (مثلاً 5001)
- غير port في Frontend `vite.config.ts`

## 🌟 التطوير المستقبلي

أفكار لتحسين المشروع:
- إضافة صفحات Deals و Tasks بالكامل (نفس منطق Customers)
- إضافة Charts باستخدام Chart.js
- إضافة البحث والفلترة
- إضافة Pagination للقوائم الطويلة
- إضافة Email notifications
- إضافة File upload للعملاء
- تحسين الـ UI/UX

## 📱 للنشر على LinkedIn

عند نشر المشروع:
1. ارفعه على GitHub
2. اكتب وصف احترافي للمشروع
3. أضف screenshots من التطبيق
4. اذكر التقنيات المستخدمة
5. ضع رابط للـ Live Demo (إذا رفعته على Vercel/Netlify)

## 📧 الدعم

إذا واجهت أي مشاكل، راجع:
- Console في المتصفح للأخطاء Frontend
- Terminal الخاص بالـ Backend للأخطاء Backend
- تأكد من تشغيل MongoDB
