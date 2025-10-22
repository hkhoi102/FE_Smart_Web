import React, { useState, useEffect } from 'react'
import { Product, ProductUnit } from '@/services/productService'
import { BarcodeService } from '@/services/barcodeService'

interface AddBarcodeModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onSuccess: () => void
}

const AddBarcodeModal: React.FC<AddBarcodeModalProps> = ({ isOpen, onClose, products, onSuccess }) => {
  const [formData, setFormData] = useState({
    productId: '',
    productUnitId: '',
    code: '',
    type: 'EAN13'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([])

  // Filter products that don't have barcodes
  const productsWithoutBarcodes = products.filter(product => {
    return !product.productUnits?.some(unit =>
      (unit as any).barcodes && (unit as any).barcodes.length > 0
    )
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        productId: '',
        productUnitId: '',
        code: '',
        type: 'EAN13'
      })
      setSelectedProduct(null)
      setProductUnits([])
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === parseInt(formData.productId))
      if (product) {
        setSelectedProduct(product)
        setProductUnits(product.productUnits || [])
        setFormData(prev => ({ ...prev, productUnitId: '' }))
      }
    } else {
      setSelectedProduct(null)
      setProductUnits([])
    }
  }, [formData.productId, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productId || !formData.productUnitId || !formData.code.trim()) {
      setError('Vui lòng chọn sản phẩm, đơn vị tính và nhập mã barcode')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await BarcodeService.addBarcode(
        parseInt(formData.productUnitId),
        formData.code.trim(),
        formData.type
      )

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error adding barcode:', err)

      // Xử lý lỗi 400 - trùng mã barcode
      if (err?.status === 400) {
        let errorMessage = 'Có lỗi xảy ra khi thêm barcode'

        if (err?.message) {
          const message = err.message.toLowerCase()
          console.log('🔍 Barcode error message from backend:', err.message)

          // Kiểm tra trùng mã barcode
          if (message.includes('barcode') && (message.includes('already exists') || message.includes('đã tồn tại') ||
              message.includes('duplicate') || message.includes('trùng'))) {
            errorMessage = 'Mã barcode đã tồn tại. Vui lòng chọn mã khác.'
          }
          // Nếu có thông báo cụ thể từ backend, sử dụng nó
          else if (err.message && err.message !== 'Failed to add barcode: 400 Bad Request') {
            errorMessage = err.message
          }
        }

        setError(errorMessage)
      } else {
        setError(err.message || 'Có lỗi xảy ra khi thêm barcode')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ productId: '', productUnitId: '', code: '', type: 'EAN13' })
    setSelectedProduct(null)
    setProductUnits([])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Thêm mã barcode cho sản phẩm
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Chọn sản phẩm chưa có barcode để thêm mã barcode mới
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sản phẩm chưa có barcode *
                  </label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn sản phẩm</option>
                    {productsWithoutBarcodes.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (ID: {product.id})
                      </option>
                    ))}
                  </select>
                  {productsWithoutBarcodes.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Tất cả sản phẩm đã có barcode
                    </p>
                  )}
                </div>

                {/* Product Unit Selection */}
                {selectedProduct && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị tính *
                    </label>
                    <select
                      value={formData.productUnitId}
                      onChange={(e) => setFormData({ ...formData, productUnitId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Chọn đơn vị tính</option>
                      {productUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unitName} {unit.isDefault ? '(Mặc định)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Barcode Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại barcode
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="EAN13">EAN-13</option>
                    <option value="UPC">UPC</option>
                    <option value="QR">QR Code</option>
                    <option value="CODE128">Code 128</option>
                  </select>
                </div>

                {/* Barcode Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã barcode *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Nhập mã barcode..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || productsWithoutBarcodes.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Đang thêm...' : 'Thêm barcode'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddBarcodeModal
