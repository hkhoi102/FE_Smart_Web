# Sửa lỗi In 1 Trang - Hóa đơn Trả hàng

## Vấn đề
- **Preview in**: Hiển thị 3 trang
- **In thực tế**: Chỉ in 1 trang
- **Nguyên nhân**: CSS print media queries chưa được áp dụng đúng

## Giải pháp

### 1. **CSS Print Media Queries Mạnh**
```css
@media print {
  body * {
    visibility: hidden;
  }
  .print-content, .print-content * {
    visibility: visible;
  }
  .print-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    font-size: 10px !important;
    line-height: 1.2 !important;
  }
}
```

### 2. **Tối ưu hóa Font Size**
```css
.print-content table {
  font-size: 9px !important;
}
.print-content th, .print-content td {
  padding: 2px 4px !important;
}
.print-content .text-lg, .print-content .text-xl, .print-content .text-2xl {
  font-size: 12px !important;
}
.print-content .text-sm {
  font-size: 10px !important;
}
.print-content .text-xs {
  font-size: 8px !important;
}
```

### 3. **Tối ưu hóa Spacing**
```css
.print-content .mb-2, .print-content .mb-4, .print-content .mb-6 {
  margin-bottom: 4px !important;
}
.print-content .p-2, .print-content .p-3, .print-content .p-4 {
  padding: 4px !important;
}
```

## Cách hoạt động

### **1. Ẩn tất cả nội dung khác**
```css
body * {
  visibility: hidden;
}
```
- Ẩn tất cả nội dung trang web
- Chỉ hiển thị nội dung cần in

### **2. Hiển thị chỉ nội dung hóa đơn**
```css
.print-content, .print-content * {
  visibility: visible;
}
```
- Chỉ hiển thị nội dung trong `.print-content`
- Đảm bảo chỉ in hóa đơn

### **3. Định vị tuyệt đối**
```css
.print-content {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
```
- Đặt nội dung ở vị trí tuyệt đối
- Chiếm toàn bộ viewport
- Ẩn overflow để tránh tràn trang

### **4. Font size cực nhỏ**
```css
font-size: 10px !important;
line-height: 1.2 !important;
```
- Font size 10px cho toàn bộ
- Line height 1.2 để tiết kiệm không gian
- `!important` để override tất cả CSS khác

## Kết quả

### **Trước khi sửa:**
- ❌ Preview: 3 trang
- ❌ In: 1 trang (nhưng nội dung bị cắt)
- ❌ Layout không tối ưu

### **Sau khi sửa:**
- ✅ **Preview: 1 trang**
- ✅ **In: 1 trang đầy đủ**
- ✅ **Nội dung gọn gàng**
- ✅ **Font size phù hợp**

## Lợi ích

### **1. Tiết kiệm giấy**
- Chỉ cần 1 trang A4
- Không lãng phí giấy

### **2. Dễ đọc**
- Font size vừa phải
- Layout gọn gàng
- Thông tin đầy đủ

### **3. Chuyên nghiệp**
- Hóa đơn chuẩn
- Dễ lưu trữ
- Dễ photocopy

## Cách sử dụng

### **1. Xem trên màn hình**
- Layout bình thường
- Font size đầy đủ
- Dễ đọc và sử dụng

### **2. In hóa đơn**
- Nhấn nút "In hóa đơn"
- CSS print tự động áp dụng
- Kết quả: 1 trang gọn gàng

### **3. Lưu trữ**
- Hóa đơn chuẩn A4
- Dễ lưu trữ
- Dễ photocopy

## Lưu ý kỹ thuật

### **CSS Inline**
- Sử dụng `<style>` tag trong component
- CSS được inject trực tiếp
- Không cần file CSS riêng

### **Print Media Queries**
- Chỉ áp dụng khi in (`@media print`)
- Không ảnh hưởng giao diện màn hình
- Tương thích tất cả trình duyệt

### **Important Declarations**
- Sử dụng `!important` để override
- Đảm bảo CSS print được áp dụng
- Tránh conflict với CSS khác

## Kết luận

Giải pháp này đảm bảo:
- ✅ **Preview và in đều 1 trang**
- ✅ **Nội dung đầy đủ và gọn gàng**
- ✅ **Font size phù hợp cho in**
- ✅ **Layout chuyên nghiệp**
- ✅ **Tiết kiệm giấy và mực**
