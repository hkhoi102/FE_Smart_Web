# Debug POS Auto Workflow - Sửa lỗi "chạy hoài"

## 🐛 **Vấn đề**
Hệ thống POS bị "chạy hoài" ở trạng thái "Đang tạo đơn hàng..." và không chuyển sang bước tiếp theo.

## 🔍 **Nguyên nhân phát hiện**

### **1. API Format không đúng**
- **Backend cần**: `Order.OrderStatus` enum với format đầy đủ
- **Frontend gửi**: String đơn giản `"DELIVERING"`, `"COMPLETED"`

### **2. Request Body thiếu thông tin**
- **Backend cần**: `warehouseId`, `stockLocationId`, `note`
- **Frontend gửi**: Chỉ có `status`

## 🔧 **Sửa lỗi đã thực hiện**

### **1. Cập nhật Request Body**
```typescript
const requestBody = {
  status: newStatus,                    // "DELIVERING" hoặc "COMPLETED"
  note: `POS: Chuyển trạng thái sang ${newStatus}`,
  warehouseId: 1,                      // Default warehouse for POS
  stockLocationId: 1                   // Default stock location for POS
}
```

### **2. Thêm Debug Logging**
```typescript
console.log('📋 Request body:', requestBody)
console.log('🌐 API URL:', `${API_BASE_URL}/orders/${currentOrder.id}/status`)
console.log('📡 Response status:', response.status)
console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
console.log('✅ Order status updated:', updatedOrder)
```

### **3. Enhanced Error Handling**
```typescript
if (response.ok) {
  const updatedOrder = await response.json()
  console.log('✅ Order status updated:', updatedOrder)
  // ... xử lý thành công
} else {
  const errorText = await response.text()
  console.error('❌ Failed to update order status:', response.status, response.statusText)
  console.error('❌ Error response body:', errorText)
  setError(`Không thể cập nhật trạng thái: ${response.status} ${response.statusText}`)
}
```

## 📊 **Backend API Requirements**

### **PATCH /api/orders/{id}/status**
```http
PATCH /api/orders/{id}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "DELIVERING",           // Order.OrderStatus enum
  "note": "POS: Chuyển trạng thái sang DELIVERING",
  "warehouseId": 1,                 // Required for inventory
  "stockLocationId": 1              // Required for inventory
}
```

### **Order.OrderStatus Enum Values**
```java
public enum OrderStatus {
    PENDING,        // Chờ xử lý
    CONFIRMED,      // Đã xác nhận
    DELIVERING,     // Đang giao hàng
    COMPLETED,      // Hoàn thành
    CANCELLED       // Đã hủy
}
```

## 🔄 **Workflow Debug Steps**

### **1. Kiểm tra Console Logs**
Mở Developer Tools → Console và tìm:
```
🔄 Updating order 47 to DELIVERING
📋 Request body: {status: "DELIVERING", note: "POS: Chuyển trạng thái sang DELIVERING", warehouseId: 1, stockLocationId: 1}
🌐 API URL: http://localhost:3002/api/orders/47/status
📡 Response status: 200
✅ Order status updated: {success: true, data: {...}}
```

### **2. Kiểm tra Network Tab**
Mở Developer Tools → Network và tìm:
- `PATCH /api/orders/47/status` với status 200
- Request body có đầy đủ `status`, `note`, `warehouseId`, `stockLocationId`
- Response có `success: true`

### **3. Kiểm tra UI Updates**
- Status indicator chuyển từ 🟡 → 🔵 → 🟢
- Messages thay đổi: "Đang tạo đơn hàng..." → "Đang xuất kho..." → "Hoàn thành!"
- Buttons thay đổi: "Hoàn thành bán hàng" → "Đang xử lý đơn hàng..." → "Tạo đơn hàng mới"

## 🚨 **Các lỗi có thể gặp**

### **1. 400 Bad Request**
```
❌ Error response body: {"success":false,"message":"Invalid status value"}
```
**Giải pháp**: Kiểm tra `status` có đúng enum value không

### **2. 404 Not Found**
```
❌ Error response body: {"success":false,"message":"Order not found"}
```
**Giải pháp**: Kiểm tra `currentOrder.id` có đúng không

### **3. 403 Forbidden**
```
❌ Error response body: {"success":false,"message":"Access denied"}
```
**Giải pháp**: Kiểm tra JWT token có hợp lệ không

### **4. 500 Internal Server Error**
```
❌ Error response body: {"success":false,"message":"Error updating order status: ..."}
```
**Giải pháp**: Kiểm tra backend logs, có thể lỗi database hoặc inventory service

## ✅ **Kết quả mong đợi**

### **Timeline hoạt động:**
```
T=0s:    Click "Hoàn thành bán hàng"
T=0s:    Tạo đơn hàng → PENDING
T=1s:    PATCH /orders/47/status → DELIVERING (200 OK)
T=2s:    PATCH /orders/47/status → COMPLETED (200 OK)
T=4s:    Auto reset form
```

### **Console Logs:**
```
🔄 Updating order 47 to DELIVERING
📋 Request body: {status: "DELIVERING", note: "POS: Chuyển trạng thái sang DELIVERING", warehouseId: 1, stockLocationId: 1}
🌐 API URL: http://localhost:3002/api/orders/47/status
📡 Response status: 200
✅ Order status updated: {success: true, data: {id: 47, status: "DELIVERING", ...}}

🔄 Updating order 47 to COMPLETED
📋 Request body: {status: "COMPLETED", note: "POS: Chuyển trạng thái sang COMPLETED", warehouseId: 1, stockLocationId: 1}
🌐 API URL: http://localhost:3002/api/orders/47/status
📡 Response status: 200
✅ Order status updated: {success: true, data: {id: 47, status: "COMPLETED", ...}}
```

## 🎯 **Test Instructions**

1. **Mở Developer Tools** (F12)
2. **Chọn sản phẩm** và click "Hoàn thành bán hàng"
3. **Theo dõi Console** để xem debug logs
4. **Kiểm tra Network tab** để xem API calls
5. **Quan sát UI** để xem status changes

Nếu vẫn bị "chạy hoài", hãy copy console logs và gửi để debug tiếp! 🚀
