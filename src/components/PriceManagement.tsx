import { useState, useEffect } from 'react'

interface Price {
  id: number
  productId: number
  productName: string
  unit: string
  price: number
  isDefault: boolean
  startDate: string
  endDate: string
  createdAt: string
}

interface Product {
  id: number
  name: string
  unit: string
}

const PriceManagement = () => {
  const [prices, setPrices] = useState<Price[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<Price | null>(null)
  const [formData, setFormData] = useState({
    productId: '',
    unit: '',
    price: '',
    startDate: '',
    endDate: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for products
  const mockProducts: Product[] = [
    { id: 1, name: 'Coca Cola', unit: 'Lon' },
    { id: 2, name: 'Pepsi', unit: 'Chai' },
    { id: 3, name: 'Bánh mì', unit: 'Cái' },
    { id: 4, name: 'Sữa tươi', unit: 'Hộp' },
    { id: 5, name: 'Kẹo', unit: 'Gói' },
    { id: 6, name: 'Nước suối', unit: 'Chai' },
    { id: 7, name: 'Bánh quy', unit: 'Hộp' },
    { id: 8, name: 'Nước cam', unit: 'Lon' },
    { id: 9, name: 'Bánh ngọt', unit: 'Cái' },
    { id: 10, name: 'Sữa chua', unit: 'Hộp' }
  ]

  // Mock data for prices
  const mockPrices: Price[] = [
    { id: 1, productId: 1, productName: 'Coca Cola', unit: 'Lon', price: 12000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 2, productId: 1, productName: 'Coca Cola', unit: 'Thùng', price: 120000, isDefault: false, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 3, productId: 2, productName: 'Pepsi', unit: 'Chai', price: 15000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 4, productId: 3, productName: 'Bánh mì', unit: 'Cái', price: 8000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 5, productId: 4, productName: 'Sữa tươi', unit: 'Hộp', price: 25000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 6, productId: 5, productName: 'Kẹo', unit: 'Gói', price: 5000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 7, productId: 6, productName: 'Nước suối', unit: 'Chai', price: 8000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 8, productId: 7, productName: 'Bánh quy', unit: 'Hộp', price: 18000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 9, productId: 8, productName: 'Nước cam', unit: 'Lon', price: 10000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' },
    { id: 10, productId: 9, productName: 'Bánh ngọt', unit: 'Cái', price: 12000, isDefault: true, startDate: '2024-01-01', endDate: '2024-12-31', createdAt: '2024-01-01' }
  ]

  useEffect(() => {
    setProducts(mockProducts)
    setPrices(mockPrices)
  }, [])

  const filteredPrices = prices.filter(price =>
    price.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.unit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPrice = () => {
    setEditingPrice(null)
    setFormData({ productId: '', unit: '', price: '', startDate: '', endDate: '' })
    setIsModalOpen(true)
  }

  const handleEditPrice = (price: Price) => {
    setEditingPrice(price)
    setFormData({
      productId: price.productId.toString(),
      unit: price.unit,
      price: price.price.toString(),
      startDate: price.startDate,
      endDate: price.endDate
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrice(null)
    setFormData({ productId: '', unit: '', price: '', startDate: '', endDate: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.unit || !formData.price || !formData.startDate || !formData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      const selectedProduct = products.find(p => p.id === parseInt(formData.productId))
      
      if (editingPrice) {
        // Update existing price
        setPrices(prev => prev.map(price => 
          price.id === editingPrice.id 
            ? { 
                ...price, 
                productId: parseInt(formData.productId),
                productName: selectedProduct?.name || '',
                unit: formData.unit,
                price: parseFloat(formData.price),
                isDefault: false,
                startDate: formData.startDate,
                endDate: formData.endDate
              }
            : price
        ))
      } else {
        // Add new price
        const newPrice: Price = {
          id: Math.max(...prices.map(p => p.id)) + 1,
          productId: parseInt(formData.productId),
          productName: selectedProduct?.name || '',
          unit: formData.unit,
          price: parseFloat(formData.price),
          isDefault: false,
          startDate: formData.startDate,
          endDate: formData.endDate,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setPrices(prev => [...prev, newPrice])
      }
      
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }

  const handleDeletePrice = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giá này?')) {
      setPrices(prev => prev.filter(price => price.id !== id))
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý giá</h2>
        <button
          onClick={handleAddPrice}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Thêm giá mới
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm hoặc đơn vị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Prices Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn vị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày bắt đầu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kết thúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {price.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {price.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {formatPrice(price.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(price.startDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(price.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPrice(price)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeletePrice(price.id)}
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
                  {editingPrice ? 'Chỉnh sửa giá' : 'Thêm giá mới'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sản phẩm *
                    </label>
                    <select
                      value={formData.productId}
                      onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Chọn sản phẩm</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị *
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập đơn vị tính"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá (VND) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập giá"
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
                    {isSubmitting ? 'Đang lưu...' : (editingPrice ? 'Cập nhật' : 'Thêm')}
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

export default PriceManagement
