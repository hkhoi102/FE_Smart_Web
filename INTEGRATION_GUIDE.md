# Hướng dẫn tích hợp Frontend với Backend

## 🚀 Cấu hình và chạy hệ thống

### 1. Backend Services (Chạy trước)
Đảm bảo các service backend đã chạy:
- Discovery Server (Eureka): `http://localhost:8761`
- User Service: `http://localhost:8082`
- Auth Service: `http://localhost:8081`
- API Gateway: `http://localhost:8085`

### 2. Frontend Configuration
Tạo file `.env` trong thư mục gốc của frontend:
```env
VITE_API_BASE_URL=http://localhost:8085/api
```

### 3. Chạy Frontend
```bash
npm install
npm run dev
```

## 🔐 Test Login Flow

### 1. Tạo tài khoản Admin/Manager
Trước tiên cần tạo tài khoản có role ADMIN hoặc MANAGER:

**POST** `http://localhost:8085/api/auth/register`
```json
{
  "fullName": "Admin User",
  "email": "admin@example.com",
  "password": "123456",
  "phoneNumber": "0912345678"
}
```

**POST** `http://localhost:8085/api/users/activate`
```json
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

**POST** `http://localhost:8085/api/users` (với token admin)
```json
{
  "fullName": "Manager User",
  "email": "manager@example.com",
  "password": "123456",
  "phoneNumber": "0912345679",
  "role": "MANAGER"
}
```

### 2. Test Login trên Frontend
1. Truy cập `http://localhost:3000/login`
2. Nhập email và password của tài khoản ADMIN hoặc MANAGER
3. Kiểm tra đăng nhập thành công và chuyển hướng đến `/admin`

## 🛡️ Role-based Access Control

### Các role được phép truy cập Admin:
- **ADMIN**: Toàn quyền truy cập
- **MANAGER**: Toàn quyền truy cập
- **USER**: Bị từ chối truy cập

### Test các trường hợp:
1. **Đăng nhập với ADMIN**: ✅ Thành công
2. **Đăng nhập với MANAGER**: ✅ Thành công
3. **Đăng nhập với USER**: ❌ Bị từ chối
4. **Đăng nhập với email/password sai**: ❌ Bị từ chối

## 🔧 API Endpoints được sử dụng

### Auth Service
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh` - Làm mới token

### User Service
- `GET /api/users/me` - Lấy thông tin user hiện tại

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **CORS Error**
   - Kiểm tra API Gateway đã cấu hình CORS
   - Đảm bảo frontend chạy trên port 3000

2. **401 Unauthorized**
   - Kiểm tra token có hợp lệ không
   - Kiểm tra role có đúng ADMIN/MANAGER không

3. **503 Service Unavailable**
   - Kiểm tra các service backend đã chạy chưa
   - Kiểm tra Eureka UI: `http://localhost:8761`

4. **Network Error**
   - Kiểm tra API Gateway có chạy trên port 8085 không
   - Kiểm tra file `.env` có đúng URL không

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
