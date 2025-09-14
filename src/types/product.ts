export interface Product {
  id: number
  name: string
  description: string
  active: number
  created_at: string
  updated_at: string
  expiration_date?: string | null
  image_url?: string | null
  category_id: number
  unit: string // Đơn vị tính
  prices: ProductPrice[] // Bảng giá theo đơn vị tính
}

export interface ProductPrice {
  id: number
  product_id: number
  unit: string
  price: number
  is_default: boolean
}

export interface ProductCategory {
  id: number
  name: string
  description: string
}

export interface PaginationInfo {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
}

export interface ProductResponse {
  products: Product[]
  pagination: PaginationInfo
}
