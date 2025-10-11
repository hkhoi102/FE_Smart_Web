# Tích hợp Product Service API cho POS System

## 🎯 **Mục tiêu**
Tích hợp Product Service API để lấy sản phẩm với từng đơn vị tính và giá riêng biệt cho hệ thống POS.

## 📋 **Phân tích API**

### **1. GET /api/products** - Lấy danh sách sản phẩm
```typescript
// Request
GET /api/products?page=0&size=100

// Response Structure
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Táo",
      "description": "Táo tươi",
      "imageUrl": "https://...",
      "code": "TAO001",
      "categoryId": 1,
      "categoryName": "Trái cây",
      "productUnits": [        // ← Đây là key quan trọng!
        {
          "id": 1,
          "unitId": 1,
          "unitName": "kg",
          "conversionRate": 1.0,
          "currentPrice": 50000,
          "quantity": 100,
          "availableQuantity": 95,
          "isDefault": true
        },
        {
          "id": 2,
          "unitId": 2,
          "unitName": "thùng",
          "conversionRate": 24.0,
          "currentPrice": 500000,
          "quantity": 10,
          "availableQuantity": 8,
          "isDefault": false
        }
      ]
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "currentPage": 0,
  "size": 10
}
```

### **2. GET /api/products/by-code/{code}** - Tìm sản phẩm theo barcode
```typescript
// Request
GET /api/products/by-code/1234567890123

// Response
{
  "success": true,
  "data": {
    // Same structure as above
    // productUnits[0] is prioritized unit with this barcode
  }
}
```

## 🔧 **Cập nhật Frontend**

### **1. Cập nhật cấu trúc dữ liệu**
```typescript
// Thay đổi từ product.units → product.productUnits
productsData.forEach((product: any) => {
  // Sử dụng productUnits từ API response
  if (product.productUnits && Array.isArray(product.productUnits)) {
    product.productUnits.forEach((unit: any) => {
      const productUnit = {
        id: unit.id,
        productName: product.name,
        unitName: unit.unitName,        // Từ productUnits
        price: unit.currentPrice,       // Từ productUnits
        stock: unit.availableQuantity   // Từ productUnits
      }
      productUnits.push(productUnit)
    })
  }
})
```

### **2. Tích hợp Barcode Search API**
```typescript
const handleBarcodeScan = async (barcode: string) => {
  try {
    setLoading(true)
    console.log('🔍 Searching for barcode:', barcode)

    // Gọi API tìm sản phẩm theo barcode
    const response = await fetch(`${API_BASE_URL}/products/by-code/${encodeURIComponent(barcode)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()

      if (data.success && data.data) {
        const product = data.data

        // Lấy đơn vị tính ưu tiên (đơn vị có barcode)
        if (product.productUnits && product.productUnits.length > 0) {
          const priorityUnit = product.productUnits[0] // Đã được sắp xếp ưu tiên

          const productUnit = {
            id: priorityUnit.id,
            productName: product.name,
            unitName: priorityUnit.unitName,
            price: priorityUnit.currentPrice || 0,
            stock: priorityUnit.availableQuantity || priorityUnit.quantity || 0
          }

          // Thêm vào giỏ hàng
          const existingItem = orderItems.find(item => item.productUnitId === productUnit.id)
          if (existingItem) {
            // Update existing item
            setOrderItems(prev => prev.map(item =>
              item.productUnitId === productUnit.id
                ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                : item
            ))
          } else {
            // Add new item
            const newItem: OrderItem = {
              productUnitId: productUnit.id,
              productName: productUnit.productName,
              unitName: productUnit.unitName,
              quantity: 1,
              unitPrice: productUnit.price,
              subtotal: productUnit.price
            }
            setOrderItems(prev => [...prev, newItem])
          }

          setBarcodeInput('')
          setSuccess(`Đã thêm ${productUnit.productName} - ${productUnit.unitName}`)
        }
      }
    }
  } catch (error) {
    console.error('Error searching barcode:', error)
    setError('Lỗi khi tìm kiếm sản phẩm')
  } finally {
    setLoading(false)
  }
}
```

### **3. Debug Logging**
```typescript
console.log('🔍 Processing products data...')
console.log('📊 Total products from API:', productsData.length)

productsData.forEach((product: any, index: number) => {
  console.log(`\n📦 Product ${index + 1}:`, {
    id: product.id,
    name: product.name,
    productUnits: product.productUnits,
    categoryId: product.categoryId,
    categoryName: product.categoryName
  })

  if (product.productUnits && Array.isArray(product.productUnits)) {
    console.log(`🔧 Product ${index + 1} has ${product.productUnits.length} units`)

    product.productUnits.forEach((unit: any, unitIndex: number) => {
      console.log(`⚙️ Unit ${unitIndex + 1}:`, {
        id: unit.id,
        unitName: unit.unitName,
        currentPrice: unit.currentPrice,
        availableQuantity: unit.availableQuantity,
        quantity: unit.quantity
      })
    })
  }
})
```

## 📊 **Kết quả**

### **Trước khi sửa:**
```typescript
// ❌ Sai: Tìm kiếm field không tồn tại
product.units.forEach((unit) => {
  // product.units không tồn tại trong API response
})
```

### **Sau khi sửa:**
```typescript
// ✅ Đúng: Sử dụng productUnits từ API response
product.productUnits.forEach((unit) => {
  const productUnit = {
    id: unit.id,
    productName: product.name,
    unitName: unit.unitName,        // ✅ Có sẵn
    price: unit.currentPrice,       // ✅ Có sẵn
    stock: unit.availableQuantity   // ✅ Có sẵn
  }
})
```

## 🎯 **Lợi ích**

1. **Đúng cấu trúc API**: Sử dụng `productUnits` thay vì `units`
2. **Giá cả chính xác**: `currentPrice` từ PriceList
3. **Tồn kho chính xác**: `availableQuantity` từ Inventory
4. **Barcode tích hợp**: API `/by-code/{code}` ưu tiên đơn vị có barcode
5. **Debug rõ ràng**: Console log chi tiết để theo dõi

## 🔍 **API Endpoints sử dụng**

| Endpoint | Method | Mục đích |
|----------|--------|----------|
| `/api/products?page=0&size=100` | GET | Lấy tất cả sản phẩm |
| `/api/products/by-code/{code}` | GET | Tìm sản phẩm theo barcode |
| `/api/products/{productId}/units` | GET | Lấy đơn vị tính của sản phẩm |

## 📝 **Lưu ý quan trọng**

1. **productUnits vs units**: Backend trả về `productUnits`, không phải `units`
2. **currentPrice**: Giá hiện tại đã tính từ PriceList
3. **availableQuantity**: Số lượng có thể bán (không bao gồm đang chờ xử lý)
4. **quantity**: Tổng tồn kho
5. **Barcode Priority**: API `/by-code/{code}` đã sắp xếp `productUnits[0]` là đơn vị có barcode

Hệ thống POS giờ đây **lấy đúng cấu trúc dữ liệu từ Product Service API**! 🎉
