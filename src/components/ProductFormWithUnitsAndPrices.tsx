import { useState, useEffect } from 'react'
import { ProductService } from '@/services/productService'
import type { Product, ProductCategory } from '@/services/productService'

interface ProductFormWithUnitsAndPricesProps {
  product?: Product | null
  categories: ProductCategory[]
  onSubmit: (productData: any) => void
  onCancel: () => void
  isLoading?: boolean
}

const ProductFormWithUnitsAndPrices = ({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading = false
}: ProductFormWithUnitsAndPricesProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 1,
    image_url: '',
    expiration_date: '',
    active: 1,
  })

  const [allUnits, setAllUnits] = useState<Array<{ id: number; name: string; isDefault?: boolean }>>([])
  const [productUnits, setProductUnits] = useState<Array<{
    id: number;
    unitId: number;
    unitName: string;
    conversionFactor: number;
    isDefault: boolean;
    barcodeCode: string;
    barcodeType: string;
    prices: Array<{
      price: number;
      validFrom: string;
      validTo: string;
    }>;
  }>>([])

  const [newUnitId, setNewUnitId] = useState<number | ''>('')
  const [newUnitCF, setNewUnitCF] = useState<number>(1)
  const [newUnitBarcode, setNewUnitBarcode] = useState<string>('')
  const [newUnitBarcodeType, setNewUnitBarcodeType] = useState<string>('EAN13')
  const [newUnitIsDefault, setNewUnitIsDefault] = useState<boolean>(false)

  // Price form for new units
  const [newUnitPrice, setNewUnitPrice] = useState<string>('')
  const [newUnitPriceValidFrom, setNewUnitPriceValidFrom] = useState<string>('')
  const [newUnitPriceValidTo, setNewUnitPriceValidTo] = useState<string>('')

  // Price modal states
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedUnitForPriceModal, setSelectedUnitForPriceModal] = useState<number | null>(null)
  const [priceModalData, setPriceModalData] = useState({
    price: '',
    validFrom: '',
    validTo: ''
  })

  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // (Removed) Bottom price management states

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: (product as any).categoryId || (product as any).category_id,
        image_url: (product as any).imageUrl || (product as any).image_url || '',
        expiration_date: (product as any).expirationDate || (product as any).expiration_date || '',
        active: (product as any).active ? 1 : 0,
      })
      setImagePreview((product as any).imageUrl || (product as any).image_url || '')

      // Load product units
      // Filter out backend auto-created base unit (commonly unitId=1, conversionFactor=1, isDefault=1)
      const rawUnits = product.productUnits || []
      const hasMultipleUnits = rawUnits.length > 1
      const filteredUnits = (hasMultipleUnits ? rawUnits.filter((u: any) => !(u.unitId === 1 && (u.isDefault === true || u.isDefault === 1) && (u.conversionFactor === 1 || u.conversion_rate === 1))) : rawUnits)
        // Hide backend auto unit named "Lon" if present
        .filter((u: any) => String(u.unitName || '').toLowerCase() !== 'lon')

      const baseUnits = filteredUnits.map(u => ({
        id: u.id,
        unitId: u.unitId,
        unitName: u.unitName,
        conversionFactor: u.conversionFactor,
        isDefault: !!u.isDefault,
        barcodeCode: '',
        barcodeType: 'EAN13',
        prices: [] as Array<{ price: number; validFrom: string; validTo: string; isNew?: boolean }>
      }))
      setProductUnits(baseUnits)

      // Enrich with existing barcode and price history
      ;(async () => {
        try {
          const enriched = await Promise.all(baseUnits.map(async (u) => {
            let barcodeCode = u.barcodeCode
            let barcodeType = u.barcodeType
            try {
              const { BarcodeService } = await import('@/services/barcodeService')
              const barcodes = await BarcodeService.getBarcodesByProductUnit(u.id)
              if (Array.isArray(barcodes) && barcodes.length > 0) {
                barcodeCode = barcodes[0].code || ''
                barcodeType = barcodes[0].type || 'EAN13'
              }
              if (!barcodeCode) {
                const barcodes2 = await BarcodeService.getBarcodesByProductAndUnit(product.id!, u.id)
                if (Array.isArray(barcodes2) && barcodes2.length > 0) {
                  barcodeCode = barcodes2[0].code || ''
                  barcodeType = barcodes2[0].type || 'EAN13'
                }
              }
            } catch {}

            let prices: Array<{ price: number; validFrom: string; validTo: string }> = []
            try {
              const history = await ProductService.getUnitPriceHistory(product.id!, u.id)
              if (Array.isArray(history)) {
                prices = history.map((p: any) => ({
                  price: Number(p.price),
                  validFrom: p.timeStart || p.validFrom || '',
                  validTo: p.timeEnd || p.validTo || '',
                  isNew: false
                }))
              }
            } catch {}

            return { ...u, barcodeCode, barcodeType, prices }
          }))
          setProductUnits(enriched)
        } catch {}
      })()
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: 1,
        image_url: '',
        expiration_date: '',
        active: 1,
      })
      setImagePreview('')
      setProductUnits([])
    }
  }, [product])

  useEffect(() => {
    // Load all units for selection
    ProductService.getUnits()
      .then((res: any[]) => {
        const arr = (res || [])
        setAllUnits(arr)
      })
      .catch(() => { setAllUnits([]) })
  }, [])

  // (Removed) Bottom price management effects

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' || name === 'active' ? Number(value) : value
    }))
  }

  const addUnit = () => {
    if (!newUnitId) return

    const selectedUnit = allUnits.find(u => u.id === Number(newUnitId))
    if (!selectedUnit) return

    // Nếu đây là đơn vị đầu tiên và chưa có đơn vị mặc định nào, tự động đặt làm mặc định
    const isFirstUnit = productUnits.length === 0
    const shouldBeDefault = newUnitIsDefault || (isFirstUnit && !productUnits.some(u => u.isDefault))

    // Tạo danh sách giá nếu có
    const prices = []
    if (newUnitPrice && newUnitPriceValidFrom) {
      prices.push({
        price: Number(newUnitPrice),
        validFrom: newUnitPriceValidFrom,
        validTo: newUnitPriceValidTo || ''
      })
    }

    const newUnit = {
      id: Date.now(), // temporary ID
      unitId: Number(newUnitId),
      unitName: selectedUnit.name,
      conversionFactor: newUnitCF,
      isDefault: shouldBeDefault,
      barcodeCode: newUnitBarcode,
      barcodeType: newUnitBarcodeType,
      prices: prices
    }

    setProductUnits(prev => [...prev, newUnit])

    // Reset form
    setNewUnitId('')
    setNewUnitCF(1)
    setNewUnitBarcode('')
    setNewUnitBarcodeType('EAN13')
    setNewUnitIsDefault(false)
    setNewUnitPrice('')
    setNewUnitPriceValidFrom('')
    setNewUnitPriceValidTo('')
  }

  const removeUnit = (unitId: number) => {
    setProductUnits(prev => prev.filter(u => u.id !== unitId))
  }

  const updateUnitConversionFactor = (unitId: number, conversionFactor: number) => {
    setProductUnits(prev => prev.map(u =>
      u.id === unitId ? { ...u, conversionFactor } : u
    ))
  }

  const updateUnitBarcode = (unitId: number, barcodeCode: string, barcodeType: string) => {
    setProductUnits(prev => prev.map(u =>
      u.id === unitId ? { ...u, barcodeCode, barcodeType } : u
    ))
  }

  const setDefaultUnit = (unitId: number) => {
    setProductUnits(prev => prev.map(u => ({
      ...u,
      isDefault: u.id === unitId
    })))
  }

  const addPriceToUnit = (unitId: number, price: number, validFrom: string, validTo: string = '') => {
    setProductUnits(prev => prev.map(u =>
      u.id === unitId
        ? { ...u, prices: [...u.prices, { price, validFrom, validTo, isNew: true }] }
        : u
    ))
  }

  const removePriceFromUnit = (unitId: number, priceIndex: number) => {
    setProductUnits(prev => prev.map(u =>
      u.id === unitId
        ? { ...u, prices: u.prices.filter((_, index) => index !== priceIndex) }
        : u
    ))
  }

  const openPriceModal = (unitId: number) => {
    setSelectedUnitForPriceModal(unitId)
    setPriceModalData({ price: '', validFrom: '', validTo: '' })
    setShowPriceModal(true)
  }

  const closePriceModal = () => {
    setShowPriceModal(false)
    setSelectedUnitForPriceModal(null)
    setPriceModalData({ price: '', validFrom: '', validTo: '' })
  }

  const handleAddPrice = () => {
    if (!selectedUnitForPriceModal || !priceModalData.price || !priceModalData.validFrom) {
      // Validation sẽ được hiển thị qua UI, không dùng alert
      return
    }

    addPriceToUnit(
      selectedUnitForPriceModal,
      Number(priceModalData.price),
      priceModalData.validFrom,
      priceModalData.validTo
    )
    closePriceModal()
  }

  // (Removed) Bottom price management helpers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm')
      return
    }

    const productData = {
      name: formData.name,
      description: formData.description,
      expirationDate: formData.expiration_date || undefined,
      categoryId: formData.category_id,
      active: formData.active === 1,
    }

    try {
      let createdProduct

      // Handle image upload
      if (imageFile) {
        try {
          if (product && product.id) {
            await ProductService.updateProductImage(product.id, imageFile)
            createdProduct = product
          } else {
            createdProduct = await ProductService.createProductWithImage(productData as any, imageFile)
          }
        } catch (err) {
          // fallback to regular creation
          createdProduct = await ProductService.createProduct(productData)
        }
      } else {
        // Regular creation without image
        if (product && product.id) {
          createdProduct = await ProductService.updateProduct(product.id, productData)
        } else {
          createdProduct = await ProductService.createProduct(productData)
        }
      }

      // Add product units if any
      if (productUnits.length > 0 && createdProduct?.id) {
        // Before adding our units, ensure backend auto-created unit is removed if present
        try {
          const updatedProduct = await ProductService.getProductById(createdProduct.id)
          const autoUnit = (updatedProduct.productUnits || []).find((u: any) =>
            u && (u.unitId === 1) && (u.conversionFactor === 1 || u.conversion_rate === 1)
          )
          if (autoUnit?.id) {
            try {
              await ProductService.deleteProductUnitById(autoUnit.id)
            } catch {
              // ignore if delete fails; we'll still add ours
            }
          }
        } catch {
          // ignore
        }
        // Decide add vs update when editing
        const serverUnits = product?.id ? ((await ProductService.getProductById(createdProduct.id)).productUnits || []) : []
        const serverUnitIdByUomId = new Map<number, number>()
        for (const su of serverUnits) serverUnitIdByUomId.set((su as any).unitId, (su as any).id)

        for (const unit of productUnits) {
          try {
            let addUnitResult: any = null
            let productUnitId: number | undefined = serverUnitIdByUomId.get(unit.unitId)

            if (product && product.id && productUnitId) {
              // Update existing unit (use backend-supported route with productId)
              await ProductService.updateProductUnit(createdProduct.id, productUnitId, {
                conversionFactor: unit.conversionFactor,
                isDefault: unit.isDefault,
              })
            } else {
              // Add product unit
              addUnitResult = await ProductService.addProductUnit(createdProduct.id, {
                unitId: unit.unitId,
                conversionFactor: unit.conversionFactor,
                isDefault: unit.isDefault,
              })
            }

            // Try to get productUnit ID from the result first
            if (!productUnitId) {
              productUnitId = (addUnitResult as any)?.id || (addUnitResult as any)?.productUnitId
            }

            // If not found in result, get from updated product
            if (!productUnitId) {
              const updatedProduct = await ProductService.getProductById(createdProduct.id)
              const productUnit = updatedProduct.productUnits?.find((pu: any) => pu.unitId === unit.unitId)
              productUnitId = productUnit?.id
            }

            if (productUnitId) {
              // Upsert barcode: delete existing then add if provided
              try {
                const { BarcodeService } = await import('@/services/barcodeService')
                const existing = await BarcodeService.getBarcodesByProductUnit(productUnitId)
                if (Array.isArray(existing)) {
                  for (const b of existing) { try { await BarcodeService.deleteBarcode(b.id) } catch {} }
                }
                if (unit.barcodeCode && unit.barcodeCode.trim()) {
                  await BarcodeService.addBarcode(productUnitId, unit.barcodeCode.trim(), unit.barcodeType)
                }
              } catch (barcodeErr) {
                console.warn('Failed to upsert barcode:', barcodeErr)
              }

              // Add prices if any (only the newly added in edit mode)
              if (unit.prices.length > 0) {
                try {
                  // Find or create price header once per unit
                  const normalize = (dt?: string) => {
                    if (!dt) return undefined as unknown as string
                    return /:\d{2}$/.test(dt) ? `${dt}:00` : dt
                  }

                  // Try reuse existing header
                  let headerId: number | undefined
                  try {
                    const existingHeaders = await ProductService.getPriceHeaders(createdProduct.id, productUnitId)
                    if (Array.isArray(existingHeaders) && existingHeaders.length > 0) {
                      // Prefer an active header; fallback to the first
                      const activeHeader = existingHeaders.find(h => (h as any).active === true)
                      headerId = (activeHeader ?? existingHeaders[0]).id
                    }
                  } catch {}

                  // If none, create new header
                  if (!headerId) {
                    try {
                      const createdHeader = await ProductService.createPriceHeader(createdProduct.id, productUnitId, {
                        name: `Bảng giá ${unit.unitName}`,
                        description: `Bảng giá cho đơn vị ${unit.unitName}`,
                        timeStart: undefined,
                        timeEnd: undefined,
                        active: true
                      })
                      headerId = createdHeader?.id
                    } catch (createHeaderErr) {
                      // As a fallback, try fetch again (header may already exist with same name)
                      try {
                        const existingHeaders = await ProductService.getPriceHeaders(createdProduct.id, productUnitId)
                        if (Array.isArray(existingHeaders) && existingHeaders.length > 0) {
                          const activeHeader = existingHeaders.find(h => (h as any).active === true)
                          headerId = (activeHeader ?? existingHeaders[0]).id
                        }
                      } catch {}
                      if (!headerId) throw createHeaderErr
                    }
                  }

                  if (headerId) {
                    for (const price of unit.prices.filter((p: any) => p.isNew !== false)) {
                      const timeStart = normalize(price.validFrom)
                      const timeEnd = price.validTo ? normalize(price.validTo) : undefined
                      try {
                        await ProductService.addUnitPriceWithHeader(createdProduct.id, productUnitId, {
                          priceHeaderId: headerId,
                          price: price.price,
                          timeStart,
                          timeEnd
                        })
                      } catch {
                        await ProductService.addPriceUnderHeader(createdProduct.id, headerId, {
                          price: price.price,
                          timeStart,
                          timeEnd
                        })
                      }
                    }
                  }
                } catch (priceErr) {
                  console.error('Failed to add prices:', priceErr)
                }
              }
            }
          } catch (unitErr) {
            console.warn('Failed to add unit:', unitErr)
          }
        }

        // Cleanup: remove any product units on server that user didn't submit (covers BE auto-created unit)
        try {
          const refreshed = await ProductService.getProductById(createdProduct.id)
          const submittedUnitIds = new Set(productUnits.map(u => u.unitId))
          const serverUnits = (refreshed.productUnits || [])
          for (const srv of serverUnits) {
            const srvUnitId = (srv as any).unitId
            if (!submittedUnitIds.has(srvUnitId)) {
              try { await ProductService.deleteProductUnit(createdProduct.id, srv.id) } catch {}
            }
          }
        } catch {}

        // Ensure correct default unit on server (some backends ignore isDefault during creation)
        try {
          const defaultLocal = productUnits.find(u => u.isDefault) || productUnits[0]
          if (defaultLocal) {
            try {
              await ProductService.makeDefaultProductUnit(createdProduct.id, defaultLocal.unitId)
            } catch {}
          }
        } catch {}
      }

      // Return the created product
      onSubmit(createdProduct)

      // Show success message
      if (productUnits.length > 0) {
        const totalPrices = productUnits.reduce((sum, unit) => sum + unit.prices.length, 0)
        if (totalPrices > 0) {
          alert(`Sản phẩm đã được tạo thành công với ${productUnits.length} đơn vị và ${totalPrices} giá!`)
        } else {
          alert(`Sản phẩm đã được tạo thành công với ${productUnits.length} đơn vị!`)
        }
      } else {
        alert('Sản phẩm đã được tạo thành công!')
      }
    } catch (error) {
      console.error('Error creating/updating product:', error)
      alert('Có lỗi xảy ra khi lưu sản phẩm')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tên sản phẩm */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sản phẩm *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nhập tên sản phẩm"
              required
            />
          </div>

          {/* Mô tả */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nhập mô tả sản phẩm"
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hình ảnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh sản phẩm
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="mb-2 h-20 w-20 object-cover rounded" />
            )}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    setImageFile(file)
                    const reader = new FileReader()
                    reader.onload = () => setImagePreview(String(reader.result))
                    reader.readAsDataURL(file)
                  } catch (err) {
                    alert('Tải ảnh thất bại')
                  } finally {
                    setUploading(false)
                  }
                }}
                className="block w-full text-sm text-gray-700"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{uploading ? 'Đang xử lý ảnh...' : 'Chọn ảnh từ máy tính'}</p>
          </div>

          {/* Hạn sử dụng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hạn sử dụng
            </label>
            <input
              type="date"
              name="expiration_date"
              value={formData.expiration_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              name="active"
              value={formData.active}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={1}>Hoạt động</option>
              <option value={0}>Không hoạt động</option>
            </select>
          </div>
        </div>

        {/* Đơn vị tính */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Đơn vị tính</h3>
          {!product && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                💡 <strong>Lưu ý:</strong> Bạn có thể thêm nhiều đơn vị tính cho sản phẩm.
                Đơn vị đầu tiên sẽ được đặt làm mặc định nếu không chọn đơn vị khác.
              </p>
            </div>
          )}

          {/* Thêm đơn vị mới */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Thêm đơn vị mới</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Đơn vị</label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {allUnits
                    .filter(u => !productUnits.some(pu => pu.unitId === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hệ số quy đổi</label>
                <input
                  type="number"
                  min="1"
                  value={newUnitCF}
                  onChange={(e) => setNewUnitCF(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
                <input
                  type="text"
                  value={newUnitBarcode}
                  onChange={(e) => setNewUnitBarcode(e.target.value)}
                  placeholder="VD: 8938505974xxx"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addUnit}
                  disabled={!newUnitId}
                  className="w-full px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Giá cho đơn vị mới */}
            <div className="mt-3 p-3 bg-white rounded border">
              <h5 className="text-xs font-medium text-gray-700 mb-2">💰 Giá cho đơn vị này (tùy chọn)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    placeholder="Nhập giá"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Hiệu lực từ</label>
                  <input
                    type="datetime-local"
                    value={newUnitPriceValidFrom}
                    onChange={(e) => setNewUnitPriceValidFrom(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Đến (tùy chọn)</label>
                  <input
                    type="datetime-local"
                    value={newUnitPriceValidTo}
                    onChange={(e) => setNewUnitPriceValidTo(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại barcode</label>
                <select
                  value={newUnitBarcodeType}
                  onChange={(e) => setNewUnitBarcodeType(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="EAN13">EAN13</option>
                  <option value="BARCODE">BARCODE</option>
                  <option value="QR_CODE">QR_CODE</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newUnitIsDefault"
                  checked={newUnitIsDefault}
                  onChange={(e) => setNewUnitIsDefault(e.target.checked)}
                  disabled={productUnits.some(u => u.isDefault)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="newUnitIsDefault" className="text-xs text-gray-600">
                  Đặt làm mặc định {productUnits.some(u => u.isDefault) ? '(đã có mặc định)' : ''}
                </label>
              </div>
            </div>
          </div>

          {/* Danh sách đơn vị hiện có */}
          {productUnits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Đơn vị đã thêm</h4>
              {productUnits.map((unit) => (
                <div key={unit.id} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{unit.unitName}</span>
                      <span className="text-xs text-gray-500">Hệ số: {unit.conversionFactor}</span>
                      {unit.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">Mặc định</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!unit.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultUnit(unit.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Đặt mặc định
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeUnit(unit.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {/* Barcode editor */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <input
                      type="text"
                      value={unit.barcodeCode}
                      onChange={(e) => updateUnitBarcode(unit.id, e.target.value, unit.barcodeType)}
                      placeholder="Barcode"
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <select
                      value={unit.barcodeType}
                      onChange={(e) => updateUnitBarcode(unit.id, unit.barcodeCode, e.target.value)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="EAN13">EAN13</option>
                      <option value="BARCODE">BARCODE</option>
                      <option value="QR_CODE">QR_CODE</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={unit.conversionFactor}
                      onChange={(e) => updateUnitConversionFactor(unit.id, Number(e.target.value))}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Giá cho đơn vị này */}
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-xs font-medium text-gray-700">💰 Giá cho đơn vị này</h6>
                      <button
                        type="button"
                        onClick={() => openPriceModal(unit.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        + Thêm giá
                      </button>
                    </div>

                    {unit.prices.length > 0 ? (
                      <div className="space-y-1">
                        {unit.prices.map((price, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="text-xs">
                              <span className="font-medium">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price.price)}
                              </span>
                              <span className="text-gray-500 ml-2">
                                từ {new Date(price.validFrom).toLocaleString('vi-VN')}
                                {price.validTo && ` đến ${new Date(price.validTo).toLocaleString('vi-VN')}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePriceFromUnit(unit.id, index)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Chưa có giá cho đơn vị này</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* (Removed) Bottom price management */}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang lưu...' : (product ? 'Cập nhật' : 'Thêm sản phẩm')}
          </button>
        </div>
      </form>

      {/* Price Modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thêm giá cho đơn vị: {productUnits.find(u => u.id === selectedUnitForPriceModal)?.unitName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VNĐ) *</label>
                <input
                  type="number"
                  min="0"
                  value={priceModalData.price}
                  onChange={(e) => setPriceModalData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Nhập giá"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    !priceModalData.price ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
                  }`}
                />
                {!priceModalData.price && (
                  <p className="mt-1 text-xs text-red-600">Vui lòng nhập giá</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ *</label>
                <input
                  type="datetime-local"
                  value={priceModalData.validFrom}
                  onChange={(e) => setPriceModalData(prev => ({ ...prev, validFrom: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    !priceModalData.validFrom ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
                  }`}
                />
                {!priceModalData.validFrom && (
                  <p className="mt-1 text-xs text-red-600">Vui lòng chọn thời gian hiệu lực</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến (tùy chọn)</label>
                <input
                  type="datetime-local"
                  value={priceModalData.validTo}
                  onChange={(e) => setPriceModalData(prev => ({ ...prev, validTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closePriceModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddPrice}
                disabled={!priceModalData.price || !priceModalData.validFrom}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductFormWithUnitsAndPrices
