import { Product, ProductCategory } from '@/types/product'

export const categories: ProductCategory[] = [
  { id: 1, name: 'Đồ uống', description: 'Các loại đồ uống giải khát' },
  { id: 2, name: 'Đồ ăn vặt', description: 'Các loại snack, bánh kẹo' },
  { id: 3, name: 'Sữa và sản phẩm từ sữa', description: 'Sữa tươi, sữa chua, phô mai' },
  { id: 4, name: 'Hàng gia dụng', description: 'Các sản phẩm gia dụng' },
  { id: 5, name: 'Do Uong', description: 'Các loại đồ uống giải khát' },
  { id: 6, name: 'Banh', description: 'Các loại đồ Banh Ngọt' },
]

const productNames = [
  // Đồ uống
  'Coca Cola', 'Pepsi', 'Sprite', 'Fanta', '7Up', 'Red Bull', 'Monster Energy',
  'Nước suối Aquafina', 'Nước suối Lavie', 'Nước cam tươi', 'Nước dừa tươi',
  'Trà xanh không độ', 'Trà sữa', 'Cà phê sữa', 'Cà phê đen',
  
  // Đồ ăn vặt
  'Bánh quy Oreo', 'Kẹo dẻo Haribo', 'Snack khoai tây', 'Bánh tráng nướng',
  'Kẹo mút Chupa Chups', 'Bánh gạo', 'Hạt điều rang muối', 'Hạt dẻ cười',
  'Bánh mì sandwich', 'Bánh ngọt', 'Kẹo chocolate', 'Bánh quy bơ',
  
  // Sữa và sản phẩm từ sữa
  'Sữa tươi Vinamilk', 'Sữa chua Probi', 'Phô mai Con Bò Cười', 'Sữa đặc Ông Thọ',
  'Sữa bột Dielac', 'Yogurt TH True Milk', 'Kem tươi', 'Bơ thực vật',
  'Sữa đậu nành', 'Sữa hạt điều', 'Phô mai Mozzarella', 'Sữa chua Hy Lạp',
  
  // Hàng gia dụng
  'Bột giặt Omo', 'Nước rửa chén Sunlight', 'Khăn giấy Kleenex', 'Bàn chải đánh răng',
  'Kem đánh răng Colgate', 'Dầu gội đầu Clear', 'Sữa tắm Dove', 'Nước lau sàn',
  'Bông tắm', 'Khăn tắm', 'Xà phòng Lifebuoy', 'Nước hoa',
  
  // Bánh
  'Bánh mì baguette', 'Bánh bông lan', 'Bánh kem sinh nhật', 'Bánh quy bơ',
  'Bánh croissant', 'Bánh donut', 'Bánh pizza', 'Bánh mì sandwich',
  'Bánh quy Oreo', 'Bánh ngọt', 'Bánh tráng nướng', 'Bánh gạo'
]

const units = ['Cái', 'Chai', 'Lon', 'Gói', 'Hộp', 'Túi', 'Kg', 'Lít', 'Thùng', 'Cặp']
const descriptions = [
  'Sản phẩm chất lượng cao', 'Tươi ngon, bổ dưỡng', 'Được ưa chuộng nhất',
  'Thương hiệu uy tín', 'Giá cả hợp lý', 'An toàn cho sức khỏe',
  'Đóng gói tiện lợi', 'Hương vị thơm ngon', 'Nguồn gốc rõ ràng',
  'Chất lượng đảm bảo'
]

export const generateMockProducts = (): Product[] => {
  const products: Product[] = []
  
  for (let i = 1; i <= 100; i++) {
    const categoryId = Math.floor(Math.random() * 6) + 1
    const category = categories.find(c => c.id === categoryId)!
    const productName = productNames[Math.floor(Math.random() * productNames.length)]
    const unit = units[Math.floor(Math.random() * units.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    // Tạo bảng giá với 2-4 đơn vị tính khác nhau
    const priceUnits = [unit]
    const additionalUnits = units.filter(u => u !== unit).slice(0, Math.floor(Math.random() * 3) + 1)
    priceUnits.push(...additionalUnits)
    
    const prices = priceUnits.map((priceUnit, index) => ({
      id: i * 10 + index,
      product_id: i,
      unit: priceUnit,
      price: Math.floor(Math.random() * 50000) + 10000, // 10,000 - 60,000 VND
      is_default: index === 0
    }))
    
    const createdDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const updatedDate = new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000)
    
    products.push({
      id: i,
      name: `${productName} ${i}`,
      description: `${description} - ${productName}`,
      active: 1,
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
      expiration_date: Math.random() > 0.3 ? new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : null,
      image_url: Math.random() > 0.2 ? `https://picsum.photos/200/200?random=${i}` : null,
      category_id: categoryId,
      unit: unit,
      prices: prices
    })
  }
  
  return products
}

export const mockProducts = generateMockProducts()
