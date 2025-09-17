# 🔐 Hướng dẫn tích hợp Login Frontend với Backend

## ✅ Đã hoàn thành

### 1. **Cập nhật AuthContext**
- ✅ Thay thế mock data bằng API calls thực tế
- ✅ Sử dụng JWT token từ backend
- ✅ Lưu trữ access token và refresh token
- ✅ Kiểm tra role ADMIN/MANAGER

### 2. **Tạo AuthService**
- ✅ `login()` - Đăng nhập qua API
- ✅ `getCurrentUser()` - Lấy thông tin user
- ✅ `logout()` - Đăng xuất và thu hồi token
- ✅ `hasAdminAccess()` - Kiểm tra quyền admin

### 3. **Cập nhật Login Page**
- ✅ Thay đổi từ username sang email
- ✅ Sử dụng async/await cho API calls
- ✅ Hiển thị lỗi chi tiết
- ✅ Loading states

### 4. **Role-based Access Control**
- ✅ Chỉ cho phép ADMIN và MANAGER đăng nhập
- ✅ ProtectedRoute kiểm tra role
- ✅ Hiển thị thông báo lỗi phù hợp

### 5. **Cập nhật UI Components**
- ✅ AccountDropdown hiển thị thông tin user từ backend
- ✅ Admin page hiển thị tên và role
- ✅ Form đăng nhập sử dụng email

## 🚀 Cách sử dụng

### 1. **Cấu hình Environment**
Tạo file `.env` trong thư mục gốc:
```env
VITE_API_BASE_URL=http://localhost:8085/api
```

### 2. **Chạy Backend Services**
Đảm bảo các service đã chạy:
- Discovery Server: `http://localhost:8761`
- User Service: `http://localhost:8082`
- Auth Service: `http://localhost:8081`
- API Gateway: `http://localhost:8085`

### 3. **Chạy Frontend**
```bash
npm install
npm run dev
```

### 4. **Test Login**
1. Truy cập `http://localhost:3000/login`
2. Đăng nhập với tài khoản ADMIN hoặc MANAGER
3. Kiểm tra chuyển hướng đến `/admin`

## 🔧 API Endpoints được sử dụng

### Auth Service
```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin@example.com",
  "password": "123456"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Service
```http
GET /api/users/me
Authorization: Bearer <accessToken>

Response:
{
  "id": 1,
  "fullName": "Admin User",
  "email": "admin@example.com",
  "role": "ADMIN",
  "phoneNumber": "0912345678",
  "active": true
}
```

## 🛡️ Bảo mật

### 1. **JWT Token Management**
- Access token: 1 giờ
- Refresh token: 14 ngày
- Tự động lưu trong localStorage
- Tự động gửi trong Authorization header

### 2. **Role-based Access**
- Chỉ ADMIN và MANAGER có thể đăng nhập
- USER bị từ chối truy cập
- ProtectedRoute kiểm tra role

### 3. **Error Handling**
- Xử lý lỗi network
- Xử lý lỗi authentication
- Hiển thị thông báo lỗi thân thiện

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **CORS Error**
   ```
   Access to fetch at 'http://localhost:8085/api/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```
   **Giải pháp**: Kiểm tra API Gateway đã cấu hình CORS

2. **401 Unauthorized**
   ```
   GET http://localhost:8085/api/users/me 401 (Unauthorized)
   ```
   **Giải pháp**: Kiểm tra token có hợp lệ không

3. **503 Service Unavailable**
   ```
   GET http://localhost:8085/api/auth/login 503 (Service Unavailable)
   ```
   **Giải pháp**: Kiểm tra các service backend đã chạy chưa

4. **Role Access Denied**
   ```
   Chỉ tài khoản ADMIN hoặc MANAGER mới có thể truy cập trang này
   ```
   **Giải pháp**: Đăng nhập với tài khoản có role ADMIN hoặc MANAGER

### Debug Steps:
1. Mở Developer Tools (F12)
2. Kiểm tra Network tab để xem API calls
3. Kiểm tra Console tab để xem lỗi JavaScript
4. Kiểm tra Application tab > Local Storage để xem tokens

## 📝 Notes

- Frontend sử dụng JWT token để xác thực
- Token được lưu trong localStorage
- Refresh token được sử dụng để làm mới access token
- Chỉ tài khoản ADMIN/MANAGER mới có thể truy cập trang admin
- Tất cả API calls đều đi qua API Gateway (port 8085)
- Hệ thống đã sẵn sàng để tích hợp với các API khác

## 🎯 Kết quả

✅ **Hoàn thành tích hợp login frontend với backend**
✅ **Role-based access control hoạt động**
✅ **JWT token management**
✅ **Error handling đầy đủ**
✅ **UI/UX thân thiện**

Hệ thống đã sẵn sàng để sử dụng trong môi trường production!
