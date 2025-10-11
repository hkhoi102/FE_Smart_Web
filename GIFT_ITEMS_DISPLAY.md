# Gift Items Display - Hiển thị sản phẩm được tặng kèm

## 🎯 **Mục tiêu**
Hiển thị sản phẩm được tặng kèm từ API preview để người dùng biết được khuyến mãi "Mua A tặng B".

## 🎁 **API Response Structure**
```json
{
  "success": true,
  "data": {
    "totalOriginalAmount": 50000,
    "totalDiscountAmount": 10000,
    "totalFinalAmount": 40000,
    "appliedPromotions": ["Khuyến mãi Tháng 10"],
    "giftItems": [
      {
        "productUnitId": 3,
        "productName": "7 Up",
        "unitName": "Lon",
        "quantity": 1,
        "unitPrice": 0,
        "subtotal": 0,
        "promotionName": "Khuyến mãi Tháng 10"
      }
    ]
  }
}
```

## 🎨 **UI Implementation**

### **1. Order Summary Section (Tóm tắt đơn hàng)**
```tsx
{orderPreview.data?.giftItems && orderPreview.data.giftItems.length > 0 && (
  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
    <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center">
      <span className="mr-2">🎁</span>
      Sản phẩm được tặng kèm
    </h4>
    <div className="space-y-2">
      {orderPreview.data.giftItems.map((gift: any, index: number) => (
        <div key={index} className="flex items-center justify-between bg-white rounded-md p-2 border border-purple-100">
          <div className="flex-1">
            <div className="text-sm font-medium text-purple-900">
              {gift.productName} ({gift.unitName})
            </div>
            <div className="text-xs text-purple-600">
              Số lượng: {gift.quantity} • {gift.promotionName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-purple-800">
              {formatCurrency(gift.subtotal)}
            </div>
            <div className="text-xs text-green-600">
              Miễn phí
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-2 text-xs text-purple-600">
      💡 Sản phẩm tặng kèm sẽ được thêm vào đơn hàng tự động
    </div>
  </div>
)}
```

### **2. Product List Section (Danh sách sản phẩm)**
```tsx
{orderPreview?.data?.giftItems && orderPreview.data.giftItems.length > 0 && (
  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
      <span className="mr-2">🎁</span>
      Sản phẩm được tặng kèm
    </h3>
    <div className="space-y-2">
      {orderPreview.data.giftItems.map((gift: any, index: number) => (
        <div key={index} className="flex items-center justify-between bg-white rounded-md p-3 border border-purple-100">
          <div className="flex-1">
            <div className="text-sm font-medium text-purple-900">
              {gift.productName} ({gift.unitName})
            </div>
            <div className="text-xs text-purple-600">
              Số lượng: {gift.quantity} • {gift.promotionName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-purple-800">
              {formatCurrency(gift.subtotal)}
            </div>
            <div className="text-xs text-green-600 font-medium">
              Miễn phí
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 text-sm text-purple-700 bg-purple-100 rounded-md p-2">
      💡 Sản phẩm tặng kèm sẽ được thêm vào đơn hàng tự động khi thanh toán
    </div>
  </div>
)}
```

### **3. Fallback Display (Khi không có API preview)**
```tsx
{selectedPromotion && (
  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
    <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
      <span className="mr-2">🎁</span>
      Khuyến mãi: {selectedPromotion.name}
    </h4>
    <div className="text-xs text-purple-600">
      💡 Chi tiết sản phẩm tặng kèm sẽ được hiển thị sau khi tính toán
    </div>
  </div>
)}
```

## 🎨 **Design Features**

### **1. Color Scheme**
- **Purple theme**: `bg-purple-50`, `border-purple-200`, `text-purple-800`
- **Gift icon**: 🎁 emoji để dễ nhận biết
- **Free indicator**: "Miễn phí" với màu xanh lá

### **2. Layout Structure**
- **Card-based**: Mỗi gift item là một card riêng
- **Two-column layout**: Tên sản phẩm bên trái, giá bên phải
- **Information hierarchy**: Tên sản phẩm → Số lượng + Tên khuyến mãi

### **3. Visual Indicators**
- **Gift icon**: 🎁 để nhận biết sản phẩm tặng
- **Free badge**: "Miễn phí" với màu xanh lá
- **Promotion name**: Hiển thị tên khuyến mãi áp dụng
- **Info tooltip**: Giải thích sản phẩm sẽ được thêm tự động

## 📊 **Data Mapping**

### **Gift Item Properties**
```typescript
interface GiftItem {
  productUnitId: number;      // ID sản phẩm được tặng
  productName: string;        // Tên sản phẩm
  unitName: string;           // Đơn vị (Lon, Thùng...)
  quantity: number;           // Số lượng được tặng
  unitPrice: number;          // Giá = 0 (vì là quà tặng)
  subtotal: number;           // Thành tiền = 0
  promotionName: string;      // Tên khuyến mãi áp dụng
}
```

### **Display Logic**
- **Conditional rendering**: Chỉ hiển thị khi có `giftItems` và `length > 0`
- **Fallback handling**: Hiển thị thông báo khi chưa có API preview
- **Price formatting**: Sử dụng `formatCurrency()` cho consistency

## 🎯 **User Experience**

### **1. Clear Information**
- ✅ **Product details**: Tên sản phẩm và đơn vị rõ ràng
- ✅ **Quantity**: Số lượng được tặng
- ✅ **Promotion source**: Tên khuyến mãi áp dụng
- ✅ **Price indication**: "Miễn phí" thay vì 0₫

### **2. Visual Hierarchy**
- ✅ **Purple theme**: Dễ phân biệt với sản phẩm thường
- ✅ **Gift icon**: Nhận biết ngay là sản phẩm tặng
- ✅ **Card layout**: Dễ đọc và scan thông tin

### **3. Context Awareness**
- ✅ **Auto addition notice**: Thông báo sẽ được thêm tự động
- ✅ **Promotion context**: Liên kết với khuyến mãi cụ thể
- ✅ **Fallback state**: Xử lý khi chưa có dữ liệu

## 🚀 **Integration Points**

### **1. API Preview Integration**
- **Trigger**: Khi `orderItems` thay đổi
- **Data source**: `orderPreview.data.giftItems`
- **Update frequency**: Real-time khi thay đổi giỏ hàng

### **2. Order Creation**
- **Backend handling**: Gift items được xử lý tự động
- **Frontend display**: Chỉ hiển thị thông tin, không cần thêm vào `orderItems`

### **3. POS Mode**
- **Same display**: Gift items hiển thị giống nhau cho cả POS và regular mode
- **Auto calculation**: Backend tự động tính toán và trả về

## ✅ **Kết quả**

Hệ thống giờ đây hiển thị **sản phẩm được tặng kèm** một cách rõ ràng:
- ✅ **Visual clarity**: Dễ nhận biết sản phẩm tặng kèm
- ✅ **Complete information**: Đầy đủ thông tin sản phẩm và khuyến mãi
- ✅ **User awareness**: Người dùng biết được lợi ích khuyến mãi
- ✅ **Professional UX**: Giao diện chuyên nghiệp và dễ hiểu

Khuyến mãi "Mua A tặng B" giờ đây được hiển thị rõ ràng! 🎁
