# Tích hợp Order Preview API cho POS System

## 🎯 **Mục tiêu**
1. **Bỏ nút "Thêm sản phẩm" và "Xem tất cả"** - Đơn giản hóa UI
2. **Tích hợp API order/preview** - Tự động tính khuyến mãi khi giỏ hàng thay đổi

## ✅ **Các thay đổi đã thực hiện**

### **1. Bỏ nút "Thêm sản phẩm" và "Xem tất cả"**

#### **Trước:**
```tsx
<div className="flex space-x-2">
  <button onClick={() => setShowAddProduct(true)}>
    Thêm sản phẩm
  </button>
  <button onClick={() => setQuickSearch('')}>
    Xem tất cả
  </button>
</div>
```

#### **Sau:**
```tsx
// Đã bỏ hoàn toàn các nút này
// Người dùng chỉ cần click trực tiếp vào sản phẩm từ danh sách
```

#### **Cập nhật text hướng dẫn:**
```tsx
// Trước
"Chưa có sản phẩm nào. Nhấn 'Thêm sản phẩm' để bắt đầu."

// Sau
"Chưa có sản phẩm nào. Chọn sản phẩm từ danh sách bên dưới để bắt đầu."
```

### **2. Tích hợp API order/preview**

#### **A. Thêm State Management**
```typescript
const [orderPreview, setOrderPreview] = useState<any>(null)
const [previewLoading, setPreviewLoading] = useState(false)
```

#### **B. Function gọi API order/preview**
```typescript
const fetchOrderPreview = async () => {
  if (orderItems.length === 0) {
    setOrderPreview(null)
    return
  }

  try {
    setPreviewLoading(true)
    console.log('🔄 Calling order/preview API...')

    const orderDetails = orderItems.map(item => ({
      productUnitId: item.productUnitId,
      quantity: item.quantity
    }))

    const previewRequest = {
      customerId: selectedCustomer?.id || null,
      orderDetails: orderDetails,
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress || null,
      notes: orderNotes || null
    }

    const response = await fetch(`${API_BASE_URL}/orders/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(previewRequest)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Order preview response:', data)
      setOrderPreview(data)
    } else {
      console.error('❌ Order preview failed:', response.status, response.statusText)
      setOrderPreview(null)
    }
  } catch (error) {
    console.error('❌ Error calling order/preview:', error)
    setOrderPreview(null)
  } finally {
    setPreviewLoading(false)
  }
}
```

#### **C. Auto-trigger khi giỏ hàng thay đổi**
```typescript
// Gọi API preview khi giỏ hàng thay đổi
useEffect(() => {
  const timeoutId = setTimeout(() => {
    fetchOrderPreview()
  }, 500) // Debounce 500ms

  return () => clearTimeout(timeoutId)
}, [orderItems, selectedCustomer, paymentMethod, shippingAddress, orderNotes])
```

### **3. Cập nhật UI Order Summary**

#### **A. Loading State**
```tsx
{previewLoading ? (
  <div className="text-center py-4">
    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    <p className="text-gray-500 mt-2">Đang tính toán...</p>
  </div>
) : // ... rest of UI
```

#### **B. Dynamic Pricing từ API**
```tsx
{orderPreview ? (
  <div className="space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Tạm tính:</span>
      <span className="font-medium">{formatCurrency(orderPreview.subtotal || subtotal)}</span>
    </div>

    {orderPreview.discountAmount && orderPreview.discountAmount > 0 && (
      <div className="flex justify-between text-sm text-green-600">
        <span>Khuyến mãi:</span>
        <span>-{formatCurrency(orderPreview.discountAmount)}</span>
      </div>
    )}

    <div className="flex justify-between text-sm text-blue-600">
      <span>Phí vận chuyển:</span>
      <span>
        {orderPreview.shippingFee && orderPreview.shippingFee > 0
          ? formatCurrency(orderPreview.shippingFee)
          : 'Miễn phí'
        }
      </span>
    </div>

    <div className="border-t pt-3">
      <div className="flex justify-between text-lg font-semibold">
        <span>Thành tiền:</span>
        <span className="text-blue-600">{formatCurrency(orderPreview.totalAmount || total)}</span>
      </div>
    </div>

    {orderPreview.appliedPromotions && orderPreview.appliedPromotions.length > 0 && (
      <div className="mt-3 p-3 bg-green-50 rounded-lg">
        <h4 className="text-sm font-medium text-green-800 mb-2">Khuyến mãi đã áp dụng:</h4>
        {orderPreview.appliedPromotions.map((promo: any, index: number) => (
          <div key={index} className="text-sm text-green-700">
            • {promo.name} - {formatCurrency(promo.discountAmount)}
          </div>
        ))}
      </div>
    )}
  </div>
) : // Fallback to original calculation
```

## 🔄 **Flow hoạt động**

### **1. Khi người dùng thêm/sửa/xóa sản phẩm:**
```
1. orderItems state thay đổi
2. useEffect trigger sau 500ms (debounce)
3. fetchOrderPreview() được gọi
4. API order/preview trả về thông tin khuyến mãi
5. UI Order Summary cập nhật với giá mới
```

### **2. Khi thay đổi thông tin khách hàng/phương thức thanh toán:**
```
1. selectedCustomer/paymentMethod thay đổi
2. useEffect trigger sau 500ms
3. API preview được gọi lại với thông tin mới
4. Khuyến mãi được tính lại theo khách hàng
```

## 📊 **API Request/Response**

### **Request:**
```json
POST /api/orders/preview
{
  "customerId": 1,
  "orderDetails": [
    {
      "productUnitId": 1,
      "quantity": 2
    },
    {
      "productUnitId": 2,
      "quantity": 1
    }
  ],
  "paymentMethod": "COD",
  "shippingAddress": null,
  "notes": null
}
```

### **Response:**
```json
{
  "subtotal": 100000,
  "discountAmount": 10000,
  "shippingFee": 0,
  "totalAmount": 90000,
  "appliedPromotions": [
    {
      "id": 1,
      "name": "Giảm giá 10% cho đơn hàng trên 50k",
      "discountAmount": 10000
    }
  ]
}
```

## 🎯 **Lợi ích**

### **1. UI đơn giản hơn:**
- ✅ Bỏ nút không cần thiết
- ✅ Người dùng click trực tiếp vào sản phẩm
- ✅ Workflow mượt mà hơn

### **2. Tính khuyến mãi tự động:**
- ✅ Không cần chọn khuyến mãi thủ công
- ✅ Backend tự động tính toán
- ✅ Hiển thị chi tiết khuyến mãi đã áp dụng
- ✅ Cập nhật real-time khi giỏ hàng thay đổi

### **3. Trải nghiệm người dùng tốt hơn:**
- ✅ Loading indicator khi tính toán
- ✅ Debounce để tránh gọi API quá nhiều
- ✅ Fallback về tính toán cũ nếu API lỗi
- ✅ Hiển thị rõ ràng khuyến mãi đã áp dụng

## 🔧 **Technical Details**

### **Debounce:**
- 500ms delay để tránh gọi API quá nhiều khi người dùng thay đổi nhanh
- Clear timeout khi component unmount

### **Error Handling:**
- Try-catch cho API calls
- Fallback về tính toán cũ nếu API lỗi
- Console logging để debug

### **State Management:**
- `orderPreview`: Lưu response từ API
- `previewLoading`: Loading state cho UI
- Auto-clear khi giỏ hàng trống

Hệ thống POS giờ đây **tự động tính khuyến mãi** và có **UI đơn giản hơn**! 🎉
