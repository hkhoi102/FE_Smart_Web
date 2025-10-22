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
  conversionFactor?: number
  selected: boolean
  actualQuantity: number | ''
  note: string
  // Thông tin lô cho nhập kho
  lotNumber?: string
  expiryDate?: string
  manufacturingDate?: string
  supplierName?: string
  supplierBatchNumber?: string
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
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [notify, setNotify] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadWarehouses()
  }, [])

  useEffect(() => {
    if (selectedWarehouse) {
      loadProductsByWarehouse(selectedWarehouse)
    }
  }, [selectedWarehouse, slipType, showAllProducts])

  const loadWarehouses = async () => {
    try {
      const data = await InventoryService.getWarehouses()
      // Chỉ hiển thị các kho đang hoạt động (active = true)
      const activeWarehouses = Array.isArray(data) ? data.filter(w => w?.active === true) : []
      setWarehouses(activeWarehouses)
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const handleLotInfoChange = (productId: number, field: keyof Pick<ProductUnit, 'lotNumber' | 'expiryDate' | 'manufacturingDate' | 'supplierName' | 'supplierBatchNumber'>, value: string) => {
    setProducts(products.map(product =>
      product.id === productId ? { ...product, [field]: value } : product
    ))
  }

  const openNotify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotify({ open: true, title, message, type })
  }

  const closeNotify = () => {
    setNotify({ open: false, title: '', message: '', type: 'info' })
  }


  const loadProductsByWarehouse = async (warehouseId: number) => {
    try {
      console.log('🔄 Loading products for warehouse:', warehouseId, 'Type:', slipType)
      setLoading(true)

      let response: Response

      if (slipType === 'IMPORT') {
        // Nhập hàng: Lấy sản phẩm dựa trên showAllProducts
        if (showAllProducts) {
          console.log('📦 Loading ALL products for import (including normal products)')
          response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/products/inventory-status?lowStockThreshold=0&warehouseId=${warehouseId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          })
        } else {
          console.log('📦 Loading low stock and new products for import')
          response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/products/inventory-status?lowStockThreshold=100&warehouseId=${warehouseId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          })
        }
      } else {
        // Xuất hàng: Lấy tất cả sản phẩm trong kho
        console.log('📦 Loading ALL products for export')
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/inventory/stock?warehouseId=${warehouseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        })
      }

      console.log('📡 API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`Failed to fetch products: ${response.status} ${errorText}`)
      }

      const apiResponse = await response.json()
      console.log('📦 API response received:', apiResponse)

      // Lấy data từ response
      const responseData = apiResponse.data || apiResponse
      console.log('📦 Response data extracted:', responseData)

      const productUnits: ProductUnit[] = []

      // Xử lý dữ liệu dựa trên loại phiếu
      let productsData: any[] = []

      if (slipType === 'IMPORT') {
        // Nhập hàng: Xử lý dữ liệu dựa trên showAllProducts
        if (showAllProducts) {
          // Lấy tất cả sản phẩm từ inventory-status (bao gồm cả sản phẩm bình thường)
          const lowStockProducts = responseData.lowStockProducts || []
          const newProducts = responseData.newProducts || []
          const normalProducts = responseData.normalProducts || []
          productsData = [...lowStockProducts, ...newProducts, ...normalProducts]
          console.log('📦 Low stock products:', lowStockProducts.length)
          console.log('📦 New products:', newProducts.length)
          console.log('📦 Normal products:', normalProducts.length)
          console.log('📦 Total products for import (all):', productsData.length)
        } else {
          // Lấy cả lowStockProducts và newProducts (mặc định)
          const lowStockProducts = responseData.lowStockProducts || []
          const newProducts = responseData.newProducts || []
          productsData = [...lowStockProducts, ...newProducts]
          console.log('📦 Low stock products:', lowStockProducts.length)
          console.log('📦 New products:', newProducts.length)
          console.log('📦 Total products for import:', productsData.length)
        }
      } else {
        // Xuất hàng: Lấy tất cả sản phẩm (giữ nguyên logic cũ)
        productsData = responseData
      }

      console.log('📦 Products data to process:', productsData)
      console.log('📦 Data type:', typeof productsData)
      console.log('📦 Data length:', Array.isArray(productsData) ? productsData.length : 'Not an array')

      // Kiểm tra cấu trúc data
      if (productsData && Array.isArray(productsData) && productsData.length > 0) {
        console.log('✅ Processing', productsData.length, 'products')

        // Sắp xếp theo số lượng tồn kho (lấy từ productUnits)
        const sortedData = productsData.sort((a: any, b: any) => {
          // Lấy số lượng từ productUnits đầu tiên (default unit)
          const aQty = a.productUnits && a.productUnits.length > 0 ? (a.productUnits[0].availableQuantity || a.productUnits[0].quantity || 0) : 0
          const bQty = b.productUnits && b.productUnits.length > 0 ? (b.productUnits[0].availableQuantity || b.productUnits[0].quantity || 0) : 0
          return slipType === 'IMPORT' ? aQty - bQty : bQty - aQty // Import: ít nhất lên đầu, Export: nhiều nhất lên đầu
        })
        console.log('📊 Sorted data:', sortedData)

        // Debug chi tiết cho item đầu tiên
        if (sortedData.length > 0) {
          console.log('🔍 First item structure:', sortedData[0])
          console.log('🔍 First item keys:', Object.keys(sortedData[0]))
          console.log('🔍 First item productName:', sortedData[0].productName)
          console.log('🔍 First item unitName:', sortedData[0].unitName)
        }

        // Xử lý từng sản phẩm từ API
        for (const productData of sortedData) {
          console.log('🔍 Processing product:', productData)
          console.log('🔍 Product keys:', Object.keys(productData))
          console.log('🔍 productId:', productData.id)
          console.log('🔍 productName:', productData.name)
          console.log('🔍 productUnits:', productData.productUnits)

          if (slipType === 'IMPORT') {
            // Nhập hàng: Xử lý từng productUnit của sản phẩm
            if (productData.productUnits && Array.isArray(productData.productUnits) && productData.productUnits.length > 0) {
              for (const productUnitData of productData.productUnits) {
                console.log('🔍 Processing productUnit:', productUnitData)

                const productUnit: ProductUnit = {
                  id: productUnitData.id,
                  productId: productData.id,
                  productName: productData.name || `Product ${productData.id}`,
                  unitName: productUnitData.unitName || 'Cái',
                  systemQuantity: productUnitData.availableQuantity || productUnitData.quantity || 0,
                  conversionFactor: productUnitData.conversionFactor ?? productUnitData.conversionRate ?? 1,
                  selected: false,
                  actualQuantity: '',
                  note: ''
                }
                productUnits.push(productUnit)
                console.log('✅ Added product unit:', productUnit)
              }
            } else {
              console.warn('⚠️ Product has no productUnits:', productData.name)
              // Fallback: tạo một productUnit mặc định
              const productUnit: ProductUnit = {
                id: productData.id,
                productId: productData.id,
                productName: productData.name || `Product ${productData.id}`,
                unitName: 'Cái',
                systemQuantity: 0,
                selected: false,
                actualQuantity: '',
                note: ''
              }
              productUnits.push(productUnit)
              console.log('✅ Added fallback product unit:', productUnit)
            }
          } else {
            // Xuất hàng: API stock trả về productUnitId, cần gọi thêm API để lấy thông tin chi tiết
            console.log('🔍 Processing export productUnit with ID:', productData.productUnitId)

            try {
              console.log('📦 Fetching product unit details for productUnitId:', productData.productUnitId)
              const productUnitDetail = await ProductService.getProductUnitById(productData.productUnitId)
              console.log('📋 Fetched product unit detail:', productUnitDetail)

              if (productUnitDetail) {
                const productUnit: ProductUnit = {
                  id: productData.productUnitId,
                  productId: productUnitDetail.productId || 0,
                  productName: productUnitDetail.productName || `Product ${productUnitDetail.productId}`,
                  unitName: productUnitDetail.unitName || 'Cái',
                  systemQuantity: productData.availableQuantity || productData.quantity || 0,
                  conversionFactor: (productUnitDetail as any)?.conversionFactor ?? (productUnitDetail as any)?.conversionRate ?? 1,
                  selected: false,
                  actualQuantity: '',
                  note: ''
                }
                productUnits.push(productUnit)
                console.log('✅ Added product unit with fetched details:', productUnit)
              } else {
                console.warn('⚠️ Product unit detail not found for productUnitId:', productData.productUnitId)
                // Fallback với ID
                const productUnit: ProductUnit = {
                  id: productData.productUnitId,
                  productId: 0,
                  productName: `Product Unit ${productData.productUnitId}`,
                  unitName: 'Cái',
                  systemQuantity: productData.availableQuantity || productData.quantity || 0,
                  conversionFactor: 1,
                  selected: false,
                  actualQuantity: '',
                  note: ''
                }
                productUnits.push(productUnit)
                console.log('✅ Added product unit with fallback:', productUnit)
              }
            } catch (error) {
              console.error('❌ Error fetching product unit detail:', error)
              // Fallback với ID
              const productUnit: ProductUnit = {
                id: productData.productUnitId,
                productId: 0,
                productName: `Product Unit ${productData.productUnitId}`,
                unitName: 'Cái',
                systemQuantity: productData.availableQuantity || productData.quantity || 0,
                conversionFactor: 1,
                selected: false,
                actualQuantity: '',
                note: ''
              }
              productUnits.push(productUnit)
              console.log('✅ Added product unit with error fallback:', productUnit)
            }
          }
        }
      } else {
        console.warn('⚠️ No products data or empty array received')
      }

      console.log('🎯 Final product units:', productUnits)
      console.log('🎯 Product units count:', productUnits.length)
      setProducts(productUnits)
    } catch (error) {
      console.error('❌ Error loading products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!slipName.trim()) {
        openNotify('Lỗi', 'Vui lòng nhập tên phiếu', 'error')
        return
      }
      if (!selectedWarehouse) {
        openNotify('Lỗi', 'Vui lòng chọn kho', 'error')
        return
      }
      if (!slipDate) {
        openNotify('Lỗi', 'Vui lòng chọn ngày', 'error')
        return
      }
      // Kiểm tra phải chọn ít nhất một sản phẩm
      const selectedProducts = products.filter(p => p.selected)
      if (selectedProducts.length === 0) {
        openNotify('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm', 'error')
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
        openNotify('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm', 'error')
        return
      }

      // Validate số lượng > 0 cho tất cả sản phẩm đã chọn
      const invalidQty = selectedProducts.filter(p => {
        const qty = typeof p.actualQuantity === 'string' ? parseInt(p.actualQuantity || '0', 10) : p.actualQuantity
        return !qty || qty <= 0
      })
      if (invalidQty.length > 0) {
        openNotify('Lỗi', slipType === 'IMPORT' ? 'Số lượng nhập phải lớn hơn 0' : 'Số lượng xuất phải lớn hơn 0', 'error')
        return
      }

      // Validation cho nhập kho theo lô (bắt buộc)
      if (slipType === 'IMPORT') {
        const productsWithoutLotNumber = selectedProducts.filter(p => !p.lotNumber || p.lotNumber.trim() === '')

        if (productsWithoutLotNumber.length > 0) {
          openNotify('Lỗi', 'Vui lòng nhập số lô cho tất cả sản phẩm đã chọn. Số lô là bắt buộc khi nhập kho.', 'error')
          return
        }

        // Kiểm tra ngày sản xuất không được để trống
        const productsWithoutManufacturingDate = selectedProducts.filter(p => !p.manufacturingDate || p.manufacturingDate.trim() === '')

        if (productsWithoutManufacturingDate.length > 0) {
          openNotify('Lỗi', 'Vui lòng nhập ngày sản xuất cho tất cả sản phẩm đã chọn. Ngày sản xuất là bắt buộc khi nhập kho.', 'error')
          return
        }

        // Kiểm tra hạn sử dụng không được để trống
        const productsWithoutExpiryDate = selectedProducts.filter(p => !p.expiryDate || p.expiryDate.trim() === '')

        if (productsWithoutExpiryDate.length > 0) {
          openNotify('Lỗi', 'Vui lòng nhập hạn sử dụng cho tất cả sản phẩm đã chọn. Hạn sử dụng là bắt buộc khi nhập kho.', 'error')
          return
        }

        // Kiểm tra trùng số lô trong danh sách sản phẩm đã chọn (client-side)
        const lotNumberMap = new Map<string, number>()
        for (const p of selectedProducts) {
          const ln = (p.lotNumber || '').trim()
          if (!ln) continue
          if (lotNumberMap.has(ln)) {
            openNotify('Lỗi', 'Số lô không được trùng', 'error')
            return
          }
          lotNumberMap.set(ln, 1)
        }
      }

      // Lấy stock location đầu tiên của kho
      const stockLocations = await InventoryService.getStockLocations(selectedWarehouse!)
      if (stockLocations.length === 0) {
        openNotify('Lỗi', 'Kho này chưa có vị trí lưu trữ', 'error')
        return
      }
      const stockLocationId = stockLocations[0].id

      // Xử lý khác nhau cho nhập kho và xuất kho
      if (slipType === 'IMPORT') {
        // Nhập kho: CHỈ tạo phiếu nhập, CHƯA nhập kho. Nhập kho sẽ thực hiện khi duyệt (approve)
        const documentData = {
          type: 'INBOUND' as const,
          warehouseId: selectedWarehouse!,
          stockLocationId: stockLocationId,
          referenceNumber: slipName,
          note: notes
        }

        console.log('Creating inbound document (pending):', documentData)
        const document = await InventoryService.createDocument(documentData)
        console.log('Inbound document created:', document)

        // Thêm từng dòng kèm thông tin lô theo đặc tả BE
        for (const p of selectedProducts) {
          const qty = typeof p.actualQuantity === 'string' ? parseInt(p.actualQuantity || '0', 10) : p.actualQuantity
          const line = {
            productUnitId: p.id,
            quantity: qty,
            lotNumber: p.lotNumber,
            expiryDate: p.expiryDate,
            manufacturingDate: p.manufacturingDate,
            supplierName: p.supplierName,
            supplierBatchNumber: p.supplierBatchNumber,
          }
          console.log('Adding inbound document line (pending):', line)
          try {
            await InventoryService.addDocumentLine(document.id, line)
          } catch (error: any) {
            console.error('Error adding document line:', error)
            if (error?.status === 400 || error?.response?.status === 400) {
              let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm vào phiếu'
              if (error?.message) {
                const message = error.message.toLowerCase()
                if (message.includes('số lô') && (message.includes('đã được sử dụng') || message.includes('already used') ||
                    message.includes('đã tồn tại') || message.includes('already exists'))) {
                  errorMessage = `Số lô '${p.lotNumber}' đã được sử dụng cho sản phẩm khác. Vui lòng chọn số lô khác.`
                } else if (message.includes('lot') && (message.includes('already used') || message.includes('already exists'))) {
                  errorMessage = `Lot number '${p.lotNumber}' has already been used for another product. Please choose a different lot number.`
                } else if (error.message && error.message !== 'Failed to add document line: 400 Bad Request') {
                  errorMessage = error.message
                }
              }
              openNotify('Lỗi', errorMessage, 'error')
              return
            }
            throw error
          }
        }
        openNotify('Thành công', 'Tạo phiếu nhập kho thành công! Phiếu đang chờ duyệt.', 'success')

        // Delay reset form để user có thể thấy thông báo
        setTimeout(() => {
          setCurrentStep(1)
          setProducts([])
          setSelectedWarehouse(null)
          setSlipName('')
          setSlipDate(new Date().toISOString().slice(0, 16))
          setNotes('')
          setShowAllProducts(false)
        }, 2000) // 2 giây delay
      } else {
        // Xuất kho: Giữ nguyên logic cũ
        const documentData = {
          type: 'OUTBOUND' as const,
          warehouseId: selectedWarehouse!,
          stockLocationId: stockLocationId,
          referenceNumber: slipName,
          note: notes
        }

        console.log('Creating document:', documentData)
        const document = await InventoryService.createDocument(documentData)
        console.log('Document created:', document)

        const documentLines = selectedProducts.map(p => {
          const qty = typeof p.actualQuantity === 'string' ? parseInt(p.actualQuantity || '0', 10) : p.actualQuantity
          return {
          productUnitId: p.id,
          quantity: qty
        }
        })

        console.log('Adding document lines:', documentLines)
        try {
          await InventoryService.addDocumentLinesBulk(document.id, documentLines)
        } catch (error: any) {
          // Hiển thị thông báo lỗi hết hàng/không đủ tồn
          if (error?.status === 400 || error?.response?.status === 400) {
            let errorMessage = 'Không thể tạo phiếu xuất. Có sản phẩm không đủ tồn kho.'
            if (error?.message) {
              const msg = String(error.message).toLowerCase()
              if (msg.includes('không đủ') || msg.includes('het hang') || msg.includes('hết hàng') || msg.includes('insufficient') || msg.includes('not enough') || msg.includes('out of stock')) {
                errorMessage = 'Không thể tạo phiếu xuất vì tồn kho không đủ.'
              } else {
                errorMessage = error.message
              }
            }
            openNotify('Lỗi', errorMessage, 'error')
            return
          }
          throw error
        }
        openNotify('Thành công', 'Tạo phiếu xuất kho thành công! Phiếu đang chờ duyệt.', 'success')

        // Delay reset form để user có thể thấy thông báo
        setTimeout(() => {
          setCurrentStep(1)
          setProducts([])
          setSelectedWarehouse(null)
          setSlipName('')
          setSlipDate(new Date().toISOString().slice(0, 16))
          setNotes('')
          setShowAllProducts(false)
        }, 2000) // 2 giây delay
      }
    } catch (error) {
      console.error('Error creating slip:', error)
      openNotify('Lỗi', 'Có lỗi xảy ra khi tạo phiếu: ' + (error as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tạo phiếu nhập xuất hàng</h1>
            <p className="text-gray-600">Tạo phiếu nhập xuất hàng mới</p>
          </div>
          {/* <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Quay lại
          </button> */}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Thông tin phiếu & Chọn sản phẩm</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
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
                    onChange={(e) => {
                      const newSlipType = e.target.value as 'IMPORT' | 'EXPORT'
                      setSlipType(newSlipType)
                      // Reset showAllProducts khi chuyển sang xuất kho
                      if (newSlipType === 'EXPORT') {
                        setShowAllProducts(false)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kho *
                  </label>
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Chọn sản phẩm</h4>

                  {/* Toggle hiển thị tất cả sản phẩm - chỉ hiện khi nhập kho */}
                  {slipType === 'IMPORT' && (
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showAllProducts}
                          onChange={(e) => setShowAllProducts(e.target.checked)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-green-800">
                          Hiển thị tất cả sản phẩm
                        </span>
                      </label>
                    </div>
                  )}
                </div>
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
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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
                      {products.map((product, index) => (
                        <tr key={`product-${product.id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={product.selected}
                              onChange={(e) => {
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id ? { ...p, selected: e.target.checked } : p
                                ))
                              }}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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

                {/* Thông tin trạng thái hiển thị - chỉ hiện khi nhập kho */}
                {slipType === 'IMPORT' && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-600">
                      {showAllProducts ?
                        '📦 Đang hiển thị tất cả sản phẩm ' :
                        '📦 Đang hiển thị sản phẩm sắp hết hàng và sản phẩm mới'
                      }
                    </div>
                    {/* <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-600">
                      🏷️ Nhập kho theo lô (bắt buộc) - Sử dụng API /api/inventory/inbound/process để tạo stock lots tự động
                    </div> */}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Tiếp theo →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nhập số lượng</h3>

              {/* Bảng nhập số lượng với thông tin lô - 1 hàng duy nhất */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Sản phẩm
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                        Đơn vị
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                        Số lượng {slipType === 'IMPORT' ? 'nhập' : 'xuất'}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Ghi chú
                      </th>
                      {/* Cột thông tin lô - chỉ hiện khi nhập kho */}
                      {slipType === 'IMPORT' && (
                        <>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            Số lô *
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            NSX
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                            HSD
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                            Nhà cung cấp
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.filter(p => p.selected).map((product, index) => (
                      <tr key={`selected-${product.id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate">{product.productName}</div>
                            <div className="text-xs text-gray-500">ID: {product.id}</div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          {product.unitName}
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="1"
                            value={product.actualQuantity}
                            onChange={(e) => {
                              const { value } = e.target
                              // Cho phép rỗng trong khi nhập để tránh tiền tố 0
                              if (value === '') {
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id ? { ...p, actualQuantity: '' } : p
                                ))
                                return
                              }
                              // Loại bỏ leading zeros và chỉ nhận số dương (không cho phép 0 và số âm)
                              const parsed = parseInt(value, 10)
                              if (!isNaN(parsed) && parsed > 0) {
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id ? { ...p, actualQuantity: parsed } : p
                                ))
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value
                              if (value === '' || value === '0') {
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id ? { ...p, actualQuantity: 1 } : p
                                ))
                              }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-3 py-4">
                          <input
                            type="text"
                            value={product.note}
                            onChange={(e) => {
                              setProducts(prev => prev.map(p =>
                                p.id === product.id ? { ...p, note: e.target.value } : p
                              ))
                            }}
                            placeholder="Ghi chú..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                        {/* Các ô thông tin lô - chỉ hiện khi nhập kho */}
                        {slipType === 'IMPORT' && (
                          <>
                            <td className="px-3 py-4">
                              <input
                                type="text"
                                value={product.lotNumber || ''}
                                onChange={(e) => handleLotInfoChange(product.id, 'lotNumber', e.target.value)}
                                placeholder="Số lô *"
                                required
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                            <td className="px-3 py-4">
                              <input
                                type="date"
                                value={product.manufacturingDate || ''}
                                max={new Date().toISOString().split('T')[0]}
                                required
                                onChange={(e) => {
                                  const selectedDate = e.target.value
                                  const today = new Date().toISOString().split('T')[0]

                                  if (selectedDate && selectedDate > today) {
                                    openNotify('Lỗi', 'Ngày sản xuất phải trước ngày hiện tại', 'error')
                                    return
                                  }

                                  handleLotInfoChange(product.id, 'manufacturingDate', selectedDate)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                            <td className="px-3 py-4">
                              <input
                                type="date"
                                value={product.expiryDate || ''}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                onChange={(e) => {
                                  const selectedDate = e.target.value
                                  const today = new Date().toISOString().split('T')[0]

                                  if (selectedDate && selectedDate <= today) {
                                    openNotify('Lỗi', 'Hạn sử dụng phải sau ngày hiện tại', 'error')
                                    return
                                  }

                                  handleLotInfoChange(product.id, 'expiryDate', selectedDate)
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                            <td className="px-3 py-4">
                              <input
                                type="text"
                                value={product.supplierName || ''}
                                onChange={(e) => handleLotInfoChange(product.id, 'supplierName', e.target.value)}
                                placeholder="Tên NCC"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Notification Modal */}
      {notify.open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeNotify} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className={`text-lg font-semibold ${notify.type === 'success' ? 'text-green-900' : notify.type === 'error' ? 'text-red-900' : 'text-blue-900'}`}>
                  {notify.title}
                </h3>
                <button onClick={closeNotify} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <p className={`text-sm ${notify.type === 'success' ? 'text-green-700' : notify.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
                  {notify.message}
                </p>
              </div>
              <div className="flex justify-end px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={closeNotify}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    notify.type === 'success'
                      ? 'bg-green-600 hover:bg-green-700'
                      : notify.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryImportExportCreate
