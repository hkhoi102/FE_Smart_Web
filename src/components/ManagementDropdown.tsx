import { useState } from 'react'

interface ManagementDropdownProps {
  currentTab: 'overview' | 'products' | 'categories' | 'units' | 'prices' | 'inventory' | 'warehouses' | 'accounts' | 'promotions' | 'orders'
  onTabChange: (tab: 'overview' | 'products' | 'categories' | 'units' | 'prices' | 'inventory' | 'warehouses' | 'accounts' | 'promotions' | 'orders') => void
}

const ManagementDropdown = ({ currentTab, onTabChange }: ManagementDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const getCurrentLabel = () => {
    switch (currentTab) {
      case 'products':
        return 'Quản lý sản phẩm'
      case 'categories':
        return 'Quản lý danh mục'
      case 'units':
        return 'Quản lý đơn vị'
      case 'prices':
        return 'Giá'
      default:
        return 'Quản lý'
    }
  }

  const handleTabChange = (tab: 'products' | 'categories' | 'units' | 'prices') => {
    onTabChange(tab)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
          currentTab === 'products' || currentTab === 'categories' || currentTab === 'units' || currentTab === 'prices'
            ? 'border-green-500 text-green-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {getCurrentLabel()}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              <button
                onClick={() => handleTabChange('products')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  currentTab === 'products' ? 'text-green-600 bg-green-50' : 'text-gray-700'
                }`}
              >
                Quản lý sản phẩm
              </button>
              <button
                onClick={() => handleTabChange('categories')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  currentTab === 'categories' ? 'text-green-600 bg-green-50' : 'text-gray-700'
                }`}
              >
                Quản lý danh mục
              </button>
              <button
                onClick={() => handleTabChange('units')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  currentTab === 'units' ? 'text-green-600 bg-green-50' : 'text-gray-700'
                }`}
              >
                Quản lý đơn vị
              </button>
              <button
                onClick={() => handleTabChange('prices')}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  currentTab === 'prices' ? 'text-green-600 bg-green-50' : 'text-gray-700'
                }`}
              >
                Giá
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ManagementDropdown
