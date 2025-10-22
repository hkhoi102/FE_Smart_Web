import { useState, useEffect } from 'react'
import { ProductService } from '@/services/productService'
import type { Product, ProductCategory } from '@/services/productService'

interface ProductFormWithUnitsAndPricesProps {
  product?: Product | null
  categories: ProductCategory[]
  onSubmit: (productData: any) => void
  onCancel: () => void
  isLoading?: boolean
  onUnitStatusChange?: (productId: number, unitId: number, active: boolean) => void
}

const ProductFormWithUnitsAndPrices = ({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  onUnitStatusChange
}: ProductFormWithUnitsAndPricesProps) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '', // Mã sản phẩm chung
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
    active: boolean;
    // productCode removed - using common product code instead
    barcodeCode: string;
    barcodeType: string;
    prices: Array<{
      price: number;
      validFrom: string;
      validTo: string;
      priceHeaderId?: number;
      isNew?: boolean;
    }>;
  }>>([])

  const [newUnitId, setNewUnitId] = useState<number | ''>('')
  const [newUnitCF, setNewUnitCF] = useState<number | ''>(1)
  const [newUnitIsDefault, setNewUnitIsDefault] = useState<boolean>(false)
  // Barcode inputs removed from add-new-unit UI


  // Price modal states (only when editing)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedUnitForPriceModal, setSelectedUnitForPriceModal] = useState<number | null>(null)
  const [priceModalData, setPriceModalData] = useState({
    price: '',
    validFrom: '',
    validTo: ''
  })

  // Price header states (only when editing)
  // Giữ state và setter vì còn dùng ở dưới (tạo header)
  const [unitPriceHeaders, setUnitPriceHeaders] = useState<Map<number, Array<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string }>>>(new Map())
  const [showCreateHeaderModal, setShowCreateHeaderModal] = useState(false)
  const [newHeaderData, setNewHeaderData] = useState({
    name: '',
    description: '',
    timeStart: '',
    timeEnd: ''
  })
  const [selectedHeaderIds, setSelectedHeaderIds] = useState<Map<number, number | ''>>(new Map())
  // Price header selection moved to Price page
  // Legacy states removed from UI (handled in Price page)
  const [selectedHeaderInfos] = useState<Map<number, { name: string; timeStart?: string; timeEnd?: string }>>(new Map())

  // Error handling states
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [showError, setShowError] = useState<boolean>(false)

  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // (Removed) Bottom price management states

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code || '', // Sử dụng mã sản phẩm chung
        description: product.description,
        category_id: (product as any).categoryId || (product as any).category_id,
        image_url: (product as any).imageUrl || (product as any).image_url || '',
        expiration_date: (product as any).expirationDate || (product as any).expiration_date || '',
        active: (product as any).active ? 1 : 0,
      })
      setImagePreview((product as any).imageUrl || (product as any).image_url || '')

      // Load product units
      // Show all units including "Lon" (id=1) when editing
      const rawUnits = product.productUnits || []
      const filteredUnits = rawUnits

      const baseUnits = filteredUnits.map(u => ({
        id: u.id,
        unitId: u.unitId,
        unitName: u.unitName,
        conversionFactor: u.conversionFactor,
        isDefault: !!u.isDefault,
        active: (u as any).active !== undefined ? (u as any).active : true,
        // productCode removed - using common product code
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

            let prices: Array<{ price: number; validFrom: string; validTo: string; priceHeaderId?: number; isNew?: boolean }> = []
            try {
              const history = await ProductService.getUnitPriceHistory(product.id!, u.id)
              if (Array.isArray(history)) {
                prices = history.map((p: any) => ({
                  price: Number(p.price),
                  validFrom: p.timeStart || p.validFrom || '',
                  validTo: p.timeEnd || p.validTo || '',
                  priceHeaderId: p.priceHeaderId,
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
        code: '',
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

  // Load price headers for each product unit when editing
  useEffect(() => {
    if (product && product.id && productUnits.length > 0) {
      const loadHeadersForUnits = async () => {
        // Simplified: initialize empty headers for all units
        const newUnitPriceHeaders = new Map<number, Array<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string }>>()

        for (const unit of productUnits) {
          newUnitPriceHeaders.set(unit.id, [])
        }

        setUnitPriceHeaders(newUnitPriceHeaders)
      }

      loadHeadersForUnits()
    }
  }, [product, productUnits])

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

    // Đảm bảo conversionFactor là số hợp lệ
    const validConversionFactor = typeof newUnitCF === 'number' && newUnitCF > 0 ? newUnitCF : 1

    // Nếu đây là đơn vị đầu tiên và chưa có đơn vị mặc định nào, tự động đặt làm mặc định
    const isFirstUnit = productUnits.length === 0
    const shouldBeDefault = newUnitIsDefault || (isFirstUnit && !productUnits.some(u => u.isDefault))

    const newUnit = {
      id: Date.now(), // temporary ID
      unitId: Number(newUnitId),
      unitName: selectedUnit.name,
      conversionFactor: validConversionFactor,
      isDefault: shouldBeDefault,
      active: true,
      // productCode removed - using common product code
      barcodeCode: '',
      barcodeType: 'EAN13',
      prices: [] // Không thêm giá khi tạo đơn vị mới
    }

    setProductUnits(prev => [...prev, newUnit])

    // Reset form
    setNewUnitId('')
    setNewUnitCF(1)
    setNewUnitIsDefault(false)
    // barcode fields removed
  }

  const toggleUnitStatus = async (unitId: number, currentStatus: boolean) => {
    if (!product?.id) return

    try {
      if (currentStatus) {
        // Tạm dừng
        await ProductService.deactivateProductUnit(product.id, unitId)
        setProductUnits(prev => prev.map(u =>
          u.id === unitId ? { ...u, active: false } : u
        ))
        // Thông báo cho component cha
        onUnitStatusChange?.(product.id, unitId, false)
      } else {
        // Kích hoạt
        await ProductService.activateProductUnit(product.id, unitId)
        setProductUnits(prev => prev.map(u =>
          u.id === unitId ? { ...u, active: true } : u
        ))
        // Thông báo cho component cha
        onUnitStatusChange?.(product.id, unitId, true)
      }
    } catch (error) {
      console.error('Error toggling unit status:', error)
    }
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

  // updateUnitCode removed - using common product code instead

  const setDefaultUnit = (unitId: number) => {
    setProductUnits(prev => prev.map(u => ({
      ...u,
      isDefault: u.id === unitId
    })))
  }

  const removeUnit = (unitId: number) => {
    setProductUnits(prev => prev.filter(u => u.id !== unitId))
  }

  // Header selection handled in Price page
  // noop
  const handleHeaderSelection = (_unitId: number, _headerId: number) => { /* noop */ }

  const addPriceToUnit = (unitId: number, price: number, validFrom: string, validTo: string = '') => {
    const unitSelectedHeaderId = selectedHeaderIds.get(unitId)
    setProductUnits(prev => prev.map(u =>
      u.id === unitId
        ? {
            ...u,
            prices: [...u.prices, {
              price,
              validFrom,
              validTo,
              isNew: true,
              priceHeaderId: unitSelectedHeaderId || undefined
            }]
          }
        : u
    ))
  }

  // Price editing moved out of this modal
  const removePriceFromUnit = (_unitId: number, _priceIndex: number) => { /* noop */ }

  // Price modal moved to Price page
  const openPriceModal = (_unitId: number) => { /* noop */ }

  const closePriceModal = () => {
    setShowPriceModal(false)
    setSelectedUnitForPriceModal(null)
    setPriceModalData({ price: '', validFrom: '', validTo: '' })
  }

  const handleAddPrice = () => {
    // Validation: Kiểm tra đơn vị được chọn
    if (!selectedUnitForPriceModal) {
      showErrorToUser('Vui lòng chọn đơn vị để thêm giá')
      return
    }

    // Validation: Kiểm tra giá
    if (!priceModalData.price || priceModalData.price.trim() === '') {
      showErrorToUser('Vui lòng nhập giá sản phẩm')
      return
    }

    // Validation: Kiểm tra giá phải là số dương
    const priceValue = Number(priceModalData.price)
    if (isNaN(priceValue) || priceValue <= 0) {
      showErrorToUser('Giá sản phẩm phải là số dương')
      return
    }

    // Validation: Kiểm tra thời gian hiệu lực từ
    if (!priceModalData.validFrom || priceModalData.validFrom.trim() === '') {
      showErrorToUser('Vui lòng chọn thời gian hiệu lực từ')
      return
    }

    // Validation: Kiểm tra thời gian hiệu lực đến (nếu có)
    if (priceModalData.validTo && priceModalData.validTo.trim() !== '') {
      const fromDate = new Date(priceModalData.validFrom)
      const toDate = new Date(priceModalData.validTo)

      if (toDate <= fromDate) {
        showErrorToUser('Thời gian hiệu lực đến phải sau thời gian hiệu lực từ')
        return
      }
    }

    // Validation: Kiểm tra bảng giá được chọn cho unit này
    const unitSelectedHeaderId = selectedHeaderIds.get(selectedUnitForPriceModal)
    if (!unitSelectedHeaderId) {
      showErrorToUser('Vui lòng chọn bảng giá trước khi thêm giá')
      return
    }

    // Nếu tất cả validation đều pass, thêm giá
    addPriceToUnit(
      selectedUnitForPriceModal,
      priceValue,
      priceModalData.validFrom,
      priceModalData.validTo
    )
    closePriceModal()
  }

  // Creating headers is handled in Price page
  const openCreateHeaderModal = (_unitId?: number) => { /* noop */ }

  const closeCreateHeaderModal = () => {
    setShowCreateHeaderModal(false)
    setNewHeaderData({ name: '', description: '', timeStart: '', timeEnd: '' })
  }

  const showErrorToUser = (message: string) => {
    setErrorMessage(message)
    setShowError(true)
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowError(false)
      setErrorMessage('')
    }, 5000)
  }

  const handleCreateHeader = async () => {
    // Validation: Kiểm tra sản phẩm
    if (!product) {
      showErrorToUser('Không tìm thấy sản phẩm')
      return
    }

    // Validation: Kiểm tra tên bảng giá
    if (!newHeaderData.name || newHeaderData.name.trim() === '') {
      showErrorToUser('Vui lòng nhập tên bảng giá')
      return
    }

    // Validation: Kiểm tra thời gian hiệu lực (nếu có)
    if (newHeaderData.timeStart && newHeaderData.timeEnd) {
      const startDate = new Date(newHeaderData.timeStart)
      const endDate = new Date(newHeaderData.timeEnd)

      if (endDate <= startDate) {
        showErrorToUser('Thời gian hiệu lực đến phải sau thời gian hiệu lực từ')
        return
      }
    }

    try {
      // Tạo header cho unit được chọn hoặc unit đầu tiên
      const targetUnit = selectedUnitForPriceModal
        ? productUnits.find(u => u.id === selectedUnitForPriceModal)
        : productUnits[0]

      if (targetUnit) {
        const normalize = (dt?: string) => {
          if (!dt || dt.trim() === '') return null

          // Đảm bảo format datetime đúng cho backend
          let normalized = dt.trim()

          console.log('🔍 Normalizing header datetime:', { original: dt, normalized })

          // Nếu chỉ có date (YYYY-MM-DD), thêm time mặc định
          if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            normalized = `${normalized}T00:00:00.000Z`
          }
          // Nếu có date và time từ datetime-local (YYYY-MM-DDTHH:mm)
          else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
            normalized = `${normalized}:00.000Z`
          }
          // Nếu có date và time với seconds (YYYY-MM-DDTHH:mm:ss)
          else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
            normalized = `${normalized}.000Z`
          }
          // Nếu đã có timezone, giữ nguyên
          else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(normalized)) {
            // Đã đúng format, giữ nguyên
          }
          // Nếu có timezone khác, chuyển về UTC
          else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(normalized)) {
            try {
              const date = new Date(normalized)
              normalized = date.toISOString()
            } catch (e) {
              console.error('❌ Error parsing header datetime:', e)
              return null
            }
          }

          console.log('✅ Normalized header datetime:', normalized)
          return normalized
        }

        const headerPayload: any = {
          name: newHeaderData.name,
          description: newHeaderData.description || null,
          active: true
        }

        // Chỉ thêm timeStart nếu có giá trị
        if (newHeaderData.timeStart) {
          headerPayload.timeStart = normalize(newHeaderData.timeStart)
        }

        // Chỉ thêm timeEnd nếu có giá trị
        if (newHeaderData.timeEnd) {
          headerPayload.timeEnd = normalize(newHeaderData.timeEnd)
        }

        const createdHeader = await ProductService.createPriceHeader(product.id, targetUnit.id, headerPayload)

        // Add to headers list for the specific unit
        const newHeader = {
          id: createdHeader.id,
          name: createdHeader.name,
          description: newHeaderData.description,
          timeStart: (createdHeader as any).timeStart,
          timeEnd: (createdHeader as any).timeEnd
        }

        setUnitPriceHeaders(prev => {
          const newMap = new Map(prev)
          const unitHeaders = newMap.get(targetUnit.id) || []
          newMap.set(targetUnit.id, [...unitHeaders, newHeader])
          return newMap
        })

        // Cập nhật selectedHeaderId cho unit cụ thể
        setSelectedHeaderIds(prev => {
          const newMap = new Map(prev)
          newMap.set(targetUnit.id, createdHeader.id)
          return newMap
        })

        // Update selected header info moved to Price page

        closeCreateHeaderModal()
      }
    } catch (error: any) {
      console.error('Failed to create price header:', error)
      const errorMsg = error?.message?.includes('Đã có giá hiệu lực')
        ? 'Đã có bảng giá hiệu lực trong khoảng thời gian này. Vui lòng chọn thời gian khác.'
        : 'Không thể tạo bảng giá mới'
      showErrorToUser(errorMsg)
    }
  }

  // (Removed) Bottom price management helpers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showErrorToUser('Vui lòng nhập tên sản phẩm')
      return
    }

    if (!formData.code.trim()) {
      showErrorToUser('Vui lòng nhập mã sản phẩm')
      return
    }

    // Không ràng buộc giá trong modal Sản phẩm; phần giá xử lý ở trang Giá

    const productData = {
      name: formData.name,
      code: formData.code, // Thêm mã sản phẩm chung
      description: formData.description,
      expirationDate: formData.expiration_date || undefined,
      categoryId: formData.category_id,
      active: formData.active === 1,
    }

    // Biến theo dõi trạng thái xử lý
    let hasErrors = false
    let totalPricesAdded = 0

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
        } catch (err: any) {
          // Chỉ fallback nếu lỗi không phải 400 (trùng mã/tên)
          if (err?.status === 400) {
            throw err // Re-throw lỗi 400 để xử lý ở catch block chính
          }
          // fallback to regular creation chỉ cho lỗi khác (như upload ảnh)
          try {
            createdProduct = await ProductService.createProduct(productData as any)
          } catch (fallbackErr: any) {
            // Nếu fallback cũng lỗi 400, throw lỗi gốc
            if (fallbackErr?.status === 400) {
              throw fallbackErr
            }
            throw err // Throw lỗi gốc nếu fallback lỗi khác
          }
        }
      } else {
        // Regular creation without image
        if (product && product.id) {
          createdProduct = await ProductService.updateProduct(product.id, productData as any)
        } else {
          createdProduct = await ProductService.createProduct(productData as any)
        }
      }

      // Add product units if any
      if (productUnits.length > 0 && createdProduct?.id) {
        // Note: Keep all existing units including "Lon" (id=1) when editing
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
              // Unit code handling removed - using common product code instead
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
              } catch (barcodeErr: any) {
                console.warn('Failed to upsert barcode:', barcodeErr)

                // Xử lý lỗi 400 - trùng mã barcode
                if (barcodeErr?.status === 400) {
                  let errorMessage = 'Có lỗi xảy ra khi lưu barcode'

                  if (barcodeErr?.message) {
                    const message = barcodeErr.message.toLowerCase()
                    console.log('🔍 Barcode error message from backend:', barcodeErr.message)

                    // Kiểm tra trùng mã barcode
                    if (message.includes('barcode') && (message.includes('already exists') || message.includes('đã tồn tại') ||
                        message.includes('duplicate') || message.includes('trùng'))) {
                      errorMessage = 'Mã barcode đã tồn tại. Vui lòng chọn mã khác.'
                    }
                    // Nếu có thông báo cụ thể từ backend, sử dụng nó
                    else if (barcodeErr.message && barcodeErr.message !== 'Failed to add barcode: 400 Bad Request') {
                      errorMessage = barcodeErr.message
                    }
                  }

                  showErrorToUser(errorMessage)
                  return // Dừng xử lý nếu có lỗi barcode
                }
              }

              // Add prices if any (only when editing and user selected header)
              const unitSelectedHeaderId = selectedHeaderIds.get(unit.id)
              console.log('🔍 Debug price processing:', {
                isEditing: !!product,
                unitPrices: unit.prices.length,
                unitSelectedHeaderId,
                productUnitId
              })
              if (product && unit.prices.length > 0 && unitSelectedHeaderId) {
                try {
                  const normalize = (dt?: string) => {
                    if (!dt || dt.trim() === '') return null

                    // Đảm bảo format datetime đúng cho backend
                    let normalized = dt.trim()

                    console.log('🔍 Normalizing datetime:', { original: dt, normalized })

                    // Nếu chỉ có date (YYYY-MM-DD), thêm time mặc định
                    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
                      normalized = `${normalized}T00:00:00.000Z`
                    }
                    // Nếu có date và time từ datetime-local (YYYY-MM-DDTHH:mm)
                    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
                      normalized = `${normalized}:00.000Z`
                    }
                    // Nếu có date và time với seconds (YYYY-MM-DDTHH:mm:ss)
                    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
                      normalized = `${normalized}.000Z`
                    }
                    // Nếu đã có timezone, giữ nguyên
                    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(normalized)) {
                      // Đã đúng format, giữ nguyên
                    }
                    // Nếu có timezone khác, chuyển về UTC
                    else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(normalized)) {
                      try {
                        const date = new Date(normalized)
                        normalized = date.toISOString()
                      } catch (e) {
                        console.error('❌ Error parsing datetime:', e)
                        return null
                      }
                    }

                    console.log('✅ Normalized datetime:', normalized)
                    return normalized
                  }

                  console.log('💰 Adding prices for header ID:', unitSelectedHeaderId)

                  // Validate tất cả giá trước khi gửi API
                  const pricesToAdd = unit.prices.filter((p: any) => p.isNew !== false)

                  // Kiểm tra validation trước
                  for (const price of pricesToAdd) {
                    const timeStart = normalize(price.validFrom)
                    const timeEnd = price.validTo ? normalize(price.validTo) : null

                    // Validation: timeStart là bắt buộc
                    if (!timeStart) {
                      console.error('❌ timeStart is required but was null/empty:', price.validFrom)
                      showErrorToUser('Thời gian hiệu lực từ là bắt buộc cho tất cả giá. Vui lòng kiểm tra lại.')
                      hasErrors = true
                      return // Dừng toàn bộ quá trình
                    }

                    // Validation: timeEnd phải sau timeStart nếu có
                    if (timeEnd && timeStart) {
                      const startDate = new Date(timeStart)
                      const endDate = new Date(timeEnd)
                      if (endDate <= startDate) {
                        console.error('❌ timeEnd must be after timeStart:', { timeStart, timeEnd })
                        showErrorToUser('Thời gian hiệu lực đến phải sau thời gian hiệu lực từ')
                        hasErrors = true
                        return // Dừng toàn bộ quá trình
                      }
                    }
                  }

                  // Nếu validation fail, dừng xử lý
                  if (hasErrors) {
                    return
                  }

                  // Nếu validation pass, gửi tất cả giá
                  let successCount = 0
                  let errorCount = 0

                  for (const price of pricesToAdd) {
                    const timeStart = normalize(price.validFrom)
                    const timeEnd = price.validTo ? normalize(price.validTo) : null

                    // Tạo payload với timeStart bắt buộc
                    const pricePayload: any = {
                      productUnitId: productUnitId,
                      price: price.price,
                      priceHeaderId: unitSelectedHeaderId,
                      active: true,
                      timeStart: timeStart  // Luôn gửi timeStart
                    }

                    // Chỉ thêm timeEnd nếu có giá trị
                    if (timeEnd) {
                      pricePayload.timeEnd = timeEnd
                    }

                    console.log('📊 Adding price:', {
                      pricePayload,
                      originalPrice: price,
                      timeStart: timeStart,
                      timeEnd: timeEnd
                    })

                    try {
                      // Sử dụng API đúng: POST /api/products/{productId}/prices/units/{productUnitId}
                      const result = await ProductService.addPriceForProductUnit(createdProduct.id, productUnitId, pricePayload)
                      console.log('✅ Price added successfully:', result)
                      successCount++
                      totalPricesAdded++
                    } catch (priceErr: any) {
                      console.error('❌ Failed to add price:', priceErr)
                      errorCount++
                      hasErrors = true
                      const errorMsg = priceErr?.message?.includes('Đã có giá hiệu lực')
                        ? 'Đã có giá hiệu lực trong khoảng thời gian này. Vui lòng chọn thời gian khác hoặc cập nhật giá hiện tại.'
                        : 'Không thể thêm giá cho đơn vị này'
                      showErrorToUser(errorMsg)

                      // Nếu có lỗi, dừng quá trình
                      return
                    }
                  }

                  // Chỉ hiển thị thành công nếu tất cả giá đều được thêm thành công
                  if (successCount > 0 && errorCount === 0) {
                    console.log(`✅ Successfully added ${successCount} prices`)
                  }
                } catch (priceErr) {
                  console.error('❌ Failed to add prices:', priceErr)
                  showErrorToUser('Có lỗi xảy ra khi thêm giá. Vui lòng thử lại.')
                  hasErrors = true
                  return // Dừng quá trình
                }
              } else {
                // Không chọn header thì bỏ qua thêm giá trong modal sản phẩm
                console.log('⏭️ Skipping price processing in product modal')
              }
            }
          } catch (unitErr) {
            console.warn('Failed to add unit:', unitErr)
          }
        }

        // Note: Keep all existing units when editing, don't auto-delete any units

        // Note: Default unit is handled during unit creation, no need for additional API call
      }

      // Return the created product
      onSubmit(createdProduct)

      // Chỉ hiển thị thông báo thành công nếu không có lỗi
      if (!hasErrors) {
        // Thông báo thành công sẽ được hiển thị qua modal từ component cha
        console.log('✅ Sản phẩm đã được lưu thành công')
      } else {
        // Nếu có lỗi, không hiển thị thông báo thành công
        console.log('❌ Có lỗi xảy ra, không hiển thị thông báo thành công')
      }
    } catch (error: any) {
      console.error('Error creating/updating product:', error)

      // Xử lý lỗi 400 - trùng mã hoặc tên sản phẩm
      if (error?.status === 400 || error?.response?.status === 400) {
        let errorMessage = 'Có lỗi xảy ra khi lưu sản phẩm'

        // Kiểm tra thông báo lỗi từ backend
        if (error?.message) {
          const message = error.message.toLowerCase()
          console.log('🔍 Error message from backend:', error.message)

          // Kiểm tra trùng mã sản phẩm
          if (message.includes('mã sản phẩm đã tồn tại') || message.includes('product code already exists') ||
              message.includes('code') && (message.includes('already exists') || message.includes('đã tồn tại'))) {
            errorMessage = 'Mã sản phẩm đã tồn tại. Vui lòng chọn mã khác.'
          }
          // Kiểm tra trùng tên sản phẩm
          else if (message.includes('product with name') && message.includes('already exists') ||
                   message.includes('tên') && message.includes('đã tồn tại') ||
                   message.includes('name') && message.includes('already exists')) {
            errorMessage = 'Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác.'
          }
          // Kiểm tra trùng chung
          else if (message.includes('duplicate') || message.includes('trùng') || message.includes('đã tồn tại') ||
                   message.includes('already exists')) {
            errorMessage = 'Thông tin sản phẩm đã tồn tại. Vui lòng kiểm tra lại.'
          }
          // Nếu có thông báo cụ thể từ backend, sử dụng nó
          else if (error.message && error.message !== 'Failed to create product: 400 Bad Request' &&
                   error.message !== 'Failed to update product: 400 Bad Request') {
            errorMessage = error.message
          }
        }

        console.log('📢 Displaying error message:', errorMessage)
        showErrorToUser(errorMessage)
        return
      }

      // Lỗi khác
      showErrorToUser('Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Tên sản phẩm và Mã sản phẩm cùng hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã sản phẩm *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Nhập mã sản phẩm"
                required
              />
            </div>
          </div>

          {/* Ảnh sản phẩm, Danh mục và Trạng thái cùng hàng */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Ảnh sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh sản phẩm
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="mb-2 h-16 w-16 object-cover rounded" />
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

            {/* Danh mục */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                name="active"
                value={formData.active}
                onChange={handleInputChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value={1}>Hoạt động</option>
                <option value={0}>Không hoạt động</option>
              </select>
            </div>
          </div>

          {/* Mô tả */}
          <div>
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
        </div>

        {/* Đơn vị tính */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 inline">
              Đơn vị tính
               {!product && (
                 <span className="text-sm text-blue-600 font-normal ml-2">
                    * <strong>Lưu ý:</strong> Đơn vị đầu tiên sẽ được đặt làm mặc định nếu không chọn đơn vị khác.
                 </span>
               )}
            </h3>
          </div>

          {/* Thêm đơn vị mới */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Thêm đơn vị mới</h4>
            <div className="grid grid-cols-10 gap-3">
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Đơn vị</label>
                <select
                  value={newUnitId}
                  onChange={(e) => setNewUnitId(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Chọn đơn vị</option>
                  {allUnits
                    .filter(u => !productUnits.some(pu => pu.unitId === u.id))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Hệ số quy đổi</label>
                <input
                  type="number"
                  min="1"
                  value={newUnitCF}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      // Cho phép xóa hoàn toàn
                      setNewUnitCF('')
                    } else {
                      // Loại bỏ các số 0 ở đầu và chuyển đổi thành số
                      const cleanValue = parseInt(value, 10)
                      if (!isNaN(cleanValue) && cleanValue > 0) {
                        setNewUnitCF(cleanValue)
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Khi mất focus, đảm bảo có giá trị hợp lệ
                    if (e.target.value === '' || e.target.value === '0') {
                      setNewUnitCF(1)
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="col-span-2 flex items-end">
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

            <div className="mt-2 flex items-center gap-4">
              {/* Barcode type select removed per request */}
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
                  Đơn vị cơ bản {productUnits.some(u => u.isDefault) ? '(đã có)' : ''}
                </label>
              </div>
            </div>
          </div>

          {/* Danh sách đơn vị hiện có */}
          {productUnits.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Đơn vị đã thêm</h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    <div className="col-span-2">Đơn vị</div>
                    <div className="col-span-4">Barcode</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {productUnits.map((unit) => (
                    <div key={unit.id} className={`px-3 py-2 transition-colors ${
                      unit.active ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-75'
                    }`}>
                      <div className="grid grid-cols-6 gap-2 items-center">
                        {/* Đơn vị + Hệ số + Badge */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-xs text-gray-900">{unit.unitName}</span>
                            {unit.isDefault && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Cơ bản</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Hệ số: {unit.conversionFactor}</div>
                        </div>

                        {/* Barcode */}
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={unit.barcodeCode}
                            onChange={(e) => updateUnitBarcode(unit.id, e.target.value, unit.barcodeType)}
                            placeholder="Nhập barcode"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>

                      {/* Status and Action buttons */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">

                        </div>
                        <div className="flex items-center gap-1">
                          {!unit.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultUnit(unit.id)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              Đặt cơ bản
                            </button>
                          )}
                          {product?.id ? (
                            // Sửa sản phẩm: hiển thị nút Tạm dừng/Kích hoạt
                            <button
                              type="button"
                              onClick={() => toggleUnitStatus(unit.id, unit.active)}
                              className={`px-2 py-1 text-xs rounded transition-colors ${
                                unit.active
                                  ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              }`}
                            >
                              {unit.active ? 'Tạm dừng' : 'Kích hoạt'}
                            </button>
                          ) : (
                            // Thêm sản phẩm mới: hiển thị nút Xóa
                            <button
                              type="button"
                              onClick={() => removeUnit(unit.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>


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

      {/* Create Header Modal - chỉ hiển thị khi sửa sản phẩm */}
      {product && showCreateHeaderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo bảng giá mới</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên bảng giá *</label>
                <input
                  type="text"
                  value={newHeaderData.name}
                  onChange={(e) => setNewHeaderData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Bảng giá tháng 12/2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <input
                  type="text"
                  value={newHeaderData.description}
                  onChange={(e) => setNewHeaderData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả bảng giá"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ</label>
                <input
                  type="datetime-local"
                  value={newHeaderData.timeStart}
                  onChange={(e) => setNewHeaderData(prev => ({ ...prev, timeStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực đến</label>
                <input
                  type="datetime-local"
                  value={newHeaderData.timeEnd}
                  onChange={(e) => setNewHeaderData(prev => ({ ...prev, timeEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeCreateHeaderModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateHeader}
                disabled={!newHeaderData.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tạo bảng giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal - chỉ hiển thị khi sửa sản phẩm */}
      {product && showPriceModal && (
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
