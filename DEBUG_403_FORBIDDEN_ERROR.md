# Debug Lỗi 403 Forbidden - API Order Preview

## 🚨 **Vấn đề**
```
POST http://localhost:3002/api/orders/preview net::ERR_ABORTED 403 (Forbidden)
❌ Order preview failed: 403 Forbidden
```

## 🔍 **Nguyên nhân có thể**

### **1. JWT Token Issues**
- ❌ **Token không tồn tại**: `localStorage.getItem('access_token')` trả về `null`
- ❌ **Token hết hạn**: Token đã expired
- ❌ **Token không hợp lệ**: Format token sai
- ❌ **Token không có quyền**: User không có quyền truy cập API preview

### **2. API Endpoint Issues**
- ❌ **URL sai**: Endpoint không tồn tại hoặc sai port
- ❌ **Method sai**: API chỉ chấp nhận POST
- ❌ **Headers thiếu**: Thiếu `Content-Type` hoặc `Authorization`

### **3. Backend Issues**
- ❌ **CORS**: Backend không cho phép request từ frontend
- ❌ **Authentication**: Backend không nhận diện được token
- ❌ **Authorization**: User role không có quyền access API preview

## 🔧 **Giải pháp đã áp dụng**

### **1. Enhanced Debug Logging**
```typescript
// Debug token
const token = localStorage.getItem('access_token')
console.log('🔑 Token available:', !!token)
console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'null')
console.log('🌐 API URL:', `${API_BASE_URL}/orders/preview`)
console.log('📋 Preview request:', previewRequest)

// Debug response
console.log('📡 Response status:', response.status)
console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
```

### **2. Token Validation**
```typescript
const checkAndRefreshToken = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.log('❌ No token found')
    return false
  }

  // Kiểm tra token có hết hạn không (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token expired')
      localStorage.removeItem('access_token')
      return false
    }
    console.log('✅ Token is valid')
    return true
  } catch (error) {
    console.log('❌ Invalid token format')
    return false
  }
}
```

### **3. Better Error Handling**
```typescript
if (response.status === 403) {
  setError('Không có quyền truy cập API preview. Vui lòng kiểm tra đăng nhập.')
} else if (response.status === 401) {
  setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
} else {
  setError(`Lỗi API preview: ${response.status} ${response.statusText}`)
}
```

### **4. Test Button**
```tsx
<button
  onClick={fetchOrderPreview}
  disabled={previewLoading || orderItems.length === 0}
  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
>
  {previewLoading ? 'Đang tính...' : 'Test Preview API'}
</button>
```

## 🔍 **Cách Debug**

### **Bước 1: Kiểm tra Console Logs**
Mở Developer Tools → Console và xem logs:
```
🔄 Calling order/preview API...
🔑 Token available: true/false
🔑 Token preview: eyJhbGciOiJIUzI1NiIs...
🌐 API URL: http://localhost:3002/api/orders/preview
📋 Preview request: { orderDetails: [...] }
📡 Response status: 403
📡 Response headers: { ... }
❌ Order preview failed: 403 Forbidden
❌ Error response body: { ... }
```

### **Bước 2: Kiểm tra Token**
```javascript
// Trong Console
localStorage.getItem('access_token')
// Nếu null → Cần đăng nhập lại

// Kiểm tra token format
const token = localStorage.getItem('access_token')
console.log('Token:', token)
console.log('Token length:', token?.length)

// Decode token (nếu có)
try {
  const payload = JSON.parse(atob(token.split('.')[1]))
  console.log('Token payload:', payload)
  console.log('Token expires:', new Date(payload.exp * 1000))
} catch (e) {
  console.log('Invalid token format')
}
```

### **Bước 3: Kiểm tra Network Tab**
1. Mở Developer Tools → Network
2. Click "Test Preview API"
3. Xem request details:
   - **URL**: `http://localhost:3002/api/orders/preview`
   - **Method**: `POST`
   - **Headers**: `Authorization: Bearer ...`, `Content-Type: application/json`
   - **Request Body**: `{ orderDetails: [...] }`
   - **Response**: Status 403, Response body

### **Bước 4: Test API trực tiếp**
```bash
# Test với curl
curl -X POST http://localhost:3002/api/orders/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"orderDetails":[{"productUnitId":1,"quantity":2}]}'
```

## 🛠️ **Các bước khắc phục**

### **1. Nếu Token không tồn tại:**
```javascript
// Đăng nhập lại
localStorage.setItem('access_token', 'NEW_TOKEN_HERE')
```

### **2. Nếu Token hết hạn:**
```javascript
// Refresh token hoặc đăng nhập lại
// Có thể implement auto-refresh token
```

### **3. Nếu API endpoint sai:**
```typescript
// Kiểm tra API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
console.log('API_BASE_URL:', API_BASE_URL)

// Có thể cần thay đổi port
// http://localhost:3002 → http://localhost:8080
```

### **4. Nếu Backend chưa start:**
```bash
# Start backend service
cd backend
npm start
# hoặc
java -jar order-service.jar
```

### **5. Nếu CORS issue:**
Backend cần thêm CORS headers:
```java
@CrossOrigin(origins = "*")
@RestController
public class OrderController {
    // ...
}
```

## 📋 **Checklist Debug**

- [ ] **Token exists**: `localStorage.getItem('access_token')` không null
- [ ] **Token valid**: Token chưa hết hạn và format đúng
- [ ] **API URL correct**: URL đúng và backend đang chạy
- [ ] **Request headers**: Có `Authorization` và `Content-Type`
- [ ] **Request body**: Format đúng theo API spec
- [ ] **Backend running**: Service đang chạy trên port đúng
- [ ] **CORS enabled**: Backend cho phép request từ frontend
- [ ] **User permissions**: User có quyền access API preview

## 🎯 **Kết quả mong đợi**

Sau khi debug, console sẽ hiển thị:
```
🔄 Calling order/preview API...
🔑 Token available: true
🔑 Token preview: eyJhbGciOiJIUzI1NiIs...
🌐 API URL: http://localhost:3002/api/orders/preview
📋 Preview request: { orderDetails: [...] }
📡 Response status: 200
✅ Order preview response: { success: true, data: {...} }
```

Hệ thống sẽ hiển thị khuyến mãi và giá chính xác! 🎉
