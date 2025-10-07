import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryService, WarehouseDto } from '../services/inventoryService'
import { ProductService } from '../services/productService'

interface ProductUnit {
  id: number
  productId: number
  productName: string
  unitName: string
  systemQuantity: number
  selected: boolean
  actualQuantity: number
  note: string
}

const InventoryImportExportCreate = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [products, setProducts] = useState<ProductUnit[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)
  const [slipName, setSlipName] = useState('')
  const [slipDate, setSlipDate] = useState(new Date().toISOString().slice(0, 16))
  const [notes, setNotes] = useState('')
  const [slipType, setSlipType] = useState<'IMPORT' | 'EXPORT'>('IMPORT')

  useEffect(() => {
    loadWarehouses()
    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedWarehouse && products.length > 0) {
      loadProductQuantities(selectedWarehouse)
    }
  }, [selectedWarehouse, products.length])

  const loadWarehouses = async () => {
    try {
      const data = await InventoryService.getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadProductQuantities = async (warehouseId: number) => {
    try {
      console.log('Loading product quantities for warehouse:', warehouseId)
      // Gọi API để lấy số lượng sản phẩm trong kho
      const inventoryData = await InventoryService.getStock({ warehouseId })
      console.log('Inventory data:', inventoryData)

      // Cập nhật số lượng cho từng sản phẩm
      setProducts(prev => prev.map(product => {
        const inventoryItem = inventoryData.find(item => item.productUnitId === product.id)
        return {
          ...product,
          systemQuantity: inventoryItem ? inventoryItem.quantity : 0
        }
      }))
    } catch (error) {
      console.error('Error loading product quantities:', error)
      // Nếu có lỗi, giữ nguyên số lượng 0
    }
  }

  const loadProducts = async () => {
    try {
      console.log('Loading products...')
      const data = await ProductService.getProducts(1, 1000)
      console.log('Products data:', data)

      const productUnits: ProductUnit[] = []

      if (data.products && data.products.length > 0) {
        // Load từng sản phẩm và lấy units thực tế
        for (const product of data.products) {
          try {
            // Gọi API lấy chi tiết sản phẩm để có units
            const productDetail = await ProductService.getProductById(product.id)
            console.log('Product detail:', productDetail)

            if (productDetail.productUnits && productDetail.productUnits.length > 0) {
              // Chỉ lấy đơn vị mặc định (isDefault = true)
              const defaultUnit = productDetail.productUnits.find(unit => unit.isDefault)
              if (defaultUnit) {
                productUnits.push({
                  id: defaultUnit.id,
                  productId: product.id,
                  productName: product.name,
                  unitName: defaultUnit.unitName || 'Cái',
                  systemQuantity: 0, // Sẽ được cập nhật khi chọn kho
                  selected: false,
                  actualQuantity: 0,
                  note: ''
                })
              } else {
                // Nếu không có đơn vị mặc định, lấy đơn vị đầu tiên
                const firstUnit = productDetail.productUnits[0]
                productUnits.push({
                  id: firstUnit.id,
                  productId: product.id,
                  productName: product.name,
                  unitName: firstUnit.unitName || 'Cái',
                  systemQuantity: 0,
                  selected: false,
                  actualQuantity: 0,
                  note: ''
                })
              }
            } else {
              // Nếu không có units, tạo một unit mặc định
              productUnits.push({
                id: product.id,
                productId: product.id,
                productName: product.name,
                unitName: 'Cái',
                systemQuantity: 0,
                selected: false,
                actualQuantity: 0,
                note: ''
              })
            }
          } catch (productError) {
            console.error('Error loading product detail:', productError)
            // Nếu lỗi load chi tiết sản phẩm, tạo unit mặc định
            productUnits.push({
              id: product.id,
              productId: product.id,
              productName: product.name,
              unitName: 'Cái',
              systemQuantity: 0,
              selected: false,
              actualQuantity: 0,
              note: ''
            })
          }
        }
      }

      console.log('Product units:', productUnits)
      setProducts(productUnits)
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!slipName.trim()) {
        alert('Vui lòng nhập tên phiếu')
        return
      }
      if (!selectedWarehouse) {
        alert('Vui lòng chọn kho')
        return
      }
      if (!slipDate) {
        alert('Vui lòng chọn ngày')
        return
      }
    }
    setCurrentStep(2)
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      navigate('/admin?tab=inventory')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const selectedProducts = products.filter(p => p.selected)
      if (selectedProducts.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm')
        return
      }

      // Lấy stock location đầu tiên của kho
      const stockLocations = await InventoryService.getStockLocations(selectedWarehouse!)
      if (stockLocations.length === 0) {
        alert('Kho này chưa có vị trí lưu trữ')
        return
      }
      const stockLocationId = stockLocations[0].id

      // Tạo document (phiếu nhập/xuất)
      const documentData = {
        type: (slipType === 'IMPORT' ? 'INBOUND' : 'OUTBOUND') as 'INBOUND' | 'OUTBOUND',
        warehouseId: selectedWarehouse!,
        stockLocationId: stockLocationId,
        referenceNumber: slipName,
        note: notes
      }

      console.log('Creating document:', documentData)
      const document = await InventoryService.createDocument(documentData)
      console.log('Document created:', document)

      // Thêm các dòng sản phẩm vào document
      const documentLines = selectedProducts.map(p => ({
        productUnitId: p.id,
        quantity: p.actualQuantity
      }))

      console.log('Adding document lines:', documentLines)
      await InventoryService.addDocumentLinesBulk(document.id, documentLines)

      // Không duyệt phiếu ngay, để trạng thái PENDING
      console.log('Document created with PENDING status:', document.id)

      alert('Tạo phiếu nhập xuất thành công! Phiếu đang chờ duyệt.')
      navigate('/admin?tab=inventory-import-export-list')
    } catch (error) {
      console.error('Error creating slip:', error)
      alert('Có lỗi xảy ra khi tạo phiếu: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu nhập xuất hàng</h1>
            <p className="text-gray-600">Tạo phiếu nhập xuất hàng mới</p>
          </div>
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Quay lại
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Thông tin phiếu & Chọn sản phẩm</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Nhập số lượng</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow">
          {currentStep === 1 && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin phiếu nhập xuất</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại phiếu *
                  </label>
                  <select
                    value={slipType}
                    onChange={(e) => setSlipType(e.target.value as 'IMPORT' | 'EXPORT')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="IMPORT">Nhập kho</option>
                    <option value="EXPORT">Xuất kho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phiếu *
                  </label>
                  <input
                    type="text"
                    value={slipName}
                    onChange={(e) => setSlipName(e.target.value)}
                    placeholder="Nhập tên phiếu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày *
                  </label>
                  <input
                    type="datetime-local"
                    value={slipDate}
                    onChange={(e) => setSlipDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kho *
                  </label>
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Nhập ghi chú..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Chọn sản phẩm</h4>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={products.every(p => p.selected)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setProducts(prev => prev.map(p => ({ ...p, selected: checked })))
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng hiện tại
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={product.selected}
                              onChange={(e) => {
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id ? { ...p, selected: e.target.checked } : p
                                ))
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.unitName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.systemQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nhập số lượng</h3>

              <div className="space-y-4">
                {products.filter(p => p.selected).map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{product.productName}</h4>
                        <p className="text-sm text-gray-500">Đơn vị: {product.unitName}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Số lượng {slipType === 'IMPORT' ? 'nhập' : 'xuất'}
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={product.actualQuantity}
                            onChange={(e) => {
                              setProducts(prev => prev.map(p =>
                                p.id === product.id ? { ...p, actualQuantity: Number(e.target.value) } : p
                              ))
                            }}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Ghi chú
                          </label>
                          <input
                            type="text"
                            value={product.note}
                            onChange={(e) => {
                              setProducts(prev => prev.map(p =>
                                p.id === product.id ? { ...p, note: e.target.value } : p
                              ))
                            }}
                            placeholder="Ghi chú..."
                            className="w-32 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  ← Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Đang tạo...' : 'Tạo phiếu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryImportExportCreate
