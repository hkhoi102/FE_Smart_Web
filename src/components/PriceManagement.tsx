import { useState, useEffect } from 'react'
import { ProductService } from '@/services/productService'

interface PriceRow { id: number; productId: number; productName: string; unitId: number; unitName: string; price: number; validFrom: string; validTo?: string }

interface Product { id: number; name: string }

const PriceManagement = () => {
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrice, setEditingPrice] = useState<PriceRow | null>(null)
  const [formData, setFormData] = useState({
    productUnitId: '',
    price: '',
    startDate: '',
    endDate: ''
  })
  const [unitOptions, setUnitOptions] = useState<Array<{ id: number; name: string; productId: number; productName: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadProducts = async () => {
    const res = await ProductService.getProducts(1, 1000)
    const mapped = res.products.map((p: any) => ({ id: p.id, name: p.name, productUnits: p.productUnits || [] }))
    setProducts(mapped.map(p => ({ id: p.id, name: p.name })))
    const allPU: Array<{ id: number; name: string; productId: number; productName: string }> = []
    mapped.forEach(p => (p.productUnits || []).forEach((u: any) => allPU.push({ id: u.id, name: u.unitName, productId: p.id, productName: p.name })))
    setUnitOptions(allPU)
  }
  const loadDefaultPrices = async () => {
    // optional: can fetch for first product
    if (products.length === 0) return
    const list: PriceRow[] = []
    for (const p of products) {
      try {
        const pr = await ProductService.getProductPrices(p.id)
        pr.forEach((x: any) => list.push({ id: x.id, productId: p.id, productName: p.name, unitId: x.unitId, unitName: x.unitName || '', price: x.price, validFrom: x.validFrom || x.timeStart || x.startDate || '', validTo: x.validTo || x.timeEnd || x.endDate }))
      } catch {
        // ignore
      }
    }
    setPrices(list)
  }
  useEffect(() => { loadProducts() }, [])
  useEffect(() => { if (products.length) loadDefaultPrices() }, [products])

  // no-op; unitOptions đã build từ products

  const filteredPrices = prices.filter(price =>
    price.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    price.unitName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPrice = () => {
    setEditingPrice(null)
    const today = new Date().toISOString().split('T')[0]
    setFormData({ productUnitId: '', price: '', startDate: today, endDate: '' })
    setIsModalOpen(true)
  }

  const handleEditPrice = (price: PriceRow) => {
    setEditingPrice(price)
    setFormData({
      productUnitId: (unitOptions.find(o => o.productId === price.productId && o.name === price.unitName)?.id || '').toString(),
      price: price.price.toString(),
      startDate: price.validFrom,
      endDate: price.validTo || ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrice(null)
    const today = new Date().toISOString().split('T')[0]
    setFormData({ productUnitId: '', price: '', startDate: today, endDate: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productUnitId || !formData.price || !formData.startDate) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)

    try {
      const selectedPU = unitOptions.find(o => o.id === parseInt(formData.productUnitId))
      if (!selectedPU) return
      const productId = selectedPU.productId
      const validFrom = formData.startDate ? `${formData.startDate}T00:00:00` : ''
      const validTo = formData.endDate ? `${formData.endDate}T23:59:59` : undefined
      const payload = { unitId: parseInt(formData.productUnitId), price: parseFloat(formData.price), validFrom, validTo }
      if (editingPrice) await ProductService.updateProductPrice(productId, editingPrice.id, payload)
      else await ProductService.addProductPrice(productId, payload)
      // reload prices for this product
      const pr = await ProductService.getProductPrices(productId)
      const name = products.find(p => p.id === productId)?.name || ''
      setPrices(pr.map((x: any) => ({ id: x.id, productId, productName: name, unitId: x.unitId, unitName: x.unitName || '', price: x.price, validFrom: x.validFrom || x.timeStart || '', validTo: x.validTo || x.timeEnd })))
      handleCloseModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePrice = async (row: PriceRow) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giá này?')) return
    await ProductService.deleteProductPrice(row.productId, row.id)
    const pr = await ProductService.getProductPrices(row.productId)
    const name = products.find(p => p.id === row.productId)?.name || ''
    setPrices(pr.map((x: any) => ({ id: x.id, productId: row.productId, productName: name, unitId: x.unitId, unitName: x.unitName || '', price: x.price, validFrom: x.validFrom || '', validTo: x.validTo })))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatDateSafe = (value?: string) => {
    if (!value) return '—'
    const d = new Date(value)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('vi-VN')
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
                    {price.unitName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {formatPrice(price.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateSafe(price.validFrom)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateSafe(price.validTo)}
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
                        onClick={() => handleDeletePrice(price)}
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị của sản phẩm *</label>
                    <select
                      value={formData.productUnitId}
                      onChange={(e) => setFormData(prev => ({ ...prev, productUnitId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Chọn Product Unit</option>
                      {unitOptions.map(u => (
                        <option key={u.id} value={u.id}>{u.productName} — {u.name}</option>
                      ))}
                    </select>
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
