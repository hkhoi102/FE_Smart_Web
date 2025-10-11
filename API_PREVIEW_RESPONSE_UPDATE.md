# Cập nhật API Preview Response Structure

## 🎯 **Vấn đề**
API `order/preview` đã hoạt động và trả về response với cấu trúc khác so với code hiện tại.

## 📋 **API Response Structure**

### **Request Body (theo API documentation):**
```json
{
  "orderDetails": [
    {
      "productUnitId": 1,
      "quantity": 2
    },
    {
      "productUnitId": 2,
      "quantity": 1
    }
  ]
}
```

### **Response Structure:**
```json
{
  "success": true,
  "message": "Preview calculated successfully",
  "data": {
    "totalOriginalAmount": 500000,
    "totalDiscountAmount": 50000,
    "totalFinalAmount": 450000,
    "appliedPromotions": [
      "Khuyến mãi mùa hè 10%",
      "Giảm giá sản phẩm A"
    ]
  }
}
```

## 🔧 **Các thay đổi đã thực hiện**

### **1. Cập nhật Request Body**
```typescript
// Trước (sai):
const previewRequest = {
  customerId: selectedCustomer?.id || null,
  orderDetails: orderDetails,
  paymentMethod: paymentMethod,
  shippingAddress: shippingAddress || null,
  notes: orderNotes || null
}

// Sau (đúng):
const previewRequest = {
  orderDetails: orderDetails
}
```

### **2. Cập nhật Response Mapping**
```typescript
// Trước (sai):
orderPreview.subtotal
orderPreview.discountAmount
orderPreview.totalAmount
orderPreview.appliedPromotions[].name
orderPreview.appliedPromotions[].discountAmount

// Sau (đúng):
orderPreview.data?.totalOriginalAmount
orderPreview.data?.totalDiscountAmount
orderPreview.data?.totalFinalAmount
orderPreview.data?.appliedPromotions[] // Array of strings
```

### **3. Cập nhật UI Display**
```tsx
{orderPreview ? (
  <div className="space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">Tạm tính:</span>
      <span className="font-medium">
        {formatCurrency(orderPreview.data?.totalOriginalAmount || subtotal)}
      </span>
    </div>

    {orderPreview.data?.totalDiscountAmount && orderPreview.data.totalDiscountAmount > 0 && (
      <div className="flex justify-between text-sm text-green-600">
        <span>Khuyến mãi:</span>
        <span>-{formatCurrency(orderPreview.data.totalDiscountAmount)}</span>
      </div>
    )}

    <div className="flex justify-between text-sm text-blue-600">
      <span>Phí vận chuyển:</span>
      <span>Miễn phí</span>
    </div>

    <div className="border-t pt-3">
      <div className="flex justify-between text-lg font-semibold">
        <span>Thành tiền:</span>
        <span className="text-blue-600">
          {formatCurrency(orderPreview.data?.totalFinalAmount || total)}
        </span>
      </div>
    </div>

    {orderPreview.data?.appliedPromotions && orderPreview.data.appliedPromotions.length > 0 && (
      <div className="mt-3 p-3 bg-green-50 rounded-lg">
        <h4 className="text-sm font-medium text-green-800 mb-2">Khuyến mãi đã áp dụng:</h4>
        {orderPreview.data.appliedPromotions.map((promo: string, index: number) => (
          <div key={index} className="text-sm text-green-700">
            • {promo}
          </div>
        ))}
      </div>
    )}
  </div>
) : // Fallback...
```

### **4. Tối ưu useEffect Dependencies**
```typescript
// Trước (không cần thiết):
useEffect(() => {
  // ...
}, [orderItems, selectedCustomer, paymentMethod, shippingAddress, orderNotes])

// Sau (tối ưu):
useEffect(() => {
  // ...
}, [orderItems])
```

**Lý do:** API preview chỉ cần `orderDetails` (productUnitId + quantity), không cần thông tin khách hàng hay phương thức thanh toán.

## 📊 **Kết quả**

### **Trước khi sửa:**
- ❌ Request body có thông tin không cần thiết
- ❌ Mapping response sai cấu trúc
- ❌ UI hiển thị undefined values
- ❌ useEffect trigger không cần thiết

### **Sau khi sửa:**
- ✅ Request body đúng theo API spec
- ✅ Mapping response đúng cấu trúc
- ✅ UI hiển thị đúng giá trị
- ✅ useEffect tối ưu hơn

## 🎯 **Tính năng hoạt động**

### **1. Tự động tính khuyến mãi:**
- Khi thêm/sửa/xóa sản phẩm → API preview được gọi
- Backend tự động tính và áp dụng khuyến mãi phù hợp
- UI hiển thị giá gốc, khuyến mãi, và tổng tiền cuối

### **2. Hiển thị khuyến mãi chi tiết:**
- Danh sách tên khuyến mãi đã áp dụng
- Số tiền được giảm
- UI đẹp với background xanh lá

### **3. Fallback mechanism:**
- Nếu API lỗi → Hiển thị tính toán cũ
- Nếu không có khuyến mãi → Hiển thị giá gốc
- Loading state khi đang tính toán

## 🔍 **Debug Information**

Console sẽ hiển thị:
```
🔄 Calling order/preview API...
📋 Preview request: { orderDetails: [...] }
✅ Order preview response: { success: true, data: {...} }
```

## ✅ **Kết luận**

API `order/preview` giờ đây hoạt động hoàn hảo với:
- ✅ **Request đúng format** theo API documentation
- ✅ **Response mapping chính xác**
- ✅ **UI hiển thị đầy đủ** thông tin khuyến mãi
- ✅ **Performance tối ưu** với debounce và dependencies đúng

Hệ thống POS có thể **tự động tính khuyến mãi** và **hiển thị chi tiết** cho người dùng! 🎉
