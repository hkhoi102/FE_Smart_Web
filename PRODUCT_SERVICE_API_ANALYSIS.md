# Phân tích Product Service API

## 🏗️ **Cấu trúc API Product Service**

### **1. Product Controller (`/api/products`)**

#### **GET /api/products** - Lấy danh sách sản phẩm
```typescript
// Request
GET /api/products?page=0&size=10&name=search&categoryId=1

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Táo",
      "description": "Táo tươi",
      "imageUrl": "https://...",
      "code": "TAO001",
      "expirationDate": "2025-12-31",
      "categoryId": 1,
      "categoryName": "Trái cây",
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00",
      "active": true,
      "defaultUnitId": 1,
      "productUnits": [
        {
          "id": 1,
          "unitId": 1,
          "unitName": "kg",
          "unitDescription": "Kilogram",
          "conversionRate": 1.0,
          "currentPrice": 50000,
          "priceValidFrom": "2024-01-01T00:00:00",
          "priceValidTo": "2024-12-31T23:59:59",
          "isDefault": true,
          "convertedPrice": 50000,
          "quantity": 100,
          "availableQuantity": 95
        },
        {
          "id": 2,
          "unitId": 2,
          "unitName": "thùng",
          "unitDescription": "Thùng",
          "conversionRate": 24.0,
          "currentPrice": 500000,
          "priceValidFrom": "2024-01-01T00:00:00",
          "priceValidTo": "2024-12-31T23:59:59",
          "isDefault": false,
          "convertedPrice": 20833.33,
          "quantity": 10,
          "availableQuantity": 8
        }
      ],
      "barcodeList": [
        {
          "id": 1,
          "productUnitId": 1,
          "code": "1234567890123",
          "type": "EAN13",
          "createdAt": "2024-01-01T00:00:00"
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

#### **GET /api/products/{id}** - Lấy sản phẩm theo ID
```typescript
// Request
GET /api/products/1

// Response
{
  "success": true,
  "data": {
    // Same structure as above but single product
  }
}
```

#### **GET /api/products/by-code/{code}** - Tìm sản phẩm theo barcode
```typescript
// Request
GET /api/products/by-code/1234567890123

// Response
{
  "success": true,
  "data": {
    // Product with matching barcode unit prioritized
  }
}
```

### **2. ProductUnit Controller (`/api/products/{productId}/units`)**

#### **GET /api/products/{productId}/units** - Lấy đơn vị tính của sản phẩm
```typescript
// Request
GET /api/products/1/units

// Response
{
  "success": true,
  "message": "Product units retrieved successfully",
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Táo",
      "unitId": 1,
      "unitName": "kg",
      "unitDescription": "Kilogram",
      "conversionRate": 1,
      "isDefault": true,
      "active": true
    },
    {
      "id": 2,
      "productId": 1,
      "productName": "Táo",
      "unitId": 2,
      "unitName": "thùng",
      "unitDescription": "Thùng",
      "conversionRate": 24,
      "isDefault": false,
      "active": true
    }
  ]
}
```

### **3. ProductUnit Public Controller (`/api/products/units`)**

#### **GET /api/products/units/{id}** - Lấy ProductUnit theo ID
```typescript
// Request
GET /api/products/units/1

// Response
{
  "id": 1,
  "productId": 1,
  "productName": "Táo",
  "unitId": 1,
  "unitName": "kg",
  "unitDescription": "Kilogram",
  "conversionRate": 1,
  "isDefault": true,
  "active": true
}
```

#### **GET /api/products/units/list?productId=1** - Lấy tất cả đơn vị của sản phẩm
```typescript
// Request
GET /api/products/units/list?productId=1

// Response
[
  {
    "id": 1,
    "productId": 1,
    "productName": "Táo",
    "unitId": 1,
    "unitName": "kg",
    "unitDescription": "Kilogram",
    "conversionRate": 1,
    "isDefault": true,
    "active": true
  },
  {
    "id": 2,
    "productId": 1,
    "productName": "Táo",
    "unitId": 2,
    "unitName": "thùng",
    "unitDescription": "Thùng",
    "conversionRate": 24,
    "isDefault": false,
    "active": true
  }
]
```

## 🔍 **Cấu trúc Dữ liệu**

### **ProductDto**
```typescript
interface ProductDto {
  id: number
  name: string
  description: string
  imageUrl: string
  code: string
  expirationDate: string
  categoryId: number
  categoryName: string
  createdAt: string
  updatedAt: string
  active: boolean
  defaultUnitId: number
  productUnits: ProductUnitInfo[]
  barcodeList: BarcodeDto[]
}
```

### **ProductUnitInfo** (trong ProductDto.productUnits)
```typescript
interface ProductUnitInfo {
  id: number
  unitId: number
  unitName: string
  unitDescription: string
  conversionRate: number
  currentPrice: number
  priceValidFrom: string
  priceValidTo: string
  isDefault: boolean
  convertedPrice: number
  quantity: number
  availableQuantity: number
}
```

### **ProductUnitDto** (từ ProductUnit Controller)
```typescript
interface ProductUnitDto {
  id: number
  productId: number
  productName: string
  unitId: number
  unitName: string
  unitDescription: string
  conversionRate: number
  isDefault: boolean
  active: boolean
}
```

## 🎯 **Cách sử dụng cho POS System**

### **1. Lấy tất cả sản phẩm với đơn vị tính**
```typescript
// Sử dụng GET /api/products
const response = await fetch('/api/products?page=0&size=100')
const data = await response.json()

// Xử lý dữ liệu
const products = data.data.map(product => {
  return product.productUnits.map(unit => ({
    id: unit.id,
    productName: product.name,
    unitName: unit.unitName,
    price: unit.currentPrice,
    stock: unit.availableQuantity
  }))
}).flat()
```

### **2. Tìm sản phẩm theo barcode**
```typescript
// Sử dụng GET /api/products/by-code/{code}
const response = await fetch(`/api/products/by-code/${barcode}`)
const data = await response.json()

// Lấy đơn vị tính ưu tiên (đơn vị có barcode)
const product = data.data
const priorityUnit = product.productUnits[0] // Đã được sắp xếp ưu tiên
```

### **3. Lấy đơn vị tính của sản phẩm cụ thể**
```typescript
// Sử dụng GET /api/products/{productId}/units
const response = await fetch(`/api/products/${productId}/units`)
const data = await response.json()

// Xử lý dữ liệu
const units = data.data.map(unit => ({
  id: unit.id,
  productName: unit.productName,
  unitName: unit.unitName,
  price: 0, // Cần lấy từ PriceList
  stock: 0  // Cần lấy từ Inventory
}))
```

## 🔧 **Cập nhật Frontend Service**

### **ProductService.ts**
```typescript
export class ProductService {
  static async getProducts(page: number = 0, size: number = 100) {
    const response = await fetch(`${API_BASE_URL}/products?page=${page}&size=${size}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message)
    }

    return {
      products: data.data,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      size: data.size
    }
  }

  static async getProductByBarcode(barcode: string) {
    const response = await fetch(`${API_BASE_URL}/products/by-code/${barcode}`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message)
    }

    return data.data
  }

  static async getProductUnits(productId: number) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/units`)
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message)
    }

    return data.data
  }
}
```

## 📊 **Kết luận**

1. **API chính**: Sử dụng `GET /api/products` để lấy tất cả sản phẩm với đơn vị tính
2. **Cấu trúc dữ liệu**: `ProductDto.productUnits` chứa tất cả thông tin cần thiết
3. **Tìm kiếm barcode**: Sử dụng `GET /api/products/by-code/{code}`
4. **Xử lý dữ liệu**: Chuyển đổi `ProductUnitInfo` thành format phù hợp cho POS
5. **Tồn kho và giá**: Đã có sẵn trong `ProductUnitInfo`

Hệ thống POS có thể sử dụng trực tiếp API này để lấy đầy đủ thông tin sản phẩm với từng đơn vị tính, giá cả và tồn kho!
