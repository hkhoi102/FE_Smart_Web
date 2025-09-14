import { useState, useEffect } from 'react'

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

const ImportExportManagement = () => {
  const [transactions, setTransactions] = useState<ImportExportTransaction[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<ImportExportTransaction | null>(null)
  const [formData, setFormData] = useState({
    note: '',
    product_unit_id: '',
    quantity: '',
    reference_number: '',
    transaction_date: '',
    transaction_type: 'IMPORT' as 'IMPORT' | 'EXPORT',
    warehouse_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | 'all'>('all')

  // Mock data for warehouses
  const mockWarehouses = [
    { id: 1, name: 'Kho Trung tâm HCM' },
    { id: 2, name: 'Kho Chi nhánh Hà Nội' }
  ]

  // Mock data for product units
  const mockProductUnits = [
    { id: 1, name: 'Coca Cola', unit: 'Lon' },
    { id: 2, name: 'Pepsi', unit: 'Chai' },
    { id: 3, name: 'Bánh mì', unit: 'Cái' },
    { id: 4, name: 'Sữa tươi', unit: 'Hộp' }
  ]

  // Mock data for transactions
  const mockTransactions: ImportExportTransaction[] = [
    {
      id: 1,
      created_at: '2025-09-07 03:20:03.017057',
      note: 'Nhập hàng Coca Cola mới',
      product_unit_id: 1,
      product_name: 'Coca Cola',
      unit: 'Lon',
      quantity: 100,
      reference_number: 'NK-2025-001',
      transaction_date: '2025-01-27 03:30:00.000000',
      transaction_type: 'IMPORT',
      updated_at: '2025-09-07 03:20:03.017057',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    },
    {
      id: 2,
      created_at: '2025-09-07 03:20:03.017057',
      note: 'Nhập hàng Coca Cola mới',
      product_unit_id: 1,
      product_name: 'Coca Cola',
      unit: 'Lon',
      quantity: 5,
      reference_number: 'NK-2025-002_Thung',
      transaction_date: '2025-08-25 03:30:00.000000',
      transaction_type: 'IMPORT',
      updated_at: '2025-09-07 03:20:03.017057',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    },
    {
      id: 3,
      created_at: '2025-09-07 03:21:38.312386',
      note: 'Nhập Pessi',
      product_unit_id: 2,
      product_name: 'Pepsi',
      unit: 'Chai',
      quantity: 200,
      reference_number: 'NK-TEST-001',
      transaction_date: '2025-01-07 03:30:00.000000',
      transaction_type: 'IMPORT',
      updated_at: '2025-09-07 03:21:38.312386',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    },
    {
      id: 4,
      created_at: '2025-09-07 03:21:38.312386',
      note: 'Nhập Pessi',
      product_unit_id: 2,
      product_name: 'Pepsi',
      unit: 'Chai',
      quantity: 3,
      reference_number: 'NK-TEST-001',
      transaction_date: '2025-01-07 03:30:00.000000',
      transaction_type: 'IMPORT',
      updated_at: '2025-09-07 03:21:38.312386',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    },
    {
      id: 5,
      created_at: '2025-09-07 04:08:48.030039',
      note: 'Xuất kho cho đơn hàng #1',
      product_unit_id: 1,
      product_name: 'Coca Cola',
      unit: 'Lon',
      quantity: 2,
      reference_number: 'ORDER-1',
      transaction_date: '2025-01-27 03:30:00.000000',
      transaction_type: 'EXPORT',
      updated_at: '2025-09-07 04:08:48.030039',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    },
    {
      id: 6,
      created_at: '2025-09-07 04:08:48.030039',
      note: 'Xuất kho cho đơn hàng #1',
      product_unit_id: 2,
      product_name: 'Pepsi',
      unit: 'Chai',
      quantity: 1,
      reference_number: 'ORDER-1',
      transaction_date: '2025-01-27 03:30:00.000000',
      transaction_type: 'EXPORT',
      updated_at: '2025-09-07 04:08:48.030039',
      stock_location_id: 1,
      warehouse_id: 1,
      warehouse_name: 'Kho Trung tâm HCM'
    }
  ]

  useEffect(() => {
    setTransactions(mockTransactions)
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
      warehouse_id: ''
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
      warehouse_id: transaction.warehouse_id.toString()
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
      warehouse_id: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.note || !formData.product_unit_id || !formData.quantity || !formData.reference_number || !formData.transaction_date || !formData.warehouse_id) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const selectedProduct = mockProductUnits.find(p => p.id === parseInt(formData.product_unit_id))
      const selectedWarehouse = mockWarehouses.find(w => w.id === parseInt(formData.warehouse_id))
      
      if (editingTransaction) {
        // Update existing transaction
        setTransactions(prev => prev.map(transaction => 
          transaction.id === editingTransaction.id 
            ? { 
                ...transaction, 
                note: formData.note,
                product_unit_id: parseInt(formData.product_unit_id),
                product_name: selectedProduct?.name || 'Sản phẩm không xác định',
                unit: selectedProduct?.unit || 'Cái',
                quantity: parseInt(formData.quantity),
                reference_number: formData.reference_number,
                transaction_date: formData.transaction_date + ':00.000000',
                transaction_type: formData.transaction_type,
                warehouse_id: parseInt(formData.warehouse_id),
                warehouse_name: selectedWarehouse?.name || 'Kho không xác định',
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              }
            : transaction
        ))
      } else {
        // Add new transaction
        const newTransaction: ImportExportTransaction = {
          id: Math.max(...transactions.map(t => t.id)) + 1,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          note: formData.note,
          product_unit_id: parseInt(formData.product_unit_id),
          product_name: selectedProduct?.name || 'Sản phẩm không xác định',
          unit: selectedProduct?.unit || 'Cái',
          quantity: parseInt(formData.quantity),
          reference_number: formData.reference_number,
          transaction_date: formData.transaction_date + ':00.000000',
          transaction_type: formData.transaction_type,
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          stock_location_id: 1,
          warehouse_id: parseInt(formData.warehouse_id),
          warehouse_name: selectedWarehouse?.name || 'Kho không xác định'
        }
        setTransactions(prev => [...prev, newTransaction])
      }
      
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }

  const handleDeleteTransaction = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      setTransactions(prev => prev.filter(transaction => transaction.id !== id))
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
        <button
          onClick={handleAddTransaction}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Thêm giao dịch
        </button>
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
            {mockWarehouses.map(warehouse => (
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
              {filteredTransactions.map((transaction) => (
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
                        {mockWarehouses.map(warehouse => (
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
                        {mockProductUnits.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.unit})
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
