import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { ProductService, Product } from '../services/productService'

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'additional'>('description')
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getImageUrl = (productName: string) => {
    const imageMap: { [key: string]: string } = {
      'Coca Cola 330ml': '/images/beverages.png',
      'Pepsi 330ml': '/images/beverages.png',
      'Bánh mì sandwich': '/images/Bread_Bakery.png',
      'Sữa tươi Vinamilk': '/images/Beauty_Health.png',
      'Kẹo dẻo Haribo': '/images/snacks.png',
      'Nước suối Aquafina': '/images/beverages.png',
      'Bánh quy Oreo': '/images/snacks.png',
      'Sữa chua Vinamilk': '/images/Beauty_Health.png',
      'Bánh mì tươi': '/images/Bread_Bakery.png',
      'Nước cam tươi': '/images/beverages.png',
      'Kẹo mút Chupa Chups': '/images/snacks.png',
      'Sữa đặc Ông Thọ': '/images/Beauty_Health.png'
    }
    return imageMap[productName] || '/images/fresh_fruit.png'
  }


  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return

      try {
        setLoading(true)
        const products = await ProductService.getAll()
        const foundProduct = products.find(p => p.id === parseInt(id))

        if (foundProduct) {
          setProduct(foundProduct)

          // Get related products (same category)
          const related = products
            .filter(p => p.category_id === foundProduct.category_id && p.id !== foundProduct.id)
            .slice(0, 4)
          setRelatedProducts(related)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  const hasDiscount = product.price < 20000 // Mock discount logic
  const originalPrice = hasDiscount ? product.price * 1.3 : undefined
  const discountPercent = hasDiscount ? Math.round(((originalPrice! - product.price) / originalPrice!) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <span>›</span>
          <span className="hover:text-primary-600">Rau củ</span>
          <span>›</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Product Detail */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Side - Single Image */}
            <div>
              {/* Main Image */}
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(product.name)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Side - Product Info */}
            <div className="space-y-6">
              {/* Product Status & Title */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    In Stock
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      {discountPercent}% Off
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
              </div>

              {/* SKU */}
              <div>
                <span className="text-sm text-gray-400">SKU: {product.id}</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary-600">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>


              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {product.description || 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla nibh diam, blandit vel consequat nec, ultrices et ipsum. Nulla varius magna a consequat pulvinar.'}
              </p>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                    </svg>
                  </button>
                  <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Thêm vào Giỏ
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>
                  </svg>
                </button>

                <button className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              </div>

              {/* Product Meta */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Danh mục:</span>
                  <span className="text-sm font-medium text-gray-900">{product.category_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tag:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Vegetables</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Healthy</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category_name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">Green Cabbage</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="bg-white rounded-2xl shadow-sm mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mô tả
              </button>
              <button
                onClick={() => setActiveTab('additional')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'additional'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thông tin bổ sung
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed mb-4">
                  Sed commodo aliquam dui ac porta. Fusce ipsum felis, imperdiet at posuere ac, viverra at mauris. Maecenas tincidunt ligula a sem vestibulum pharetra. Maecenas auctor tortor lacus, nec laoreet nisi porttitor vel. Etiam tincidunt metus vel dui interdum sollicitudin. Mauris sem ante, vestibulum nec orci vitae, aliquam mollis lacus. Sed et condimentum arcu, id molestie tellus. Nulla facilisi. Nam scelerisque vitae justo a convallis. Morbi urna ipsum, placerat quis commodo quis, egestas elementum leo. Donec convallis mollis enim. Aliquam id mi quam. Phasellus nec fringilla elit.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Nulla mauris tellus, feugiat quis pharetra sed, gravida ac dui. Sed iaculis, metus faucibus elementum tincidunt, turpis mi viverra velit, pellentesque tristique neque mi eget nulla. Proin luctus elementum neque et tempus.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Những gì làm cho chúng tôi khác biệt</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Sản phẩm tươi ngon chất lượng cao</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Nguồn gốc rõ ràng, an toàn</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Giao hàng nhanh chóng</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Giá cả hợp lý</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">64% Discount</h5>
                        <p className="text-sm text-gray-600">Save your 64% money with us</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🌿</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">100% Organic</h5>
                        <p className="text-sm text-gray-600">100% Organic Vegetables</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'additional' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Thông tin sản phẩm</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Trọng lượng:</span>
                        <span className="font-medium">03</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Màu sắc:</span>
                        <span className="font-medium">Xanh lá</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Loại:</span>
                        <span className="font-medium">Rau củ</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Danh mục:</span>
                        <span className="font-medium">{product.category_name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Kho:</span>
                        <span className="font-medium">Còn hàng</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Thông tin dinh dưỡng</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Calories:</span>
                        <span className="font-medium">25 kcal</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Chất béo:</span>
                        <span className="font-medium">0.1g</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Sodium:</span>
                        <span className="font-medium">18mg</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium">1.3g</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Vitamin C:</span>
                        <span className="font-medium">36.6mg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={getImageUrl(relatedProduct.name)}
                      alt={relatedProduct.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {relatedProduct.category_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {relatedProduct.unit}
                      </span>
                    </div>
                    <h3 className="text-gray-900 font-medium line-clamp-2 min-h-[2.5rem]">
                      <Link to={`/product/${relatedProduct.id}`} className="hover:text-primary-600">
                        {relatedProduct.name}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-primary-600 font-semibold text-lg">
                        {formatCurrency(relatedProduct.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(relatedProduct)}
                      className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm py-2 rounded-lg transition-colors"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
