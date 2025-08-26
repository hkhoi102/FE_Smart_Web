import { HTMLAttributes } from 'react'

interface CategoryCardProps extends HTMLAttributes<HTMLDivElement> {
  imageUrl?: string
  name: string
  items?: number
  selected?: boolean
}

const CategoryCard = ({ imageUrl, name, items, selected = false, className = '', ...props }: CategoryCardProps) => {
  return (
    <div className={`group bg-white border ${selected ? 'border-primary-500' : 'border-gray-200'} rounded-xl hover:border-primary-500 hover:shadow-sm transition-all duration-200 ${className}`} {...props}>
      <div className="p-5">
        <div className="h-24 flex items-center justify-center bg-white">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100" />
          )}
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-gray-900 font-medium group-hover:text-primary-600 transition-colors">{name}</h3>
          {typeof items === 'number' && (
            <p className="text-sm text-gray-500">{items} items</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CategoryCard


