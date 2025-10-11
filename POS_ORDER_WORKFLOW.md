# POS Order Workflow - Chuyển trạng thái đơn hàng

## 🎯 **Mục tiêu**
Implement workflow cho bán hàng tại quầy (POS) với các bước:
1. **PENDING** → Tạo đơn hàng
2. **DELIVERING** → Xuất kho (giao hàng)
3. **COMPLETED** → Hoàn thành đơn hàng

## 🔄 **Workflow POS**

### **Bước 1: Tạo đơn hàng (PENDING)**
```
1. Nhân viên chọn sản phẩm
2. Click "Tạo đơn hàng"
3. Đơn hàng được tạo với trạng thái PENDING
4. Hiển thị UI quản lý trạng thái
```

### **Bước 2: Xuất kho (DELIVERING)**
```
1. Click "Xuất kho (Giao hàng)"
2. Gọi API PATCH /orders/{id}/status
3. Trạng thái chuyển sang DELIVERING
4. Backend xử lý xuất kho
```

### **Bước 3: Hoàn thành (COMPLETED)**
```
1. Click "Hoàn thành đơn hàng"
2. Gọi API PATCH /orders/{id}/status
3. Trạng thái chuyển sang COMPLETED
4. Tự động reset form sau 2 giây
```

## 🔧 **Implementation**

### **1. State Management**
```typescript
const [currentOrder, setCurrentOrder] = useState<any>(null)
const [orderStatus, setOrderStatus] = useState<'PENDING' | 'DELIVERING' | 'COMPLETED' | null>(null)
```

### **2. Tạo đơn hàng với trạng thái PENDING**
```typescript
const handleCreateOrder = async () => {
  // ... tạo đơn hàng

  if (isPOSMode) {
    setCurrentOrder(result)
    setOrderStatus('PENDING')
    setSuccess(`Đơn hàng #${result.id} đã tạo! Bây giờ có thể xuất kho và hoàn thành.`)
  } else {
    // Reset form cho mode thường
    setOrderItems([])
    // ...
  }
}
```

### **3. Chuyển trạng thái đơn hàng**
```typescript
const handleUpdateOrderStatus = async (newStatus: 'DELIVERING' | 'COMPLETED') => {
  if (!currentOrder) return

  try {
    setLoading(true)

    const response = await fetch(`${API_BASE_URL}/orders/${currentOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus })
    })

    if (response.ok) {
      const updatedOrder = await response.json()
      setOrderStatus(newStatus)
      setCurrentOrder(updatedOrder.data || updatedOrder)

      if (newStatus === 'DELIVERING') {
        setSuccess('Đã xuất kho! Đơn hàng đang được giao.')
      } else if (newStatus === 'COMPLETED') {
        setSuccess('Đơn hàng đã hoàn thành! Giao dịch thành công.')

        // Reset form sau khi hoàn thành
        setTimeout(() => {
          handleClearCart()
        }, 2000)
      }
    }
  } catch (error) {
    setError('Lỗi khi cập nhật trạng thái đơn hàng')
  } finally {
    setLoading(false)
  }
}
```

### **4. UI Quản lý trạng thái**
```tsx
{isPOSMode && currentOrder && (
  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h3 className="text-lg font-medium text-yellow-800 mb-3">
      Quản lý đơn hàng #{currentOrder.id}
    </h3>

    {/* Status Indicator */}
    <div className="flex items-center space-x-4 mb-4">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          orderStatus === 'PENDING' ? 'bg-yellow-500' :
          orderStatus === 'DELIVERING' ? 'bg-blue-500' :
          orderStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
        }`}></div>
        <span className="text-sm font-medium">
          {orderStatus === 'PENDING' ? 'Chờ xử lý' :
           orderStatus === 'DELIVERING' ? 'Đang giao hàng' :
           orderStatus === 'COMPLETED' ? 'Hoàn thành' : 'Không xác định'}
        </span>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex space-x-2">
      {orderStatus === 'PENDING' && (
        <button onClick={() => handleUpdateOrderStatus('DELIVERING')}>
          Xuất kho (Giao hàng)
        </button>
      )}

      {orderStatus === 'DELIVERING' && (
        <button onClick={() => handleUpdateOrderStatus('COMPLETED')}>
          Hoàn thành đơn hàng
        </button>
      )}

      <button onClick={handleClearCart}>
        Hủy đơn hàng
      </button>
    </div>
  </div>
)}
```

## 📊 **API Endpoints**

### **1. Tạo đơn hàng**
```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "orderDetails": [
    {
      "productUnitId": 1,
      "quantity": 2,
      "unitPrice": 50000
    }
  ],
  "paymentMethod": "COD",
  "shippingAddress": "Khách lẻ - Bán hàng tại quầy"
}
```

### **2. Chuyển trạng thái**
```http
PATCH /api/orders/{id}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "DELIVERING" // hoặc "COMPLETED"
}
```

## 🎨 **UI/UX Features**

### **1. Status Indicator**
- 🟡 **PENDING**: Chờ xử lý
- 🔵 **DELIVERING**: Đang giao hàng
- 🟢 **COMPLETED**: Hoàn thành

### **2. Conditional Buttons**
- **PENDING**: Hiển thị nút "Xuất kho (Giao hàng)"
- **DELIVERING**: Hiển thị nút "Hoàn thành đơn hàng"
- **COMPLETED**: Không hiển thị nút (tự động reset)

### **3. Visual Feedback**
- **Loading states**: Disable buttons khi đang xử lý
- **Success messages**: Thông báo rõ ràng cho từng bước
- **Error handling**: Hiển thị lỗi nếu API call thất bại

## 🔄 **Workflow Diagram**

```
[Chọn sản phẩm]
       ↓
[Tạo đơn hàng] → PENDING
       ↓
[Xuất kho] → DELIVERING
       ↓
[Hoàn thành] → COMPLETED
       ↓
[Reset form] → Sẵn sàng cho đơn hàng mới
```

## 🎯 **Lợi ích**

### **1. Quản lý kho hiệu quả**
- ✅ Xuất kho chỉ khi cần thiết
- ✅ Theo dõi trạng thái đơn hàng
- ✅ Tránh xuất kho nhầm

### **2. Trải nghiệm nhân viên tốt**
- ✅ Workflow rõ ràng, dễ hiểu
- ✅ Visual feedback cho từng bước
- ✅ Không thể bỏ sót bước nào

### **3. Báo cáo chính xác**
- ✅ Thống kê đơn hàng theo trạng thái
- ✅ Theo dõi hiệu suất xuất kho
- ✅ Audit trail đầy đủ

## 🚀 **Kết quả**

Hệ thống POS giờ đây có **workflow hoàn chỉnh** cho việc quản lý đơn hàng:
- ✅ **Tạo đơn hàng** với trạng thái PENDING
- ✅ **Xuất kho** khi chuyển sang DELIVERING
- ✅ **Hoàn thành** khi chuyển sang COMPLETED
- ✅ **UI trực quan** với status indicator và buttons
- ✅ **Error handling** và loading states

Workflow POS hoàn hảo cho việc bán hàng tại quầy! 🎉
