import { useState } from 'react'

interface MenuItem {
  label: string
  icon: JSX.Element
}

const items: MenuItem[] = [
  { label: 'Fresh Fruit', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4M8 4h8M6 12a6 6 0 1012 0"/></svg>) },
  { label: 'Vegetables', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2c3 3 3 7 0 10-3-3-3-7 0-10zM5 13l-2 7h18l-2-7"/></svg>) },
  { label: 'River Fish', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12s3-4 9-4 9 4 9 4-3 4-9 4-9-4-9-4zm0 0l6 4m12-4l-6 4"/></svg>) },
  { label: 'Chicken & Meat', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 18s4-2 4-6a4 4 0 118 0c0 4 4 6 4 6"/></svg>) },
  { label: 'Drink & Water', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 2h8l-1 4H9L8 2zm1 4h6l-1 16H10L9 6z"/></svg>) },
  { label: 'Yogurt & Ice Cream', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a4 4 0 00-4 4h8a4 4 0 00-4-4zM5 10h14l-2 10H7L5 10z"/></svg>) },
  { label: 'Cake & Bread', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 14h18v6H3v-6zm2-4h14l2 4H3l2-4z"/></svg>) },
  { label: 'Butter & Cream', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="8" width="18" height="8" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8v8"/></svg>) },
  { label: 'Cooking', icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v6M6 6h12M5 22h14l-2-10H7L5 22z"/></svg>) },
]

interface CategoryMenuProps {
  initialActive?: number
  onSelect?: (label: string) => void
}

const CategoryMenu = ({ initialActive = 1, onSelect }: CategoryMenuProps) => {
  const [activeIndex, setActiveIndex] = useState<number>(initialActive)

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <ul className="py-2">
        {items.map((item, idx) => {
          const active = idx === activeIndex
          return (
            <li key={item.label}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveIndex(idx)
                  onSelect && onSelect(item.label)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`${active ? 'text-white' : 'text-primary-600'}`}>{item.icon}</span>
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


