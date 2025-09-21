import { useState } from 'react'

interface MenuItem {
  label: string
  icon: JSX.Element
}

const items: MenuItem[] = [
  { label: 'Đồ uống', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 2h8l-1 4H9L8 2zm1 4h6l-1 16H10L9 6z"/></svg>) },
  { label: 'Đồ ăn vặt', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4M8 4h8M6 12a6 6 0 1012 0"/></svg>) },
  { label: 'Sữa và sản phẩm từ sữa', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a4 4 0 00-4 4h8a4 4 0 00-4-4zM5 10h14l-2 10H7L5 10z"/></svg>) },
  { label: 'Hàng gia dụng', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6M6 6h12M5 22h14l-2-10H7L5 22z"/></svg>) },
  { label: 'Bánh', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 14h18v6H3v-6zm2-4h14l2 4H3l2-4z"/></svg>) },
]

interface CategoryMenuProps {
  initialActive?: number
  activeCategory?: string
  onSelect?: (label: string) => void
}

const CategoryMenu = ({ initialActive = 1, activeCategory, onSelect }: CategoryMenuProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Danh mục</h3>
      </div>
      <ul className="py-2">
        {items.map((item, idx) => {
          const isSelected = activeCategory === item.label
          const isHovered = hoverIndex === idx
          const isActive = isSelected || (!activeCategory && idx === initialActive)
          
          return (
            <li key={item.label}>
              <button
                type="button"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={(e) => {
                  e.preventDefault()
                  onSelect && onSelect(item.label)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : isHovered
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`${isActive ? 'text-white' : 'text-primary-600'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CategoryMenu


