import { HTMLAttributes, useState } from 'react'
import { Link } from 'react-router-dom'
import { Product } from '../services/productService'
import { useCart } from '../contexts/CartContext'
import QuickViewModal from './QuickViewModal'

interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {
  product: Product & { imageUrl?: string; originalPrice?: number }
}

const ProductCard = ({
  product,
  className = '',
  ...props
}: ProductCardProps) => {
  const { addToCart } = useCart()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Get image URL - prioritize imageUrl prop, fallback to mapped images
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

  // Derive display unit and price from productUnits
  const defaultUnit = (product.productUnits && product.productUnits.find(u => u.isDefault)) || product.productUnits?.[0]
  const displayUnitName = defaultUnit?.unitName || ''
  const displayPrice = defaultUnit?.currentPrice ?? defaultUnit?.convertedPrice
  const hasPrice = typeof displayPrice === 'number' && (displayPrice as number) > 0
  const hasDiscount = false

  // Show unit count if multiple units (should be 1 now since we expanded)
  const unitCount = product.productUnits?.length || 0

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative group">
          <img
            src={getImageUrl()}
            alt={product.name}
            className="object-cover w-full h-full"
          />

          {/* Quick View Button - appears on hover */}
          <div className={`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsQuickViewOpen(true)
              }}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Quick View
            </button>
          </div>
        </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {product.categoryName}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {displayUnitName}
            </span>
            {unitCount > 1 && (
              <span className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                +{unitCount - 1} đơn vị
              </span>
            )}
          </div>
        </div>

        <h3 className="text-gray-900 font-medium line-clamp-2 min-h-[2.5rem]">
          <Link to={`/product/${product.id}`} className="hover:text-primary-600">
            {product.name}
            {displayUnitName && (
              <span className="text-sm text-gray-500 font-normal"> - {displayUnitName}</span>
            )}
          </Link>
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-primary-600 font-semibold text-lg">
            {typeof displayPrice === 'number' && displayPrice > 0 ? formatCurrency(displayPrice) : 'Liên hệ'}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">{/* no original price for now */}</span>
          )}
        </div>

        <button
          onClick={() => {
            if (!hasPrice) return
            addToCart(product)
          }}
          disabled={!hasPrice}
          className={`mt-2 w-full text-white text-sm py-2 rounded-lg transition-colors ${hasPrice ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}
        >
          {hasPrice ? 'Thêm vào giỏ' : 'Liên hệ để mua'}
        </button>
      </div>
    </div>

    {/* Quick View Modal */}
    <QuickViewModal
      product={product}
      isOpen={isQuickViewOpen}
      onClose={() => setIsQuickViewOpen(false)}
    />
    </>
  )
}

export default ProductCard


