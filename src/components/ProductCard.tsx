import { HTMLAttributes } from 'react'

interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {
  imageUrl: string
  name: string
  price: number
  originalPrice?: number
}

const ProductCard = ({
  imageUrl,
  name,
  price,
  originalPrice,
  className = '',
  ...props
}: ProductCardProps) => {
  const hasDiscount = originalPrice && originalPrice > price

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200 ${className}`} {...props}>
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        <img src={imageUrl} alt={name} className="object-cover w-full h-full" />
      </div>

      <div className="p-4 space-y-2">

        <h3 className="text-gray-900 font-medium line-clamp-2 min-h-[2.5rem]">{name}</h3>

        <div className="flex items-center gap-2">
          <span className="text-primary-600 font-semibold">${price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">${originalPrice!.toFixed(2)}</span>
          )}
        </div>

        <button className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm py-2 rounded-lg transition-colors">Add to Cart</button>
      </div>
    </div>
  )
}

export default ProductCard


