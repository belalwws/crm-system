# 🔧 حل المشاكل الشائعة (Troubleshooting)

## 🐛 Backend Issues

### 1. MongoDB Connection Error

**الخطأ:**
```
MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```

**الحلول:**

**A. إذا كنت تستخدم MongoDB محلياً:**
```bash
# تحقق من تشغيل MongoDB
# Windows:
net start MongoDB

# أو افتح MongoDB Compass
```

**B. استخدم MongoDB Atlas (أسهل):**
1. اذهب إلى https://www.mongodb.com/cloud/atlas
2. أنشئ cluster مجاني
3. اضغط "Connect" → "Connect your application"
4. انسخ Connection String
5. في `backend/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/crm_db?retryWrites=true&w=majority
```

---

### 2. JWT Secret Error

**الخطأ:**
```
secretOrPrivateKey must have a value
```

**الحل:**
تأكد من ملف `.env` في Backend:
```env
JWT_SECRET=your_secret_key_here_123456
```

---

### 3. Port Already in Use

**الخطأ:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**الحلول:**

**Windows PowerShell:**
```powershell
# اعرف ما يستخدم البورت
netstat -ano | findstr :5000

# أوقف العملية (غير PID بالرقم الظاهر)
taskkill /PID [PID] /F
```

**أو غير البورت في `.env`:**
```env
PORT=5001
```

---

### 4. CORS Error

**الخطأ:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**تحقق من:** [backend/src/server.ts](backend/src/server.ts#L20)
```typescript
app.use(cors()); // موجود بالفعل
```

---

## 🎨 Frontend Issues

### 1. Module Not Found

**الخطأ:**
```
Cannot find module 'react-router-dom'
```

**الحل:**
```bash
cd frontend
npm install
```

---

### 2. Axios Network Error

**الخطأ:**
```
AxiosError: Network Error
```

**الأسباب والحلول:**

**A. Backend مش شغال:**
```bash
# تأكد من تشغيل Backend
cd backend
npm run dev
```

**B. URL غلط:**
تحقق من [frontend/vite.config.ts](frontend/vite.config.ts):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5000', // تأكد من الـ port
    changeOrigin: true,
  },
},
```

---

### 3. Login لا يعمل

**المشكلة:** بعد Login، لا ينتقل للـ Dashboard

**تحقق من:**
1. **Console في المتصفح** (F12)
2. **Network tab** - شوف الـ response
3. **Application tab** → Local Storage - هل الـ token محفوظ؟

**الحل:**
```typescript
// في AuthContext.tsx
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

---

### 4. Tailwind Styles لا تظهر

**الخطأ:** الـ classes موجودة لكن لا styling

**الحل:**

**A. تحقق من** [frontend/src/main.tsx](frontend/src/main.tsx):
```typescript
import './index.css'; // مهم جداً!
```

**B. تحقق من** [frontend/src/index.css](frontend/src/index.css):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**C. أعد تشغيل Dev Server:**
```bash
# Ctrl+C ثم
npm run dev
```

---

## 🔐 Authentication Issues

### 1. Token Expired

**الخطأ:**
```
401 Unauthorized - Token expired
```

**الحل:**
- سجل دخول مرة أخرى
- أو في `.env` زود الـ expire time:
```env
JWT_EXPIRE=30d
```

---

### 2. Cannot Read Property 'id' of undefined

**الخطأ في Backend:**
```
Cannot read property 'id' of undefined (req.user)
```

**السبب:** Auth middleware مش متطبق على الـ route

**الحل:** [backend/src/routes/customerRoutes.ts](backend/src/routes/customerRoutes.ts)
```typescript
router.use(protect); // تأكد من وجوده قبل الـ routes
```

---

## 📦 Installation Issues

### 1. npm install فشل

**الخطأ:**
```
npm ERR! code ERESOLVE
```

**الحل:**
```bash
# امسح node_modules و package-lock.json
rm -rf node_modules package-lock.json

# أو Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json

# ثم أعد التثبيت
npm install

# أو استخدم:
npm install --legacy-peer-deps
```

---

### 2. TypeScript Errors

**الخطأ:**
```
Type 'string' is not assignable to type 'number'
```

**نصائح:**
- اقرأ الخطأ بتمعن - TypeScript واضح جداً
- استخدم `any` مؤقتاً للتجربة (لكن حاول تتجنبه)
- تأكد من الـ types في [src/types/index.ts](src/types/index.ts)

---

## 🗄️ Database Issues

### 1. Validation Error

**الخطأ:**
```
ValidationError: email: Path `email` is required.
```

**السبب:** حقل إجباري مش متملي

**الحل:**
تحقق من الـ form في Frontend أو الـ request body:
```typescript
// تأكد من إرسال كل الحقول المطلوبة
{
  name: "...",
  email: "...", // مطلوب
  // ...
}
```

---

### 2. Duplicate Key Error

**الخطأ:**
```
E11000 duplicate key error collection: crm_db.users index: email_1
```

**السبب:** Email موجود بالفعل (unique constraint)

**الحل:**
- استخدم email مختلف
- أو امسح البيانات القديمة:
```javascript
// في MongoDB Compass أو mongosh
db.users.deleteMany({});
```

---

## 🖥️ Environment Issues

### 1. Environment Variables لا تعمل

**المشكلة:** `process.env.PORT` يرجع `undefined`

**الحل:**

**في Backend:**
```typescript
// في server.ts في أول السطر
import dotenv from 'dotenv';
dotenv.config(); // مهم جداً!
```

**تأكد من:**
- الملف اسمه `.env` (مش `env.txt`)
- الملف في نفس المجلد مع `package.json`

---

### 2. React Environment Variables

**في React/Vite:**
```env
# يجب أن تبدأ بـ VITE_
VITE_API_URL=http://localhost:5000
```

```typescript
// استخدامها
const apiUrl = import.meta.env.VITE_API_URL;
```

**ملاحظة:** في مشروعنا نستخدم proxy فلا نحتاجها

---

## 🌐 Deployment Issues

### 1. Build Errors

**في Frontend:**
```bash
npm run build
```

**إذا فشل:**
- اقرأ الخطأ
- غالباً TypeScript errors
- تأكد من كل الـ imports صحيحة

---

### 2. Production Database

**في Production:**
```env
# استخدم MongoDB Atlas فقط
MONGODB_URI=mongodb+srv://...

# لا تستخدم localhost
# ❌ MONGODB_URI=mongodb://localhost:27017/crm_db
```

---

## 🔍 Debugging Tips

### 1. Backend Debugging

```typescript
// أضف console.log في كل مكان
console.log('📝 Request body:', req.body);
console.log('👤 User:', req.user);
console.log('✅ Success');
```

### 2. Frontend Debugging

```typescript
// استخدم Console
console.log('State:', formData);
console.log('Response:', response.data);

// أو React DevTools
// F12 → Components tab
```

### 3. Network Tab

**في المتصفح (F12):**
1. اذهب لـ Network tab
2. شغل الـ request
3. شوف:
   - Status code (200, 400, 500, etc.)
   - Request payload
   - Response data

---

## 📞 كيف تطلب مساعدة

إذا عندك مشكلة:

### 1. اجمع المعلومات:
- ✅ رسالة الخطأ كاملة
- ✅ الكود المتعلق
- ✅ ماذا جربت؟
- ✅ Console output

### 2. ابحث في:
- Google: "[error message] react typescript"
- Stack Overflow
- GitHub Issues

### 3. اسأل في:
- Reddit: r/reactjs, r/node
- Discord servers
- Stack Overflow

---

## 🛠️ Useful Commands

### Clear Everything and Start Fresh:

**Backend:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Check Versions:
```bash
node --version    # v18+
npm --version     # 9+
```

---

## ✅ Prevention Tips

1. **Always commit working code**
   ```bash
   git add .
   git commit -m "Working state before changes"
   ```

2. **Test incrementally**
   - لا تكتب كود كثير ثم تختبر
   - اختبر كل feature لوحده

3. **Read error messages**
   - اقرأ الخطأ كامل
   - غالباً يقول المشكلة بالضبط

4. **Use TypeScript properly**
   - لا تستخدم `any` كثير
   - TypeScript موجود لمساعدتك

---

**تذكر:** كل developer يواجه errors - المهم تتعلم تحلها! 💪
