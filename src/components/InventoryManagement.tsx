import { useState, useEffect } from 'react'
import { InventoryService, type WarehouseDto, type StockLocationDto, type StockBalanceDto } from '@/services/inventoryService'
import { ProductService } from '@/services/productService'

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
  const [locations, setLocations] = useState<StockLocationDto[]>([])
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [txnType, setTxnType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [formData, setFormData] = useState({
    productUnitId: '',
    warehouseId: '',
    stockLocationId: '',
    quantity: '',
    referenceNumber: '',
    note: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')


  useEffect(() => {
    const load = async () => {
      try {
        console.log('🔄 Loading inventory data...')
        const [whs, stocks] = await Promise.all([
          InventoryService.getWarehouses(),
          InventoryService.getStock(),
        ])
        console.log('📦 Warehouses loaded:', whs)
        console.log('📊 Stock data loaded:', stocks)
        setWarehouses(
          whs.map(w => ({
            id: w.id,
            name: w.name,
            address: w.address || '',
            phone: w.phone || '',
            contact_person: (w as any).manager || null,
            description: (w as any).description || null,
            active: w.active,
            created_at: (w as any).createdAt || '',
            updated_at: (w as any).updatedAt || '',
          }))
        )
        // Map stock rows into UI inventory rows (best-effort; BE may not return names)
        const mapped: InventoryItem[] = await Promise.all((stocks as StockBalanceDto[]).map(async (s, idx) => {
          let productName = s.productName as string | undefined
          let unitName = s.unitName as string | undefined
          if (!productName || !unitName) {
            const detail = await ProductService.getProductUnitById(s.productUnitId)
            productName = productName || detail?.productName || `PU#${s.productUnitId}`
            unitName = unitName || detail?.unitName || '-'
          }
          return {
            id: s.id ?? idx + 1,
            productId: s.productUnitId,
            productName,
            category: '-',
            unit: unitName,
            warehouseId: s.warehouseId,
            warehouseName: s.warehouseName || `Kho #${s.warehouseId}`,
            currentStock: s.quantity,
            minStock: 0,
            maxStock: 0,
            unitPrice: 0,
            totalValue: 0,
            lastUpdated: s.updatedAt || '',
            status: s.quantity === 0 ? 'out_of_stock' : 'in_stock',
          }
        }))
        setInventory(mapped)
        } catch (e) {
          console.error('❌ Error loading inventory data:', e)
          // Show error notification instead of falling back to mock
          setNotify({ type: 'error', message: 'Không thể tải dữ liệu kho. Vui lòng thử lại.' })
          setInventory([])
          setWarehouses([])
        }
    }
    load()
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
      productUnitId: '',
      warehouseId: '',
      stockLocationId: '',
      quantity: '',
      referenceNumber: '',
      note: ''
    })
    setTxnType('INBOUND')
    setIsModalOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    // repurpose edit to open outbound by default for quick deduction
    setEditingItem(item)
    setTxnType('OUTBOUND')
    setFormData({
      productUnitId: String(item.productId),
      warehouseId: String(item.warehouseId),
      stockLocationId: '',
      quantity: '',
      referenceNumber: '',
      note: ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      productUnitId: '',
      warehouseId: '',
      stockLocationId: '',
      quantity: '',
      referenceNumber: '',
      note: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const required = [formData.productUnitId, formData.warehouseId, formData.stockLocationId, formData.quantity]
    if (required.some(v => !v)) {
      setNotify({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        productUnitId: Number(formData.productUnitId),
        warehouseId: Number(formData.warehouseId),
        stockLocationId: Number(formData.stockLocationId),
        quantity: Number(formData.quantity),
        transactionDate: new Date().toISOString(),
        referenceNumber: formData.referenceNumber || undefined,
        note: formData.note || undefined,
      }
      if (txnType === 'INBOUND') {
        await InventoryService.inboundProcess(payload)
        setNotify({ type: 'success', message: 'Nhập kho thành công' })
      } else {
        await InventoryService.outbound(payload)
        setNotify({ type: 'success', message: 'Xuất kho thành công' })
      }
      // refresh stock
      const stocks = await InventoryService.getStock()
      const mapped: InventoryItem[] = await Promise.all((stocks as StockBalanceDto[]).map(async (s, idx) => {
        let productName = s.productName as string | undefined
        let unitName = s.unitName as string | undefined
        if (!productName || !unitName) {
          const detail = await ProductService.getProductUnitById(s.productUnitId)
          productName = productName || detail?.productName || `PU#${s.productUnitId}`
          unitName = unitName || detail?.unitName || '-'
        }
        return {
          id: s.id ?? idx + 1,
          productId: s.productUnitId,
          productName,
          category: '-',
          unit: unitName,
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName || `Kho #${s.warehouseId}`,
          currentStock: s.quantity,
          minStock: 0,
          maxStock: 0,
          unitPrice: 0,
          totalValue: 0,
          lastUpdated: s.updatedAt || '',
          status: s.quantity === 0 ? 'out_of_stock' : 'in_stock',
        }
      }))
      setInventory(mapped)
      handleCloseModal()
    } catch (err: any) {
      setNotify({ type: 'error', message: err?.message || 'Thao tác thất bại' })
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="flex gap-2">
          <button
            onClick={async () => {
              // quick refresh from BE
              const [whs, stocks] = await Promise.all([
                InventoryService.getWarehouses(),
                InventoryService.getStock(),
              ])
              setWarehouses(
                (whs as any).map((w: WarehouseDto) => ({
                  id: w.id,
                  name: w.name,
                  address: (w as any).address || '',
                  phone: (w as any).phone || '',
                  contact_person: (w as any).manager || null,
                  description: (w as any).description || null,
                  active: w.active,
                  created_at: (w as any).createdAt || '',
                  updated_at: (w as any).updatedAt || '',
                }))
              )
              const mapped: InventoryItem[] = await Promise.all((stocks as StockBalanceDto[]).map(async (s, idx) => {
                let productName = s.productName as string | undefined
                let unitName = s.unitName as string | undefined
                if (!productName || !unitName) {
                  const detail = await ProductService.getProductUnitById(s.productUnitId)
                  productName = productName || detail?.productName || `PU#${s.productUnitId}`
                  unitName = unitName || detail?.unitName || '-'
                }
                return {
                  id: s.id ?? idx + 1,
                  productId: s.productUnitId,
                  productName,
                  category: '-',
                  unit: unitName,
                  warehouseId: s.warehouseId,
                  warehouseName: s.warehouseName || `Kho #${s.warehouseId}`,
                  currentStock: s.quantity,
                  minStock: 0,
                  maxStock: 0,
                  unitPrice: 0,
                  totalValue: 0,
                  lastUpdated: s.updatedAt || '',
                  status: s.quantity === 0 ? 'out_of_stock' : 'in_stock',
                }
              }))
              setInventory(mapped)
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Làm mới
          </button>
          <button
            onClick={handleAddItem}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Thêm mục kho
          </button>
        </div>
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

      {/* Notification Modal */}
      {notify && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setNotify(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className={`flex items-center ${notify.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  <div className="flex-shrink-0">
                    {notify.type === 'error' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{notify.message}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setNotify(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                        Loại giao dịch
                      </label>
                      <select
                        value={txnType}
                        onChange={(e) => setTxnType(e.target.value === 'INBOUND' ? 'INBOUND' : 'OUTBOUND')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="INBOUND">Nhập kho</option>
                        <option value="OUTBOUND">Xuất kho</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ProductUnitId *
                      </label>
                      <input
                        type="number"
                        value={formData.productUnitId}
                        onChange={(e) => setFormData(prev => ({ ...prev, productUnitId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Nhập ProductUnitId"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kho *
                      </label>
                      <select
                        value={formData.warehouseId}
                        onChange={async (e) => {
                          const warehouseId = e.target.value
                          setFormData(prev => ({ ...prev, warehouseId, stockLocationId: '' }))
                          if (warehouseId) {
                            try {
                              const locs = await InventoryService.getStockLocations(Number(warehouseId))
                              setLocations(locs)
                            } catch {}
                          } else {
                            setLocations([])
                          }
                        }}
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
                        Vị trí kho *
                      </label>
                      <select
                        value={formData.stockLocationId}
                        onChange={(e) => setFormData(prev => ({ ...prev, stockLocationId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Chọn vị trí</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng *
                      </label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
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
                        Số tham chiếu
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="VD: NK-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        value={formData.note}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder=""
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
