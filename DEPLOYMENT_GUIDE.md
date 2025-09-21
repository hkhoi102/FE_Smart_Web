# 🚀 Hướng dẫn Deploy Frontend với Backend API

## 📋 Tổng quan

Frontend đã được tích hợp hoàn toàn với Backend API thông qua các service layer. Tất cả API calls đều được quản lý tập trung và dễ dàng cấu hình cho các môi trường khác nhau.

## 🔧 Cấu hình Environment

### 1. **File Environment Variables**

Tạo file `.env` trong thư mục gốc của frontend:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8085/api

# App Configuration
VITE_APP_NAME=Smart Web
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=false
```

### 2. **Các môi trường khác nhau**

#### **Development (Local)**
```env
VITE_API_BASE_URL=http://localhost:8085/api
```

#### **Staging**
```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
```

#### **Production**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## 🏗️ Cấu trúc Service Layer

### **1. AuthService** (`src/services/authService.ts`)
- Quản lý authentication và authorization
- JWT token management
- Login/logout functionality

### **2. UserService** (`src/services/userService.ts`)
- Quản lý user CRUD operations
- Pagination và search
- Role management

### **3. ProductService** (`src/services/productService.ts`)
- Quản lý sản phẩm (nếu có)

## 🔐 Authentication Flow

### **1. Login Process**
```typescript
// 1. User nhập email/password
const success = await AuthService.login(email, password)

// 2. Lấy thông tin user
const userData = await AuthService.getCurrentUser(accessToken)

// 3. Kiểm tra role (ADMIN/MANAGER)
if (!AuthService.hasAdminAccess(userData)) {
  return false
}

// 4. Lưu token vào localStorage
localStorage.setItem('access_token', accessToken)
localStorage.setItem('refresh_token', refreshToken)
```

### **2. API Calls với Authentication**
```typescript
// Tất cả API calls đều tự động thêm Authorization header
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  'Content-Type': 'application/json',
}
```

## 📊 User Management Features

### **1. Danh sách Users**
- ✅ Phân trang (pagination)
- ✅ Tìm kiếm theo tên/email
- ✅ Lọc theo role
- ✅ Loading states
- ✅ Error handling

### **2. CRUD Operations**
- ✅ Tạo user mới
- ✅ Cập nhật thông tin user
- ✅ Xóa user (vô hiệu hóa)
- ✅ Cập nhật trạng thái active/inactive
- ✅ Cập nhật role

### **3. UI Features**
- ✅ Modal forms
- ✅ Detail view
- ✅ Real-time updates
- ✅ Responsive design

## 🚀 Deployment Steps

### **1. Build cho Production**
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Files sẽ được tạo trong thư mục dist/
```

### **2. Environment Variables cho Production**

Tạo file `.env.production`:
```env
VITE_API_BASE_URL=https://your-production-api.com/api
VITE_APP_NAME=Smart Web
VITE_APP_VERSION=1.0.0
```

### **3. Deploy lên các platform**

#### **Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables trong Vercel dashboard
```

#### **Netlify**
```bash
# Build
npm run build

# Deploy thư mục dist/ lên Netlify
# Set environment variables trong Netlify dashboard
```

#### **AWS S3 + CloudFront**
```bash
# Build
npm run build

# Upload dist/ lên S3 bucket
# Configure CloudFront distribution
# Set environment variables trong build process
```

## 🔧 Configuration cho các môi trường

### **1. Development**
```bash
# Chạy local với backend local
npm run dev
# API: http://localhost:8085/api
```

### **2. Staging**
```bash
# Build với staging config
npm run build
# Deploy lên staging server
# API: https://staging-api.yourdomain.com/api
```

### **3. Production**
```bash
# Build với production config
npm run build
# Deploy lên production server
# API: https://api.yourdomain.com/api
```

## 🛠️ Troubleshooting

### **1. CORS Issues**
```javascript
// Backend cần cấu hình CORS cho frontend domain
@CrossOrigin(origins = {"http://localhost:3000", "https://yourdomain.com"})
```

### **2. Authentication Issues**
```javascript
// Kiểm tra token có hợp lệ không
const token = localStorage.getItem('access_token')
if (!token) {
  // Redirect to login
}
```

### **3. API Connection Issues**
```javascript
// Kiểm tra API base URL
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)

// Kiểm tra network connectivity
fetch(API_BASE_URL + '/health')
  .then(response => console.log('API Health:', response.status))
```

## 📝 Best Practices

### **1. Error Handling**
- Tất cả API calls đều có try/catch
- Hiển thị error messages thân thiện
- Log errors để debug

### **2. Loading States**
- Hiển thị loading spinner khi đang tải
- Disable buttons khi đang submit
- Optimistic updates khi có thể

### **3. Security**
- Không lưu sensitive data trong localStorage
- Validate input trước khi gửi API
- Handle token expiration

### **4. Performance**
- Debounce search input
- Pagination cho large datasets
- Lazy loading cho modals

## 🎯 Kết luận

Frontend đã được tích hợp hoàn toàn với Backend API và sẵn sàng để deploy. Tất cả API calls đều được quản lý tập trung thông qua service layer, giúp dễ dàng maintain và scale.

### **Tính năng đã hoàn thành:**
- ✅ Authentication với JWT
- ✅ User Management CRUD
- ✅ Role-based Access Control
- ✅ Pagination và Search
- ✅ Error Handling
- ✅ Loading States
- ✅ Responsive UI

### **Sẵn sàng cho:**
- ✅ Development
- ✅ Staging
- ✅ Production
- ✅ Scaling
- ✅ Maintenance
