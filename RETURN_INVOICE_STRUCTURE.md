# Cấu trúc Hóa đơn Trả hàng

## Tổng quan
Modal hóa đơn trả hàng hiển thị thông tin đầy đủ về đơn hàng gốc, sản phẩm trả, và so sánh trước/sau trả hàng. Tất cả dữ liệu được lấy từ database thông qua API.

## Cấu trúc dữ liệu

### 1. Thông tin đơn hàng gốc
```javascript
{
  orderCode: "ORD-20251022-00001",
  customerName: "Tên khách hàng",
  createdAt: "2025-10-22T14:01:22.630827Z",
  originalTotal: 784000,        // Tổng tiền gốc
  originalDiscount: 196000      // Giảm giá gốc
}
```

### 2. Danh sách sản phẩm gốc (từ bảng `order_details`)
```javascript
originalOrderDetails: [
  {
    id: 1,
    productUnitId: 23,
    quantity: 8,
    unitPrice: 100000,
    subtotal: 800000,
    productName: "Tên sản phẩm",
    unitName: "Đơn vị"
  }
]
```

### 3. Danh sách sản phẩm trả (từ bảng `return_details`)
```javascript
returnDetails: [
  {
    id: 1,
    orderDetailId: 1,
    quantity: 1,
    refundAmount: 100000,
    productName: "Tên sản phẩm",
    unitName: "Đơn vị"
  }
]
```

### 4. Dữ liệu sau trả hàng (từ bảng `orders` đã cập nhật)
```javascript
{
  finalTotal: 513000,        // Tổng tiền sau trả
  finalDiscount: 171000      // Giảm giá sau trả
}
```

### 5. Thông tin đơn trả hàng
```javascript
returnOrder: {
  id: 1,
  reason: "Sản phẩm bị lỗi",
  status: "COMPLETED",
  createdAt: "2025-10-22T14:06:19.537896Z"
}
```

## Cấu trúc hiển thị trong Modal

### 1. Header
- Tiêu đề: "HÓA ĐƠN BÁN HÀNG"
- Mã đơn hàng, khách hàng, ngày tạo, ngày trả

### 2. Thông tin đơn hàng gốc
- Tổng tiền gốc, giảm giá gốc, thành tiền gốc

### 3. Danh sách sản phẩm gốc
- Bảng hiển thị tất cả sản phẩm trong đơn hàng gốc
- Cột: STT, Sản phẩm, Đơn vị, Đơn giá, Số lượng, Thành tiền

### 4. Danh sách sản phẩm trả
- Bảng hiển thị các sản phẩm được trả
- Cột: STT, Sản phẩm, Đơn vị, Số lượng trả, Tiền trả

### 5. So sánh trước/sau trả hàng
- **TRƯỚC khi trả hàng**: Tổng tiền, giảm giá, thành tiền
- **SAU khi trả hàng**: Tổng tiền, giảm giá, thành tiền

### 6. Tóm tắt trả hàng
- Tổng tiền trả (nổi bật)
- Lý do trả hàng

### 7. Tóm tắt cuối cùng
- Tổng tiền gốc
- Tiền trả
- Tổng tiền cuối

## API Endpoints sử dụng

### 1. Lấy thông tin đơn hàng gốc
```javascript
const orderResponse = await OrderApi.getById(orderId)
const orderData = orderResponse.data
```

### 2. Lấy thông tin đơn hàng sau khi cập nhật
```javascript
const updatedOrderResponse = await OrderApi.getById(orderId)
const updatedOrderData = updatedOrderResponse.data
```

### 3. Lấy thông tin đơn trả hàng
```javascript
const returnOrderData = await OrderApi.getReturnById(returnOrderId)
```

## Cấu trúc Database

### Bảng `orders`
- `total_amount`: Tổng tiền (được cập nhật sau trả hàng)
- `discount_amount`: Giảm giá (được cập nhật sau trả hàng)
- `status`: Trạng thái đơn hàng

### Bảng `order_details`
- `product_unit_id`: ID sản phẩm
- `quantity`: Số lượng
- `unit_price`: Đơn giá
- `subtotal`: Thành tiền

### Bảng `return_orders`
- `order_id`: Liên kết với đơn hàng gốc
- `reason`: Lý do trả hàng
- `status`: Trạng thái đơn trả hàng
- `refund_amount`: Tổng tiền trả

### Bảng `return_details`
- `order_detail_id`: Liên kết với chi tiết đơn hàng gốc
- `quantity`: Số lượng trả
- `refund_amount`: Tiền trả cho từng sản phẩm

## Luồng hoạt động

1. **Trả hàng thành công** → Backend cập nhật `orders` table
2. **Frontend gọi API** lấy dữ liệu đã cập nhật
3. **Hiển thị modal** với cấu trúc đầy đủ:
   - Thông tin đơn hàng gốc
   - Danh sách sản phẩm gốc
   - Danh sách sản phẩm trả
   - So sánh trước/sau trả hàng
   - Tóm tắt cuối cùng

## Lợi ích

- ✅ **Dữ liệu chính xác**: Lấy trực tiếp từ database
- ✅ **Hiển thị đầy đủ**: Tất cả thông tin cần thiết
- ✅ **So sánh rõ ràng**: Trước/sau trả hàng
- ✅ **Dễ hiểu**: Cấu trúc logic và trực quan
- ✅ **Có thể in**: Hỗ trợ chức năng in hóa đơn
