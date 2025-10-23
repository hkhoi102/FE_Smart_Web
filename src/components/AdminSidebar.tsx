import { useEffect, useState } from 'react'

type TabType = 'overview' | 'management' | 'products' | 'categories' | 'units' | 'prices' | 'inventory' | 'inventory-management' | 'inventory-import-export' | 'inventory-import-export-list' | 'inventory-check-create' | 'inventory-check' | 'warehouses' | 'warehouse-list' | 'warehouse-history' | 'accounts' | 'promotions' | 'orders' | 'order-processing' | 'order-list' | 'return-processing' | 'create-order' | 'statistics' | 'revenue' | 'warehouse-stats' | 'product-stats'

interface AdminSidebarProps {
  currentTab: string
  onTabChange: (tab: TabType) => void
}

interface MenuItem {
  id: string
  label: string
  icon: string
  children?: MenuItem[]
}

const AdminSidebar = ({ currentTab, onTabChange }: AdminSidebarProps) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['management', 'warehouses', 'orders', 'statistics'])
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-collapse on small screens, expand on hover, collapse on leave
  useEffect(() => {
    const handleInit = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true)
      }
    }
    handleInit()
    const onResize = () => {
      if (window.innerWidth < 1280) setIsCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
    },
    {
      id: 'management',
      label: 'Quản lý',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      children: [
        { id: 'products', label: 'Quản lý sản phẩm', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'units', label: 'Quản lý đơn vị', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { id: 'categories', label: 'Quản lý danh mục', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
        { id: 'prices', label: 'Quản lý giá', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' }
      ]
    },
    {
      id: 'warehouses',
      label: 'Kho',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      children: [
        {
          id: 'inventory-management',
          label: 'Quản lý kho',
          icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
          children: [
            { id: 'inventory', label: 'Số lượng sản phẩm', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'inventory-import-export', label: 'Tạo phiếu nhập xuất hàng', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
            { id: 'inventory-import-export-list', label: 'Danh sách phiếu nhập xuất', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { id: 'inventory-check-create', label: 'Tạo phiếu kiểm kê', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
            { id: 'inventory-check', label: 'Quản lý kiểm kê', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
          ]
        },
        {
          id: 'warehouse-list',
          label: 'Danh sách kho',
          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
        },
        // {
        //   id: 'warehouse-history',
        //   label: 'Lịch sử nhập xuất',
        //   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        // }
      ]
    },
    {
      id: 'accounts',
      label: 'Tài khoản',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'promotions',
      label: 'Khuyến mãi',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
    },
    {
      id: 'orders',
      label: 'Đơn hàng',
      icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      children: [
        { id: 'order-processing', label: 'Đơn hàng đặt/trả', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { id: 'order-list', label: 'Đơn hàng hoàn thành', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        // { id: 'return-processing', label: 'Xử lý đơn trả về', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { id: 'returned-orders', label: 'Đơn hàng hoàn trả', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'create-order', label: 'Tạo đơn hàng', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' }
      ]
    },
    {
      id: 'statistics',
      label: 'Thống kê',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      children: [
        { id: 'revenue', label: 'Doanh thu', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
        { id: 'product-stats', label: 'Sản phẩm', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { id: 'warehouse-stats', label: 'Kho', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' }
      ]
    }
  ]

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isItemActive = (itemId: string): boolean => {
    if (itemId === currentTab) return true

    // Check if any child is active
    const findItem = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.id === itemId) return item
        if (item.children) {
          const found = findItem(item.children)
          if (found) return found
        }
      }
      return null
    }

    const item = findItem(menuItems)
    if (item?.children) {
      return item.children.some(child => child.id === currentTab)
    }
    return false
  }

  const handleItemClick = (itemId: string) => {
    // Special case: when clicking "Kho", go to "warehouse-list" by default
    if (itemId === 'warehouses') {
      onTabChange('warehouse-list' as TabType)
    } else {
      onTabChange(itemId as TabType)
    }
    // Auto-hide after navigation on small screens
    if (window.innerWidth < 1280) setIsCollapsed(true)
  }

  const toggleSidebar = () => {
    console.log('Toggle sidebar clicked, current state:', isCollapsed)
    setIsCollapsed(!isCollapsed)
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isActive = isItemActive(item.id)
    const isCurrentTab = currentTab === item.id

    return (
      <div key={item.id}>
        <div
          className={`flex items-center justify-between ${isCollapsed ? 'px-2' : 'px-3'} py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
            level === 0
              ? 'text-gray-900 hover:bg-gray-100 hover:text-gray-900'
              : level === 1
                ? isCollapsed ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-800' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-800 ml-4'
                : isCollapsed ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 ml-8'
          } ${
            isCurrentTab
              ? 'bg-green-100 text-green-800 border-r-2 border-green-600'
              : isActive
                ? 'bg-gray-50 text-gray-900'
                : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              handleItemClick(item.id)
            }
          }}
        >
          <div className="flex items-center">
            <svg
              className={`w-5 h-5 mr-3 ${
                isCurrentTab ? 'text-red-600' : 'text-gray-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            {!isCollapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </div>
          {hasChildren && !isCollapsed && (
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {hasChildren && isExpanded && !isCollapsed && item.children && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  console.log('Rendering sidebar, isCollapsed:', isCollapsed)

  return (
    <div
      className={`${isCollapsed ? 'w-16' : 'w-96'} bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0 transition-all duration-300 ease-in-out flex-shrink-0`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'px-2 py-2 justify-center' : 'px-4 py-2'} border-b border-gray-200`}>
        <div className="flex items-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">VL</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-green-900">71 MARKET</span>
          )}
        </div>
        {/* Toggle button removed */}
      </div>

      {/* Collapsed Menu Toggle Button removed per request */}

      {/* Menu */}
      <nav className={`${isCollapsed ? 'px-2 py-4' : 'px-4 py-4'} space-y-2`}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            MENU
          </div>
        )}
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Dashboard Reports Section */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            DASHBOARD REPORTS
          </div>
        <div className="space-y-1">
          <div className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-md cursor-pointer">
            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Chart Boxes 1</span>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}

export default AdminSidebar
