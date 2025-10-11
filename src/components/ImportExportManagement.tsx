import { useState, useEffect } from 'react'
import { InventoryService, type TransactionDto, type WarehouseDto } from '@/services/inventoryService'
import { ProductService } from '@/services/productService'

interface ImportExportTransaction {
  id: number
  created_at: string
  note: string
  product_unit_id: number
  product_name: string
  unit: string
  quantity: number
  reference_number: string
  transaction_date: string
  transaction_type: 'IMPORT' | 'EXPORT'
  updated_at: string
  stock_location_id: number
  warehouse_id: number
  warehouse_name: string
}

interface ProductUnit {
  id: number
  productName: string
  unitName: string
}

const ImportExportManagement = () => {
  const [transactions, setTransactions] = useState<ImportExportTransaction[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ImportExportTransaction | null>(null)
  const [formData, setFormData] = useState({
    note: '',
    product_unit_id: '',
    quantity: '',
    reference_number: '',
    transaction_date: '',
    transaction_type: 'IMPORT' as 'IMPORT' | 'EXPORT',
    warehouse_id: '',
    stock_location_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | 'all'>('all')
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Load data from API
  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading import/export data...')

      // Load warehouses, product units, and transactions in parallel
      const [warehousesData, transactionsData] = await Promise.all([
        InventoryService.getWarehouses(),
        InventoryService.getTransactions()
      ])

      console.log('📦 Warehouses loaded:', warehousesData)
      console.log('📊 Transactions loaded:', transactionsData)

      setWarehouses(warehousesData)

      // Map transactions to UI format
      const mappedTransactions: ImportExportTransaction[] = await Promise.all(
        transactionsData.map(async (t: TransactionDto) => {
          // Get product unit details
          let productName = t.productName || 'Unknown Product'
          let unitName = t.unitName || 'Unknown Unit'

          if (!t.productName || !t.unitName) {
            try {
              const detail = await ProductService.getProductUnitById(t.productUnitId)
              productName = detail?.productName || `PU#${t.productUnitId}`
              unitName = detail?.unitName || '-'
            } catch (e) {
              console.warn(`Could not fetch product unit detail for ID ${t.productUnitId}:`, e)
            }
          }

          // Get warehouse name
          const warehouse = warehousesData.find(w => w.id === t.warehouseId)
          const warehouseName = warehouse?.name || `Kho #${t.warehouseId}`

          return {
            id: t.id,
            created_at: t.createdAt || '',
            note: t.note || '',
            product_unit_id: t.productUnitId,
            product_name: productName,
            unit: unitName,
            quantity: t.quantity,
            reference_number: t.referenceNumber || '',
            transaction_date: t.transactionDate,
            transaction_type: t.transactionType as 'IMPORT' | 'EXPORT',
            updated_at: t.updatedAt || '',
            stock_location_id: t.stockLocationId,
            warehouse_id: t.warehouseId,
            warehouse_name: warehouseName
          }
        })
      )

      console.log('📦 Mapped transactions:', mappedTransactions)
      setTransactions(mappedTransactions)

      // Load product units for dropdown
      const productUnitsData = await ProductService.getProducts()
      const allProductUnits: ProductUnit[] = []

      if (productUnitsData.products) {
        productUnitsData.products.forEach((product: any) => {
          if (product.productUnits) {
            product.productUnits.forEach((pu: any) => {
              allProductUnits.push({
                id: pu.id,
                productName: product.name,
                unitName: pu.unitName
              })
            })
          }
        })
      }

      console.log('📦 Product units loaded:', allProductUnits)
      setProductUnits(allProductUnits)

    } catch (error) {
      console.error('❌ Error loading data:', error)
      setNotify({ type: 'error', message: 'Không thể tải dữ liệu. Vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter
    const matchesWarehouse = warehouseFilter === 'all' || transaction.warehouse_id === warehouseFilter
    return matchesSearch && matchesType && matchesWarehouse
  })

  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setFormData({
      note: '',
      product_unit_id: '',
      quantity: '',
      reference_number: '',
      transaction_date: new Date().toISOString().slice(0, 16),
      transaction_type: 'IMPORT',
      warehouse_id: '',
      stock_location_id: ''
    })
    setIsModalOpen(true)
  }

  const handleEditTransaction = (transaction: ImportExportTransaction) => {
    setEditingTransaction(transaction)
    setFormData({
      note: transaction.note,
      product_unit_id: transaction.product_unit_id.toString(),
      quantity: transaction.quantity.toString(),
      reference_number: transaction.reference_number,
      transaction_date: transaction.transaction_date.slice(0, 16),
      transaction_type: transaction.transaction_type,
      warehouse_id: transaction.warehouse_id.toString(),
      stock_location_id: transaction.stock_location_id.toString()
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    setFormData({
      note: '',
      product_unit_id: '',
      quantity: '',
      reference_number: '',
      transaction_date: '',
      transaction_type: 'IMPORT',
      warehouse_id: '',
      stock_location_id: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.note || !formData.product_unit_id || !formData.quantity || !formData.reference_number || !formData.transaction_date || !formData.warehouse_id) {
      setNotify({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        productUnitId: parseInt(formData.product_unit_id),
        warehouseId: parseInt(formData.warehouse_id),
        stockLocationId: parseInt(formData.stock_location_id) || 1, // Default to 1 if not provided
        quantity: parseInt(formData.quantity),
        transactionType: formData.transaction_type,
        transactionDate: formData.transaction_date,
        note: formData.note,
        referenceNumber: formData.reference_number
      }

      console.log('📝 Submitting transaction:', payload)

      if (editingTransaction) {
        // Update existing transaction
        await InventoryService.updateTransaction(editingTransaction.id, payload)
        console.log('✅ Transaction updated:', editingTransaction.id)
        setNotify({ type: 'success', message: 'Cập nhật giao dịch thành công' })
      } else {
        // Create new transaction
        await InventoryService.createTransaction(payload)
        console.log('✅ Transaction created')
        setNotify({ type: 'success', message: 'Thêm giao dịch thành công' })
      }

      // Refresh data
      await loadData()
      handleCloseModal()

    } catch (error) {
      console.error('❌ Error saving transaction:', error)
      setNotify({ type: 'error', message: 'Không thể lưu giao dịch. Vui lòng thử lại.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      try {
        await InventoryService.deleteTransaction(id)
        console.log('✅ Transaction deleted:', id)
        setNotify({ type: 'success', message: 'Xóa giao dịch thành công' })

        // Refresh data
        await loadData()
      } catch (error) {
        console.error('❌ Error deleting transaction:', error)
        setNotify({ type: 'error', message: 'Không thể xóa giao dịch. Vui lòng thử lại.' })
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getTypeLabel = (type: string) => {
    return type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho'
  }

  const getTypeColor = (type: string) => {
    return type === 'IMPORT'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const importCount = transactions.filter(t => t.transaction_type === 'IMPORT').length
  const exportCount = transactions.filter(t => t.transaction_type === 'EXPORT').length
  const totalQuantity = transactions.reduce((sum, t) => sum + t.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Nhập/Xuất Kho</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddTransaction}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng giao dịch</p>
              <p className="text-2xl font-semibold text-gray-900">{transactions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Giao dịch nhập</p>
              <p className="text-2xl font-semibold text-gray-900">{importCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Giao dịch xuất</p>
              <p className="text-2xl font-semibold text-gray-900">{exportCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng số lượng</p>
              <p className="text-2xl font-semibold text-gray-900">{totalQuantity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo ghi chú, số tham chiếu hoặc sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="IMPORT">Nhập kho</option>
            <option value="EXPORT">Xuất kho</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tham chiếu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày giao dịch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    Không có dữ liệu giao dịch
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.transaction_type)}`}>
                      {getTypeLabel(transaction.transaction_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.note}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">{transaction.product_name}</div>
                      <div className="text-gray-500">{transaction.unit}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reference_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
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

            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
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
                        Loại giao dịch *
                      </label>
                      <select
                        value={formData.transaction_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value as 'IMPORT' | 'EXPORT' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="IMPORT">Nhập kho</option>
                        <option value="EXPORT">Xuất kho</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kho *
                      </label>
                      <select
                        value={formData.warehouse_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú *
                    </label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập ghi chú giao dịch"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sản phẩm *
                      </label>
                      <select
                        value={formData.product_unit_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_unit_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Chọn sản phẩm</option>
                        {productUnits.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.productName} ({product.unitName})
                          </option>
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
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tham chiếu *
                      </label>
                      <input
                        type="text"
                        value={formData.reference_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="VD: NK-2025-001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày giao dịch *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    {isSubmitting ? 'Đang lưu...' : (editingTransaction ? 'Cập nhật' : 'Thêm')}
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

export default ImportExportManagement
