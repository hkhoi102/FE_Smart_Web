import { useState, useEffect } from 'react'

interface Warehouse {
  id: number
  name: string
  address: string
  phone: string
  contact_person: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

interface InventoryItem {
  id: number
  productId: number
  productName: string
  category: string
  unit: string
  warehouseId: number
  warehouseName: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastUpdated: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unitPrice: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Mock data for warehouses
  const mockWarehouses: Warehouse[] = [
    {
      id: 1,
      name: 'Kho Trung tâm HCM',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      phone: '0900000001',
      contact_person: null,
      description: null,
      active: true,
      created_at: '2025-09-07 03:17:44.739836',
      updated_at: '2025-09-07 03:17:44.740834'
    },
    {
      id: 2,
      name: 'Kho Chi nhánh Hà Nội',
      address: '456 Lê Lợi, Hoàn Kiếm, Hà Nội',
      phone: '0900000002',
      contact_person: null,
      description: null,
      active: true,
      created_at: '2025-09-07 03:18:10.124190',
      updated_at: '2025-09-07 03:18:10.124190'
    }
  ]

  // Mock data for inventory
  const mockInventory: InventoryItem[] = [
    {
      id: 1,
      productId: 1,
      productName: 'Coca Cola',
      category: 'Đồ uống',
      unit: 'Lon',
      warehouseId: 1,
      warehouseName: 'Kho Trung tâm HCM',
      currentStock: 150,
      minStock: 50,
      maxStock: 500,
      unitPrice: 12000,
      totalValue: 1800000,
      lastUpdated: '2024-01-15 10:30:00',
      status: 'in_stock'
    },
    {
      id: 2,
      productId: 2,
      productName: 'Pepsi',
      category: 'Đồ uống',
      unit: 'Chai',
      warehouseId: 1,
      warehouseName: 'Kho Trung tâm HCM',
      currentStock: 25,
      minStock: 30,
      maxStock: 200,
      unitPrice: 15000,
      totalValue: 375000,
      lastUpdated: '2024-01-14 14:20:00',
      status: 'low_stock'
    },
    {
      id: 3,
      productId: 3,
      productName: 'Bánh mì',
      category: 'Thực phẩm',
      unit: 'Cái',
      warehouseId: 2,
      warehouseName: 'Kho Chi nhánh Hà Nội',
      currentStock: 0,
      minStock: 20,
      maxStock: 100,
      unitPrice: 8000,
      totalValue: 0,
      lastUpdated: '2024-01-13 09:15:00',
      status: 'out_of_stock'
    },
    {
      id: 4,
      productId: 4,
      productName: 'Sữa tươi',
      category: 'Sản phẩm sữa',
      unit: 'Hộp',
      warehouseId: 2,
      warehouseName: 'Kho Chi nhánh Hà Nội',
      currentStock: 80,
      minStock: 40,
      maxStock: 300,
      unitPrice: 25000,
      totalValue: 2000000,
      lastUpdated: '2024-01-15 08:45:00',
      status: 'in_stock'
    },
    {
      id: 5,
      productId: 5,
      productName: 'Kẹo',
      category: 'Đồ ngọt',
      unit: 'Gói',
      warehouseId: 1,
      warehouseName: 'Kho Trung tâm HCM',
      currentStock: 200,
      minStock: 100,
      maxStock: 1000,
      unitPrice: 5000,
      totalValue: 1000000,
      lastUpdated: '2024-01-15 16:30:00',
      status: 'in_stock'
    }
  ]

  useEffect(() => {
    setInventory(mockInventory)
    setWarehouses(mockWarehouses)
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  const handleAddItem = () => {
    setEditingItem(null)
    setFormData({
      productId: '',
      warehouseId: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      unitPrice: ''
    })
    setIsModalOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      productId: item.productId.toString(),
      warehouseId: item.warehouseId.toString(),
      currentStock: item.currentStock.toString(),
      minStock: item.minStock.toString(),
      maxStock: item.maxStock.toString(),
      unitPrice: item.unitPrice.toString()
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      productId: '',
      warehouseId: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      unitPrice: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.warehouseId || !formData.currentStock || !formData.minStock || !formData.maxStock || !formData.unitPrice) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const currentStock = parseInt(formData.currentStock)
      const minStock = parseInt(formData.minStock)
      const maxStock = parseInt(formData.maxStock)
      const unitPrice = parseInt(formData.unitPrice)
      const warehouseId = parseInt(formData.warehouseId)
      
      let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock'
      if (currentStock === 0) {
        status = 'out_of_stock'
      } else if (currentStock <= minStock) {
        status = 'low_stock'
      }

      const selectedWarehouse = warehouses.find(w => w.id === warehouseId)
      const warehouseName = selectedWarehouse?.name || 'Kho không xác định'

      if (editingItem) {
        // Update existing item
        setInventory(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { 
                ...item, 
                warehouseId,
                warehouseName,
                currentStock,
                minStock,
                maxStock,
                unitPrice,
                totalValue: currentStock * unitPrice,
                status,
                lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19)
              }
            : item
        ))
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: Math.max(...inventory.map(i => i.id)) + 1,
          productId: parseInt(formData.productId),
          productName: 'Sản phẩm mới',
          category: 'Chưa phân loại',
          unit: 'Cái',
          warehouseId,
          warehouseName,
          currentStock,
          minStock,
          maxStock,
          unitPrice,
          totalValue: currentStock * unitPrice,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status
        }
        setInventory(prev => [...prev, newItem])
      }
      
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }

  const handleDeleteItem = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục này khỏi kho?')) {
      setInventory(prev => prev.filter(item => item.id !== id))
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Còn hàng'
      case 'low_stock': return 'Sắp hết'
      case 'out_of_stock': return 'Hết hàng'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý kho</h2>
        <button
          onClick={handleAddItem}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Thêm mục kho
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng giá trị</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sắp hết</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hết hàng</p>
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, danh mục hoặc kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả kho</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="in_stock">Còn hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.unit}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {item.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Chỉnh sửa mục kho' : 'Thêm mục kho mới'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Sản phẩm *
                      </label>
                      <input
                        type="number"
                        value={formData.productId}
                        onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Nhập ID sản phẩm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kho *
                      </label>
                      <select
                        value={formData.warehouseId}
                        onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Chọn kho</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tồn kho hiện tại *
                      </label>
                      <input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tồn kho tối thiểu *
                      </label>
                      <input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tồn kho tối đa *
                      </label>
                      <input
                        type="number"
                        value={formData.maxStock}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Đơn giá (VND) *
                      </label>
                      <input
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Thêm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement
