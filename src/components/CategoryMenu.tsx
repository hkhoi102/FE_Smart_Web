import { useState, useEffect } from 'react'
import { CategoryService, type Category } from '@/services/categoryService'

interface CategoryMenuProps {
  initialActive?: number
  activeCategory?: string
  onSelect?: (category: Category) => void
}

const CategoryMenu = ({ initialActive = 1, activeCategory, onSelect }: CategoryMenuProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default icons for categories
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'Đồ uống': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 2h8l-1 4H9L8 2zm1 4h6l-1 16H10L9 6z"/></svg>),
      'Beverages': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 2h8l-1 4H9L8 2zm1 4h6l-1 16H10L9 6z"/></svg>),
      'Đồ ăn vặt': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4M8 4h8M6 12a6 6 0 1012 0"/></svg>),
      'Snacks': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4M8 4h8M6 12a6 6 0 1012 0"/></svg>),
      'Sữa và sản phẩm từ sữa': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a4 4 0 00-4 4h8a4 4 0 00-4-4zM5 10h14l-2 10H7L5 10z"/></svg>),
      'Dairy': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a4 4 0 00-4 4h8a4 4 0 00-4-4zM5 10h14l-2 10H7L5 10z"/></svg>),
      'Hàng gia dụng': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6M6 6h12M5 22h14l-2-10H7L5 22z"/></svg>),
      'Household': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6M6 6h12M5 22h14l-2-10H7L5 22z"/></svg>),
      'Bánh': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 14h18v6H3v-6zm2-4h14l2 4H3l2-4z"/></svg>),
      'Bread': (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 14h18v6H3v-6zm2-4h14l2 4H3l2-4z"/></svg>),
    }
    return iconMap[categoryName] || (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>)
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const categoriesData = await CategoryService.getCategories()
        setCategories(categoriesData)
        setError(null)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Không thể tải danh mục')
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Danh mục</h3>
        </div>
        <div className="py-2">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Danh mục</h3>
        </div>
        <div className="p-4 text-center">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Danh mục</h3>
      </div>
      <ul className="py-2">
        {categories.length > 0 ? (
          categories.map((category, idx) => {
            const isSelected = activeCategory === category.name
            const isHovered = hoverIndex === idx
            const isActive = isSelected || (!activeCategory && idx === initialActive)

            return (
              <li key={category.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelect && onSelect(category)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isHovered
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-primary-600'}`}>
                    {getCategoryIcon(category.name)}
                  </span>
                  <span>{category.name}</span>
                </button>
              </li>
            )
          })
        ) : (
          <li className="px-4 py-3 text-gray-500 text-sm text-center">
            Chưa có danh mục nào
          </li>
        )}
      </ul>
    </div>
  )
}

export default CategoryMenu


