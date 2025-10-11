import React, { useState } from 'react'
import { Product } from '../services/productService'
import { useCart } from '../contexts/CartContext'

interface QuickViewModalProps {
  product: Product & { imageUrl?: string; originalPrice?: number }
  isOpen: boolean
  onClose: () => void
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getImageUrl = () => {
    if (product.imageUrl) return product.imageUrl

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
    return imageMap[product.name] || '/images/fresh_fruit.png'
  }


  const handleAddToCart = () => {
    // Block adding if all units have no price
    const units = product.productUnits || []
    const hasAnyPrice = units.some(u => typeof (u.currentPrice ?? u.convertedPrice) === 'number' && (u.currentPrice ?? u.convertedPrice)! > 0)
    if (!hasAnyPrice) return
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    onClose()
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  const hasDiscount = false
  const discountPercent = 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Left Side - Single Image */}
          <div className="p-6">
            {/* Main Image */}
            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <img
                src={getImageUrl()}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Side - Product Details */}
          <div className="p-6 flex flex-col">
            {/* Product Status */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                Còn hàng
              </span>
              {hasDiscount && (
                <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                  {discountPercent}% Off
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {/* SKU */}
            <div className="mb-4">
              <span className="text-sm text-gray-400">SKU: {product.id}</span>
            </div>

            {/* Price and Units */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Giá theo đơn vị tính</h3>
              {product.productUnits && product.productUnits.length > 0 ? (
                <div className="space-y-3">
                  {product.productUnits.map((unit) => (
                    <div key={unit.id} className={`flex items-center justify-between p-3 rounded-lg bg-gray-50`}>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{unit.unitName}</span>
                        {unit.isDefault && (
                          <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                            Mặc định
                          </span>
                        )}
                        {/* current unit indicator removed */}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-primary-600">
                          {typeof (unit.currentPrice ?? unit.convertedPrice) === 'number' && (unit.currentPrice ?? unit.convertedPrice)! > 0
                            ? formatCurrency((unit.currentPrice ?? unit.convertedPrice) as number)
                            : 'Liên hệ'}
                        </div>
                        {unit.conversionFactor && unit.conversionFactor !== 1 && (
                          <div className="text-xs text-gray-500">
                            Tỷ lệ: {unit.conversionFactor}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Chưa có thông tin giá</div>
              )}
            </div>

            {/* Brand */}
            <div className="mb-4">
              <span className="text-sm text-gray-600">Brand: </span>
              <span className="text-sm font-medium text-gray-900">Ecobazar</span>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {product.description || 'Sản phẩm tươi ngon, chất lượng cao được tuyển chọn kỹ càng từ các nhà cung cấp uy tín. Đảm bảo an toàn thực phẩm và giàu dinh dưỡng cho sức khỏe gia đình bạn.'}
            </p>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                  </svg>
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!((product.productUnits||[]).some(u => typeof (u.currentPrice ?? u.convertedPrice) === 'number' && (u.currentPrice ?? u.convertedPrice)! > 0))}
              >
                {((product.productUnits||[]).some(u => typeof (u.currentPrice ?? u.convertedPrice) === 'number' && (u.currentPrice ?? u.convertedPrice)! > 0)) ? 'Thêm vào Giỏ' : 'Liên hệ để mua'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Danh mục: </span>
                <span className="text-gray-900">{product.categoryName}</span>
              </div>
              <div>
                <span className="text-gray-600">Tag: </span>
                <span className="text-gray-900">Vegetables, Healthy, {product.categoryName}, {product.name.split(' ')[0]}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickViewModal
