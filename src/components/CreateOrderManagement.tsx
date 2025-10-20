import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { OrderApi } from '../services/orderService'
import { ProductService } from '../services/productService'
import Modal from './Modal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface ProductUnit {
  id: number
  productName: string
  unitName: string
  price: number
  stock: number
}

interface Customer {
  id: number
  fullName: string
  phoneNumber: string
  email: string
  address: string
}

interface Promotion {
  id: number
  name: string
  type: string
  discountAmount: number
  minOrderAmount?: number
}

interface OrderItem {
  productUnitId: number
  productName: string
  unitName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

const CreateOrderManagement: React.FC = () => {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<ProductUnit[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([])
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const customerSearchDebounceRef = React.useRef<number | undefined>(undefined)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD')
  const [shippingAddress, setShippingAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [orderPreview, setOrderPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [orderStatus, setOrderStatus] = useState<'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [paymentPolling, setPaymentPolling] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState(false)
  const [orderSummaryForConfirm, setOrderSummaryForConfirm] = useState<any>(null)
  const [pendingCompleteOrderId, setPendingCompleteOrderId] = useState<number | null>(null)
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any>(null)
  const [autoCompleteOnPayment, setAutoCompleteOnPayment] = useState(false)

  // Enrich order details with product/unit names from productUnitId
  const enrichOrderDetails = async (details: Array<any>) => {
    if (!Array.isArray(details)) return []
    const enriched = await Promise.all(details.map(async (d: any) => {
      // Prefer data from current cart if available
      const oi = orderItems.find(oi => oi.productUnitId === d.productUnitId)
      if (oi) return { ...d, productName: oi.productName, unitName: oi.unitName }
      try {
        const unitInfo = await ProductService.getProductUnitById(d.productUnitId)
        return {
          ...d,
          productName: unitInfo?.productName || `PU#${d.productUnitId}`,
          unitName: unitInfo?.unitName || 'Đơn vị'
        }
      } catch {
        return { ...d, productName: `PU#${d.productUnitId}`, unitName: 'Đơn vị' }
      }
    }))
    return enriched
  }

  // Form states for adding products
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [quantityInputs, setQuantityInputs] = useState<{ [key: number]: string }>({})
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const zxingReaderRef = React.useRef<any>(null)
  const barcodeInputRef = React.useRef<HTMLInputElement | null>(null)

  // POS specific states
  const [barcodeInput, setBarcodeInput] = useState('')
  const [quickSearch, setQuickSearch] = useState('')
  const [isPOSMode, setIsPOSMode] = useState(true)

  // POS mode: always walk-in customer, no promotions

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Debounced local search for customer suggestions
  useEffect(() => {
    if (customerSearchDebounceRef.current) {
      window.clearTimeout(customerSearchDebounceRef.current)
    }
    const term = customerSearchTerm.trim().toLowerCase()
    if (!term) {
      setCustomerSuggestions([])
      setShowCustomerSuggestions(false)
      return
    }
    customerSearchDebounceRef.current = window.setTimeout(() => {
      const results = customers.filter(c =>
        (c.fullName || '').toLowerCase().includes(term) ||
        (c.phoneNumber || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term) ||
        (c.address || '').toLowerCase().includes(term)
      ).slice(0, 8)
      setCustomerSuggestions(results)
      setShowCustomerSuggestions(results.length > 0)
    }, 300)
    return () => {
      if (customerSearchDebounceRef.current) {
        window.clearTimeout(customerSearchDebounceRef.current)
      }
    }
  }, [customerSearchTerm, customers])

  // Focus barcode input only on initial mount in POS mode
  useEffect(() => {
    if (isPOSMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [isPOSMode])

  // Auto-start camera scanner when component mounts in POS mode
  useEffect(() => {
    if (isPOSMode) {
      // Delay a bit to ensure component is fully loaded
      const timer = setTimeout(() => {
        console.log('📷 Auto-starting camera scanner...')
        startCameraScanner()
      }, 2000) // Delay 2 seconds to ensure component is ready

      return () => clearTimeout(timer)
    }
  }, []) // Empty dependency array to run only once on mount

  // Monitor camera status and restart if needed
  useEffect(() => {
    if (isPOSMode && showCameraScanner) {
      const checkCameraStatus = setInterval(() => {
        // Check if video element exists and has stream
        if (videoRef.current && !videoRef.current.srcObject) {
          console.log('📷 Camera stream lost, restarting...')
          startCameraScanner()
        }
      }, 5000) // Check every 5 seconds

      return () => clearInterval(checkCameraStatus)
    }
  }, [isPOSMode, showCameraScanner])

  // Gọi API preview khi giỏ hàng thay đổi
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrderPreview()
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
  }, [orderItems])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors

      console.log('🔄 Loading products from API...')

      // Load products from DB
      const productsRes = await ProductService.getProducts(1, 100)
      console.log('📦 Products response:', productsRes)

      const productsData = productsRes?.products || []
      console.log('📋 Products data:', productsData)

      // Convert products to ProductUnit format
      const productUnits: ProductUnit[] = []

      if (Array.isArray(productsData)) {
        console.log('🔍 Processing products data...')
        console.log('📊 Total products from API:', productsData.length)

        productsData.forEach((product: any, index: number) => {
          console.log(`\n📦 Product ${index + 1}:`, {
            id: product.id,
            name: product.name,
            productUnits: product.productUnits,
            categoryId: product.categoryId,
            categoryName: product.categoryName
          })

          // Sử dụng productUnits từ API response
          if (product.productUnits && Array.isArray(product.productUnits) && product.productUnits.length > 0) {
            console.log(`🔧 Product ${index + 1} has ${product.productUnits.length} units`)

            // Lấy tất cả đơn vị tính của sản phẩm từ productUnits
            product.productUnits.forEach((unit: any, unitIndex: number) => {
              console.log(`⚙️ Unit ${unitIndex + 1}:`, {
                id: unit.id,
                unitName: unit.unitName,
                currentPrice: unit.currentPrice,
                availableQuantity: unit.availableQuantity,
                quantity: unit.quantity
              })

              const productUnit = {
                id: unit.id || `${product.id}_${unitIndex}`,
                productName: product.name,
                unitName: unit.unitName || 'cái',
                price: unit.currentPrice || 0,
                stock: unit.availableQuantity || unit.quantity || 0
              }

              console.log(`✅ Adding product unit:`, productUnit)
              productUnits.push(productUnit)
            })
          } else {
            console.log(`⚠️ Product ${index + 1} has no productUnits or empty productUnits array`)
            console.log(`🔍 Product structure:`, Object.keys(product))

            // Fallback: create a default unit if no units exist
            if (product.id && product.name) {
              console.log(`🔄 Creating default unit for product ${index + 1}`)
              const defaultUnit = {
                id: product.id,
                productName: product.name,
                unitName: 'cái',
                price: 0,
                stock: 0
              }
              console.log(`✅ Adding default unit:`, defaultUnit)
              productUnits.push(defaultUnit)
            }
          }
        })

        console.log('\n📊 Final Results:')
        console.log('📊 Total productUnits created:', productUnits.length)
        console.log('📋 All product units:', productUnits)

        // Group by product name to see if we have multiple units per product
        const groupedByProduct = productUnits.reduce((acc: any, unit: any) => {
          if (!acc[unit.productName]) {
            acc[unit.productName] = []
          }
          acc[unit.productName].push(unit)
          return acc
        }, {})

        console.log('📋 Grouped by product name:', groupedByProduct)
      }

      // If no products loaded, use fallback data
      if (productUnits.length === 0) {
        console.log('⚠️ No products loaded, using fallback data')
        const fallbackProducts: ProductUnit[] = [
          { id: 1, productName: 'Táo', unitName: 'kg', price: 50000, stock: 100 },
          { id: 2, productName: 'Táo', unitName: 'thùng', price: 500000, stock: 10 },
          { id: 3, productName: 'Cam', unitName: 'kg', price: 40000, stock: 80 },
          { id: 4, productName: 'Cam', unitName: 'hộp', price: 200000, stock: 20 },
          { id: 5, productName: 'Chuối', unitName: 'nải', price: 25000, stock: 50 },
          { id: 6, productName: 'Chuối', unitName: 'kg', price: 15000, stock: 200 }
        ]
        console.log('📋 Using fallback products with multiple units:', fallbackProducts)
        setProducts(fallbackProducts)
        setError('Không thể tải sản phẩm từ database. Đang sử dụng dữ liệu mẫu.')
      } else {
        console.log('✅ Products loaded successfully:', productUnits.length, 'products')
        setProducts(productUnits)
      }

      // Mock customers for now (will be replaced with actual API later)
      const mockCustomers: Customer[] = [
        { id: 1, fullName: 'Nguyễn Văn A', phoneNumber: '0123456789', email: 'a@example.com', address: '123 Đường ABC' },
        { id: 2, fullName: 'Trần Thị B', phoneNumber: '0987654321', email: 'b@example.com', address: '456 Đường XYZ' }
      ]
      setCustomers(mockCustomers)

      // No promotions for POS
      setPromotions([])
    } catch (err: any) {
      console.error('Error loading data:', err)

      // Use fallback data on error
      const fallbackProducts: ProductUnit[] = [
        { id: 1, productName: 'Táo', unitName: 'kg', price: 50000, stock: 100 },
        { id: 2, productName: 'Cam', unitName: 'kg', price: 40000, stock: 80 },
        { id: 3, productName: 'Chuối', unitName: 'nải', price: 25000, stock: 50 }
      ]
      setProducts(fallbackProducts)

      const mockCustomers: Customer[] = [
        { id: 1, fullName: 'Nguyễn Văn A', phoneNumber: '0123456789', email: 'a@example.com', address: '123 Đường ABC' },
        { id: 2, fullName: 'Trần Thị B', phoneNumber: '0987654321', email: 'b@example.com', address: '456 Đường XYZ' }
      ]
      setCustomers(mockCustomers)
      setPromotions([])

      setError('Không thể tải dữ liệu từ server. Đang sử dụng dữ liệu mẫu để demo.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) return

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    const existingItem = orderItems.find(item => item.productUnitId === selectedProduct)

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity
      setOrderItems(prev => prev.map(item =>
        item.productUnitId === selectedProduct
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
          : item
      ))
      // Update input state
      setQuantityInputs(prev => ({
        ...prev,
        [selectedProduct]: newQuantity.toString()
      }))
    } else {
      // Add new item
      const newItem: OrderItem = {
        productUnitId: selectedProduct,
        productName: product.productName,
        unitName: product.unitName,
        quantity,
        unitPrice: product.price,
        subtotal: quantity * product.price
      }
      setOrderItems(prev => [...prev, newItem])
      // Initialize input state
      setQuantityInputs(prev => ({
        ...prev,
        [selectedProduct]: quantity.toString()
      }))
    }

    // Reset form
    setSelectedProduct('')
    setQuantity(1)
    setShowAddProduct(false)
  }

  // POS Functions
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return

    try {
      setLoading(true)
      console.log('🔍 Searching for barcode:', barcode)

      // Gọi API tìm sản phẩm theo barcode
      const response = await fetch(`${API_BASE_URL}/products/by-code/${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Barcode search result:', data)

        if (data.success && data.data) {
          const product = data.data

          // Lấy đơn vị tính ưu tiên (đơn vị có barcode)
          if (product.productUnits && product.productUnits.length > 0) {
            const priorityUnit = product.productUnits[0] // Đã được sắp xếp ưu tiên

            const productUnit = {
              id: priorityUnit.id,
              productName: product.name,
              unitName: priorityUnit.unitName,
              price: priorityUnit.currentPrice || 0,
              stock: priorityUnit.availableQuantity || priorityUnit.quantity || 0
            }

            console.log('✅ Found product unit:', productUnit)

            // Thêm vào giỏ hàng
            const existingItem = orderItems.find(item => item.productUnitId === productUnit.id)
            if (existingItem) {
              // Update existing item
              setOrderItems(prev => prev.map(item =>
                item.productUnitId === productUnit.id
                  ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
                  : item
              ))
            } else {
              // Add new item
              const newItem: OrderItem = {
                productUnitId: productUnit.id,
                productName: productUnit.productName,
                unitName: productUnit.unitName,
                quantity: 1,
                unitPrice: productUnit.price,
                subtotal: productUnit.price
              }
              setOrderItems(prev => [...prev, newItem])
            }

            setBarcodeInput('')
            setSuccess(`Đã thêm ${productUnit.productName} - ${productUnit.unitName}`)
          } else {
            setError('Sản phẩm không có đơn vị tính')
          }
        } else {
          setError('Không tìm thấy sản phẩm với mã: ' + barcode)
        }
      } else {
        setError('Không tìm thấy sản phẩm với mã: ' + barcode)
      }
    } catch (error) {
      console.error('Error searching barcode:', error)
      setError('Lỗi khi tìm kiếm sản phẩm: ' + barcode)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAdd = (productId: number) => {
    setSelectedProduct(productId)
    setQuantity(1)
    handleAddProduct()
  }


  // Handle barcode scanning from image file
  const handleImageBarcodeScan = async (file: File) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      console.log('📷 Scanning barcode from image:', file.name)

      // Load ZXing library
      const ensure = () => new Promise<void>((resolve, reject) => {
        if ((window as any).ZXing && (window as any).ZXing.BrowserMultiFormatReader) return resolve()
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/@zxing/library@latest'
        s.async = true
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Cannot load ZXing'))
        document.head.appendChild(s)
      })
      await ensure()

      const ZX = (window as any).ZXing
      if (!ZX || !ZX.BrowserMultiFormatReader) {
        throw new Error('ZXing not available')
      }

      // Create image element
      const img = new Image()
      img.onload = async () => {
        try {
          // Create ZXing reader
          const reader = new ZX.BrowserMultiFormatReader()
          const hints = new Map()
          hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [
            ZX.BarcodeFormat.EAN_13,
            ZX.BarcodeFormat.EAN_8,
            ZX.BarcodeFormat.CODE_128,
            ZX.BarcodeFormat.CODE_39,
            ZX.BarcodeFormat.UPC_A,
            ZX.BarcodeFormat.UPC_E,
            ZX.BarcodeFormat.QR_CODE
          ])
          hints.set(ZX.DecodeHintType.TRY_HARDER, true)
          reader.hints = hints

          console.log('📷 Scanning image with ZXing...')

          // Try to decode from image URL
          const result = await reader.decodeFromImageUrl(img.src)

          if (result && result.getText) {
            const text = result.getText()
            console.log('📷 ZXing found barcode from image:', text)
            await handleBarcodeScan(String(text))
          } else {
            setError('Không tìm thấy mã vạch trong hình ảnh')
          }
        } catch (e: any) {
          console.error('📷 Image barcode scan error:', e)
          setError('Không thể quét mã vạch từ hình ảnh: ' + (e?.message || 'Lỗi không xác định'))
        } finally {
          setLoading(false)
        }
      }

      img.onerror = () => {
        setError('Không thể tải hình ảnh')
        setLoading(false)
      }

      // Load image from file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)

    } catch (e: any) {
      console.error('📷 Image barcode scan failed:', e)
      setError('Lỗi khi quét mã vạch từ hình ảnh: ' + (e?.message || 'Lỗi không xác định'))
      setLoading(false)
    }
  }

  // Camera barcode scanning using native BarcodeDetector (Chromium-based browsers)
  const startCameraScanner = async () => {
    try {
      console.log('📷 Starting camera scanner...')
      setError(null)
      setShowCameraScanner(true)

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ camera. Vui lòng sử dụng HTTPS hoặc trình duyệt mới hơn.')
      }

      // Stop any existing streams first
      if (streamRef.current) {
        console.log('📷 Stopping existing stream...')
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear video element completely
      if (videoRef.current) {
        console.log('📷 Clearing video element...')
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.load()
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('📷 Requesting camera access...')
      // Request back camera with better quality for barcode scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Don't call play() here - let ZXing handle it
        console.log('📷 Camera started successfully')
      }

      // Use ZXing for barcode detection
      console.log('📷 Starting ZXing barcode detection...')
      await startZxingFallback()
    } catch (e: any) {
      console.error('📷 Camera error:', e)
      let errorMessage = 'Không thể mở camera: '

      if (e.name === 'NotAllowedError') {
        errorMessage += 'Bị từ chối quyền truy cập camera. Vui lòng cho phép quyền truy cập camera và thử lại.'
      } else if (e.name === 'NotFoundError') {
        errorMessage += 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị.'
      } else if (e.name === 'NotSupportedError') {
        errorMessage += 'Trình duyệt không hỗ trợ camera. Vui lòng sử dụng HTTPS hoặc trình duyệt mới hơn.'
      } else {
        errorMessage += e?.message || 'Lỗi không xác định'
      }

      setError(errorMessage)
      await stopCameraScanner()
    }
  }

  const startZxingFallback = async () => {
    try {
      console.log('📷 Loading ZXing library...')
      // Dynamically load ZXing UMD bundle
      const ensure = () => new Promise<void>((resolve, reject) => {
        if ((window as any).ZXing && (window as any).ZXing.BrowserMultiFormatReader) {
          console.log('📷 ZXing already loaded')
          return resolve()
        }
        console.log('📷 Loading ZXing from CDN...')
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/@zxing/library@latest'
        s.async = true
        s.onload = () => {
          console.log('📷 ZXing loaded successfully')
          resolve()
        }
        s.onerror = () => {
          console.error('📷 Failed to load ZXing')
          reject(new Error('Cannot load ZXing library'))
        }
        document.head.appendChild(s)
      })
      await ensure()

      const ZX = (window as any).ZXing
      if (!ZX || !ZX.BrowserMultiFormatReader) {
        throw new Error('ZXing library not available')
      }

      console.log('📷 Creating ZXing reader...')
      const reader = new ZX.BrowserMultiFormatReader()

      // Configure ZXing with enhanced settings for faster detection
      const hints = new Map()
      hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [
        ZX.BarcodeFormat.EAN_13,
        ZX.BarcodeFormat.EAN_8,
        ZX.BarcodeFormat.CODE_128,
        ZX.BarcodeFormat.CODE_39,
        ZX.BarcodeFormat.UPC_A,
        ZX.BarcodeFormat.UPC_E,
        ZX.BarcodeFormat.QR_CODE,
        ZX.BarcodeFormat.CODE_93,
        ZX.BarcodeFormat.CODABAR,
        ZX.BarcodeFormat.ITF
      ])
      hints.set(ZX.DecodeHintType.TRY_HARDER, true)
      hints.set(ZX.DecodeHintType.CHARACTER_SET, 'UTF-8')
      hints.set(ZX.DecodeHintType.ASSUME_GS1, false)
      hints.set(ZX.DecodeHintType.ALSO_INVERTED, true) // Try inverted barcodes
      reader.hints = hints

      zxingReaderRef.current = reader

      if (!videoRef.current) {
        console.error('📷 Video element not available')
        throw new Error('Video element not available')
      }

      console.log('📷 Waiting for video to be ready...')
      // Wait for video to be ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if video is ready
      if (!videoRef.current || videoRef.current.readyState !== 4) {
        console.log('📷 Video not ready, waiting more...')
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('📷 Starting barcode scanning loop...')
      // Start continuous scanning with video element
      let isScanning = true
      let lastScannedCode = '' // Track last scanned code to avoid duplicates
      let lastScanTime = 0 // Track last scan time

      const scanLoop = async () => {
        try {
          if (!isScanning) {
            console.log('📷 Scanning stopped')
            return
          }

          // Check if video is still ready
          if (!videoRef.current || videoRef.current.readyState !== 4) {
            console.log('📷 Video not ready, waiting...')
            if (isScanning) {
              setTimeout(scanLoop, 200) // Wait longer if video not ready
            }
            return
          }

          // Try to decode barcode
          const result = await reader.decodeFromVideoElement(videoRef.current)
          if (result && result.getText) {
            const text = result.getText()
            const currentTime = Date.now()

            // Avoid scanning the same code within 2 seconds
            if (text === lastScannedCode && (currentTime - lastScanTime) < 2000) {
              console.log('📷 Duplicate code ignored:', text)
              if (isScanning) {
                setTimeout(scanLoop, 100) // Check again in 100ms
              }
              return
            }

            console.log('📷 ZXing found barcode:', text)
            lastScannedCode = text
            lastScanTime = currentTime

            // Chỉ hiển thị mã vạch vào input, không tự động gọi API
            setBarcodeInput(text)
            setSuccess(`Đã quét được mã vạch: ${text}`)

            // Tự động focus vào input để người dùng có thể nhấn Enter
            setTimeout(() => {
              if (barcodeInputRef.current) {
                barcodeInputRef.current.focus()
                console.log('📷 Focused on barcode input')
              }
            }, 100)

            // Reset success message sau 2 giây
            setTimeout(() => {
              setSuccess(null)
            }, 2000)

            // Continue scanning immediately
            if (isScanning) {
              setTimeout(scanLoop, 100) // Continue in 100ms
            }
            return
          }
        } catch (e: any) {
          // Silent error handling for scanning loop
          console.log('📷 Scanning error (normal):', e.message)
        }

        // Continue scanning - faster for quick detection
        if (isScanning) {
          setTimeout(scanLoop, 50) // Scan every 50ms for faster detection
        }
      }

      // Store scanning control
      zxingReaderRef.current = {
        reader,
        stop: () => {
          console.log('📷 Stopping scanning...')
          isScanning = false
        }
      }

      // Start the scanning loop
      console.log('📷 Starting scan loop...')
      scanLoop()

    } catch (e: any) {
      console.error('📷 ZXing error:', e)
      setError('Không thể khởi động barcode scanner: ' + (e?.message || 'Lỗi không xác định'))
    }
  }

  const stopCameraScanner = async () => {
    try {
      // Stop ZXing scanning
      if (zxingReaderRef.current) {
        if (typeof zxingReaderRef.current.stop === 'function') {
          zxingReaderRef.current.stop()
        }
        if (typeof zxingReaderRef.current.reset === 'function') {
          try {
            await zxingReaderRef.current.reset()
          } catch (e) {
            // Silent error handling
          }
        }
        zxingReaderRef.current = null
      }

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
        videoRef.current.load() // Reset video element
      }

      setShowCameraScanner(false)
    } catch (e: any) {
      console.error('📷 Stop camera error:', e)
    }
  }

  // Kiểm tra và refresh token nếu cần
  const checkAndRefreshToken = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.log('❌ No token found')
      return false
    }

    // Kiểm tra token có hết hạn không (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token expired')
        localStorage.removeItem('access_token')
        return false
      }
      console.log('✅ Token is valid')
      return true
    } catch (error) {
      console.log('❌ Invalid token format')
      return false
    }
  }

  // Gọi API order/preview để tính khuyến mãi
  const fetchOrderPreview = async () => {
    if (orderItems.length === 0) {
      setOrderPreview(null)
      return
    }

    try {
      setPreviewLoading(true)
      console.log('🔄 Calling order/preview API...')

      // Kiểm tra token trước khi gọi API
      const isTokenValid = await checkAndRefreshToken()
      if (!isTokenValid) {
        setError('Vui lòng đăng nhập lại để sử dụng tính năng preview.')
        setOrderPreview(null)
        return
      }

      const orderDetails = orderItems.map(item => ({
        productUnitId: item.productUnitId,
        quantity: item.quantity
      }))

      const previewRequest = {
        orderDetails: orderDetails
      }

      // Debug token
      const token = localStorage.getItem('access_token')
      console.log('🔑 Token available:', !!token)
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'null')
      console.log('🌐 API URL:', `${API_BASE_URL}/orders/preview`)
      console.log('📋 Preview request:', previewRequest)

      const response = await fetch(`${API_BASE_URL}/orders/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewRequest)
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Order preview response:', data)
        setOrderPreview(data)
      } else {
        const errorText = await response.text()
        console.error('❌ Order preview failed:', response.status, response.statusText)
        console.error('❌ Error response body:', errorText)
        setOrderPreview(null)

        // Show user-friendly error
        if (response.status === 403) {
          setError('Không có quyền truy cập API preview. Vui lòng kiểm tra đăng nhập.')
        } else if (response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          setError(`Lỗi API preview: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('❌ Error calling order/preview:', error)
      setOrderPreview(null)
      setError('Lỗi kết nối API preview. Vui lòng thử lại.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClearCart = () => {
    setOrderItems([])
    setSelectedCustomer(null)
    setSelectedPromotion(null)
    setOrderNotes('')
    setBarcodeInput('')
    setQuickSearch('')
    setCurrentOrder(null)
    setOrderStatus(null)
    setPaymentInfo(null)
    setShowPaymentModal(false)
    setShowPaymentSuccessModal(false)

    // Clear payment polling
    if (paymentPolling) {
      clearInterval(paymentPolling)
      setPaymentPolling(null)
    }
  }

  // Xử lý workflow sau tạo đơn (dùng cho COD và sau khi chuyển khoản đã xác nhận)
  // markPaid=true: sau khi hoàn tất sẽ gọi API cập nhật payment-status = PAID (dành cho COD)
  const handleCashPaymentWorkflow = async (orderId: number, markPaid: boolean = false) => {
    setTimeout(async () => {
      try {
        console.log('🚀 Starting cash payment workflow...')

        // Bước 1: PENDING → CONFIRMED
        console.log('📋 Step 1: Updating to CONFIRMED...')
        const confirmedResult = await updateOrderStatusAPI(orderId, 'CONFIRMED')
        setOrderStatus('CONFIRMED')
        setCurrentOrder(confirmedResult.data || confirmedResult)
        setSuccess('Đã xác nhận đơn hàng!')

        // Bước 2: CONFIRMED → DELIVERING (xuất kho)
        setTimeout(async () => {
          try {
            console.log('📦 Step 2: Updating to DELIVERING...')
            const deliveringResult = await updateOrderStatusAPI(orderId, 'DELIVERING')
            setOrderStatus('DELIVERING')
            setCurrentOrder(deliveringResult.data || deliveringResult)
            setSuccess('Đã xuất kho! Đơn hàng đang được giao.')

            // Bước 3: DELIVERING → COMPLETED (tự động) và mở in hóa đơn
            setTimeout(async () => {
              try {
                // Lấy chi tiết đơn để in
                let summary: any = null
                try {
                  const detail = await OrderApi.getById(orderId).catch(() => null)
                  summary = detail?.data || detail || null
                  if (summary?.orderDetails && Array.isArray(summary.orderDetails)) {
                    const enriched = await enrichOrderDetails(summary.orderDetails)
                    summary = { ...summary, orderDetails: enriched }
                  }
                } catch {}

                // Chuyển COMPLETED ngay
                const completedResult = await updateOrderStatusAPI(orderId, 'COMPLETED')
                const completed = completedResult.data || completedResult
                setOrderStatus('COMPLETED')
                setCurrentOrder(completed)
                setSuccess('Đơn hàng đã hoàn thành! Giao dịch thành công.')

                // Nếu COD thì cập nhật PAID
                try {
                  if (markPaid) {
                    console.log('💳 Mark COD order as PAID...')
                    await updatePaymentStatus(orderId)
                  }
                } catch (e) {
                  console.error('❌ Failed to update payment status for COD:', e)
                }

                // Mở modal in hóa đơn
                setInvoiceData(summary || completed)
                setShowPrintModal(true)
              } catch (error: any) {
                console.error('❌ Error in step 3 (COMPLETED):', error)
                setError('Lỗi khi hoàn thành đơn hàng: ' + error.message)
              }
            }, 1000)
          } catch (error: any) {
            console.error('❌ Error in step 2 (DELIVERING):', error)
            setError('Lỗi khi xuất kho: ' + error.message)
          }
        }, 1000)
      } catch (error: any) {
        console.error('❌ Error in step 1 (CONFIRMED):', error)
        setError('Lỗi khi xác nhận đơn hàng: ' + error.message)
      }
    }, 1000)
  }

  // Xử lý thanh toán chuyển khoản
  const handleBankTransferPayment = async (orderId: number, amount: number) => {
    try {
      console.log('💳 Creating bank transfer payment for order:', orderId)

      // Tạo payment intent
      const paymentRequest = {
        orderId: orderId,
        amount: amount,
        description: `Thanh toan don hang #${orderId}`,
        bankCode: 'ACB' // Asia Commercial Bank
      }

      const response = await fetch(`${API_BASE_URL}/payments/sepay/intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest)
      })

      if (response.ok) {
        const paymentData = await response.json()
        console.log('✅ Payment intent created:', paymentData)
        setPaymentInfo(paymentData)
        setShowPaymentModal(true)

        // Bắt đầu polling kiểm tra thanh toán
        startPaymentPolling(orderId, paymentData.transferContent, amount)
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to create payment intent:', response.status, errorText)
        setError('Không thể tạo QR thanh toán: ' + response.statusText)
      }
    } catch (error: any) {
      console.error('❌ Error creating payment intent:', error)
      setError('Lỗi khi tạo QR thanh toán: ' + error.message)
    }
  }

  // Bắt đầu polling kiểm tra thanh toán
  const startPaymentPolling = (orderId: number, transferContent: string, amount: number) => {
    console.log('🔄 Starting payment polling for order:', orderId)

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔍 Checking payment status...')

        // Kiểm tra transaction match
        const matchResponse = await fetch(`${API_BASE_URL}/payments/sepay/match?content=${transferContent}&amount=${amount}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }
        })

        if (matchResponse.ok) {
          const matchData = await matchResponse.json()
          console.log('📊 Payment match result:', matchData)

          if (matchData.success) {
            console.log('✅ Payment confirmed!')

            // Dừng polling
            clearInterval(pollInterval)
            setPaymentPolling(null)

            // Đóng modal thanh toán và hiển thị modal thành công
            setShowPaymentModal(false)
            setShowPaymentSuccessModal(true)

            // Cập nhật payment status
            await updatePaymentStatus(orderId)

            // Đợi người dùng đóng modal thành công rồi mới hiển thị xác nhận hoàn thành
            setPendingCompleteOrderId(orderId)
          }
        }
      } catch (error) {
        console.error('❌ Error checking payment status:', error)
      }
    }, 5000) // Poll mỗi 5 giây

    setPaymentPolling(pollInterval)
  }

  // Cập nhật payment status
  const updatePaymentStatus = async (orderId: number) => {
    try {
      console.log('💳 Updating payment status to PAID for order:', orderId)

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: 'PAID' })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Payment status updated:', result)
        setSuccess('Đã xác nhận thanh toán! Đang xử lý đơn hàng...')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to update payment status:', response.status, errorText)
        setError('Không thể cập nhật trạng thái thanh toán')
      }
    } catch (error: any) {
      console.error('❌ Error updating payment status:', error)
      setError('Lỗi khi cập nhật trạng thái thanh toán: ' + error.message)
    }
  }

  // Chuyển trạng thái đơn hàng cho POS (cho auto workflow)
  const updateOrderStatusAPI = async (orderId: number, newStatus: 'CONFIRMED' | 'DELIVERING' | 'COMPLETED') => {
    console.log(`🔄 API Call: Updating order ${orderId} to ${newStatus}`)

    const requestBody = {
      status: newStatus,
      note: `POS: Chuyển trạng thái sang ${newStatus}`,
      warehouseId: 1, // Default warehouse for POS
      stockLocationId: 1 // Default stock location for POS
    }

    console.log('📋 Request body:', requestBody)
    console.log('🌐 API URL:', `${API_BASE_URL}/orders/${orderId}/status`)

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const updatedOrder = await response.json()
      console.log('✅ Order status updated:', updatedOrder)
      return updatedOrder
    } else {
      const errorText = await response.text()
      console.error('❌ Failed to update order status:', response.status, response.statusText)
      console.error('❌ Error response body:', errorText)
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }
  }


  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(quickSearch.toLowerCase()) ||
    product.unitName.toLowerCase().includes(quickSearch.toLowerCase())
  )

  const handleRemoveItem = (productUnitId: number) => {
    setOrderItems(prev => prev.filter(item => item.productUnitId !== productUnitId))
    // Remove input state
    setQuantityInputs(prev => {
      const newState = { ...prev }
      delete newState[productUnitId]
      return newState
    })
  }

  const resetOrderForm = () => {
    // Reset all order-related states to initial values
    setOrderItems([])
    setQuantityInputs({})
    setSelectedCustomer(null)
    setSelectedPromotion(null)
    setPaymentMethod('COD')
    setShippingAddress('')
    setOrderNotes('')
    setCurrentOrder(null)
    setOrderStatus(null)
    setPaymentInfo(null)
    setOrderPreview(null)
    setError(null)
    setSuccess(null)
    setShowCompleteConfirmModal(false)
    setOrderSummaryForConfirm(null)
    setPendingCompleteOrderId(null)
    setShowPaymentSuccessModal(false)
    setShowPaymentMethodModal(false)
    setBarcodeInput('')
    setQuickSearch('')

    // Focus back to barcode input for next order
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  const handleContinueToPayment = () => {
    if (orderItems.length === 0) {
      setError('Vui lòng thêm sản phẩm vào giỏ hàng')
      return
    }
    setShowPaymentMethodModal(true)
  }

  const handleConfirmPaymentMethod = () => {
    // Skip extra OK step: auto-complete after order creation
    setAutoCompleteOnPayment(true)
    setShowPaymentMethodModal(false)
    handleCreateOrder()
  }

  const handleUpdateQuantity = (productUnitId: number, newQuantity: number) => {
    // Only remove if explicitly set to 0 or negative, not if input is empty
    if (newQuantity <= 0) {
      handleRemoveItem(productUnitId)
      return
    }

    setOrderItems(prev => prev.map(item =>
      item.productUnitId === productUnitId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item
    ))

    // Update input state to match the new quantity
    setQuantityInputs(prev => ({
      ...prev,
      [productUnitId]: newQuantity.toString()
    }))
  }

  const handleQuantityInputChange = (productUnitId: number, value: string) => {
    // Always update input state first - this allows typing
    setQuantityInputs(prev => ({
      ...prev,
      [productUnitId]: value
    }))

    // Only update order if value is a valid positive number
    if (value !== '' && !isNaN(Number(value))) {
      const numValue = Number(value)
      if (numValue > 0) {
        // Update order items without updating input state again
        setOrderItems(prev => prev.map(item =>
          item.productUnitId === productUnitId
            ? { ...item, quantity: numValue, subtotal: numValue * item.unitPrice }
            : item
        ))
      }
    }
  }

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0)
    let discountAmount = 0

    // Only apply promotion in regular mode, not POS mode
    if (!isPOSMode && selectedPromotion) {
      if (selectedPromotion.type === 'FIXED') {
        discountAmount = selectedPromotion.discountAmount
      } else if (selectedPromotion.type === 'PERCENTAGE') {
        discountAmount = (subtotal * selectedPromotion.discountAmount) / 100
      }
    }

    const total = subtotal - discountAmount
    return { subtotal, discountAmount, total }
  }

  const handleCreateOrder = async () => {
    if (!isPOSMode && !selectedCustomer) {
      setError('Vui lòng chọn khách hàng')
      return
    }

    if (orderItems.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const orderDetails = orderItems.map(item => ({
        productUnitId: item.productUnitId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))

      const orderData = {
        orderDetails,
        promotionAppliedId: selectedPromotion?.id,
        paymentMethod,
        shippingAddress: shippingAddress || selectedCustomer?.address || ''
      }

      const result = await OrderApi.createOrder(orderData)

      // Lưu thông tin đơn hàng và trạng thái cho POS
      if (isPOSMode) {
        setCurrentOrder(result)
        setOrderStatus('PENDING')

        if (autoCompleteOnPayment) {
          try {
            // Immediately complete the order and open print modal
            const completedResult = await updateOrderStatusAPI(result.id, 'COMPLETED')
            const completed = completedResult.data || completedResult
            setOrderStatus('COMPLETED')
            try { await updatePaymentStatus(result.id) } catch (e) { console.error('❌ Failed to mark payment PAID on complete:', e) }
            // Ensure names are present for invoice
            let inv = completed
            if (inv?.orderDetails && Array.isArray(inv.orderDetails)) {
              inv = { ...inv, orderDetails: await enrichOrderDetails(inv.orderDetails) }
            }
            setInvoiceData(inv)
            setShowPrintModal(true)
            setSuccess(`Đơn hàng #${result.id} đã hoàn thành!`)
          } finally {
            setAutoCompleteOnPayment(false)
          }
        } else {
          // Xử lý thanh toán theo phương thức đã chọn (luồng cũ)
          if (paymentMethod === 'BANK_TRANSFER') {
            setSuccess(`Đơn hàng #${result.id} đã tạo! Vui lòng quét QR để thanh toán.`)
            await handleBankTransferPayment(result.id, total)
          } else {
            setSuccess(`Đơn hàng #${result.id} đã tạo!`)
            await handleCashPaymentWorkflow(result.id, true)
          }
        }
      } else {
        setSuccess(`Đơn hàng #${result.id} đã được tạo thành công!`)

        // Reset form cho mode thường
        setSelectedCustomer(null)
        setOrderItems([])
        setSelectedPromotion(null)
        setShippingAddress('')
        setOrderNotes('')
        setPaymentMethod('COD')
        setBarcodeInput('')
        setQuickSearch('')
      }

    } catch (err: any) {
      setError('Tạo đơn hàng thất bại: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, discountAmount, total } = calculateTotals()
  const computedSubtotal = orderPreview?.data?.totalOriginalAmount ?? subtotal
  const computedDiscount = orderPreview?.data?.totalDiscountAmount ?? discountAmount ?? 0
  const shippingFee = orderPreview?.data?.shippingFee ?? 0
  const vatAmount = orderPreview?.data?.vatAmount ?? 0
  const finalTotal = orderPreview?.data?.totalFinalAmount ?? (computedSubtotal - computedDiscount + shippingFee + vatAmount)
  const storeName = import.meta.env.VITE_STORE_NAME || '71 MARKET'
  const storeAddress = import.meta.env.VITE_STORE_ADDRESS || '—'
  const storeTaxId = import.meta.env.VITE_STORE_TAX_ID || ''

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getBankName = (bankCode: string) => {
    const bankNames: { [key: string]: string } = {
      'ACB': 'Ngân hàng TMCP Á Châu (ACB)',
      'VCB': 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
      'TCB': 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)',
      'BIDV': 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
      'VIB': 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)',
      'VPB': 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
      'MSB': 'Ngân hàng TMCP Hàng Hải (MSB)',
      'HDB': 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)',
      'TPB': 'Ngân hàng TMCP Tiên Phong (TPBank)',
      'STB': 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)'
    }
    return bankNames[bankCode] || bankCode
  }

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Bán hàng tại quầy</h1>
            <p className="text-sm text-gray-600">Hệ thống bán hàng POS - Point of Sale</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPOSMode(!isPOSMode)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                isPOSMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isPOSMode ? 'Chế độ POS' : 'Chế độ thường'}
            </button>
            <button
              onClick={handleClearCart}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
            >
              Xóa giỏ hàng
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="text-red-500 text-lg mr-3">⚠️</div>
              <div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={fetchInitialData}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Thử lại
                </button>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-green-500 text-lg mr-3">✅</div>
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Details */}
        <div className="space-y-6 relative">
          {/* POS Quick Actions */}
          {isPOSMode && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h2>

              {/* Barcode Scanner */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quét mã vạch / Tìm kiếm sản phẩm
                </label>
                <div className="grid grid-cols-10 gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan(barcodeInput)}
                    placeholder="Quét mã vạch"
                    className="col-span-7 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={startCameraScanner}
                    className="col-span-3 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                  >
                    Quét
                  </button>
                </div>

              </div>

              {/* Quick Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quick Product Grid */}
              {quickSearch && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 8).map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleQuickAdd(product.id)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                      <div className="text-xs text-gray-500 mb-1">
                        Đơn vị: {product.unitName}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {formatCurrency(product.price)}
                      </div>
                      {product.stock > 0 && (
                        <div className="text-xs text-green-600">
                          Còn: {product.stock} {product.unitName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Sản phẩm</h2>
            </div>


            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có sản phẩm nào. Sử dụng tìm kiếm bên trên để thêm sản phẩm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item) => (
                      <tr key={item.productUnitId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.productName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.unitName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={quantityInputs[item.productUnitId] !== undefined ? quantityInputs[item.productUnitId] : item.quantity}
                            onChange={(e) => handleQuantityInputChange(item.productUnitId, e.target.value)}
                            onBlur={(e) => {
                              // When user finishes typing, ensure we have a valid value
                              const value = e.target.value
                              if (value === '' || isNaN(Number(value)) || Number(value) <= 0) {
                                // Reset to current quantity if invalid
                                setQuantityInputs(prev => ({
                                  ...prev,
                                  [item.productUnitId]: item.quantity.toString()
                                }))
                              } else {
                                // Ensure input state matches the final value
                                setQuantityInputs(prev => ({
                                  ...prev,
                                  [item.productUnitId]: value
                                }))
                              }
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveItem(item.productUnitId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Gift Items Display */}
            {orderPreview?.data?.giftItems && orderPreview.data.giftItems.length > 0 && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  🎁 Sản phẩm tặng kèm
                </h3>
                <div className="space-y-1">
                  {orderPreview.data.giftItems.map((gift: any, index: number) => (
                    <div key={index} className="text-sm text-green-700">
                      • {gift.productName} ({gift.unitName}) x{gift.quantity} - Miễn phí
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Promotion - Only for regular mode */}
          {!isPOSMode && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Khuyến mãi</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn khuyến mãi
                </label>
                <select
                  value={selectedPromotion?.id || ''}
                  onChange={(e) => {
                    const promotionId = parseInt(e.target.value)
                    const promotion = promotions.find(p => p.id === promotionId)
                    setSelectedPromotion(promotion || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Không áp dụng khuyến mãi</option>
                  {promotions.map(promotion => (
                    <option key={promotion.id} value={promotion.id}>
                      {promotion.name} - {promotion.type === 'FIXED' ? formatCurrency(promotion.discountAmount) : `${promotion.discountAmount}%`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú đơn hàng</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Nhập ghi chú cho đơn hàng"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Camera Scanner - Fixed at bottom right of left column */}
          {isPOSMode && showCameraScanner && (
            <div className="fixed bottom-4 right-4 w-80 bg-white rounded-lg shadow-2xl border-2 border-green-400 z-40">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Đưa mã vào khung xanh</h3>
                  <button onClick={stopCameraScanner} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>



                <div className="space-y-2">
                  <div className="relative">
                    <video ref={videoRef} className="w-full h-48 rounded border bg-black object-cover" playsInline muted />
                    {/* Scanning overlay with guide frame */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative">
                        {/* Main scanning frame - smaller for corner display */}
                        <div className="w-48 h-24 border-2 border-green-400 rounded-lg bg-transparent">
                          {/* Corner indicators */}
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400 rounded-br-lg"></div>

                          {/* Scanning line animation */}
                          <div className="absolute inset-0 overflow-hidden rounded-lg">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-green-400 animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          </div>
                        </div>

                        {/* Center dot */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {/* <div className="text-xs text-gray-600">
                      🔍 Đang quét...
                    </div> */}
                    <button onClick={stopCameraScanner} className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

            {previewLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-2">Đang tính toán...</p>
              </div>
            ) : orderPreview ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(orderPreview.data?.totalOriginalAmount || subtotal)}</span>
                </div>

                {orderPreview.data?.totalDiscountAmount && orderPreview.data.totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Khuyến mãi:</span>
                    <span>-{formatCurrency(orderPreview.data.totalDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-blue-600">
                  <span>Phí vận chuyển:</span>
                  <span>Miễn phí</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Thành tiền:</span>
                    <span className="text-blue-600">{formatCurrency(orderPreview.data?.totalFinalAmount || total)}</span>
                  </div>
                </div>

                {orderPreview.data?.appliedPromotions && orderPreview.data.appliedPromotions.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Khuyến mãi đã áp dụng:</h4>
                    {orderPreview.data.appliedPromotions.map((promo: string, index: number) => (
                      <div key={index} className="text-sm text-green-700">
                        • {promo}
                      </div>
                    ))}
                  </div>
                )}

                {orderPreview.data?.giftItems && orderPreview.data.giftItems.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      🎁 Sản phẩm tặng kèm
                    </h4>
                    {orderPreview.data.giftItems.map((gift: any, index: number) => (
                      <div key={index} className="text-sm text-green-700">
                        • {gift.productName} ({gift.unitName}) x{gift.quantity} - Miễn phí
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {!isPOSMode && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {isPOSMode && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Phí vận chuyển:</span>
                    <span>Miễn phí</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>{isPOSMode ? 'Thành tiền:' : 'Tổng cộng:'}</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Fallback gift items display (when no API preview) */}
                {selectedPromotion && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700">
                      🎁 Khuyến mãi: {selectedPromotion.name}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Status Display */}
            {isPOSMode && currentOrder && paymentMethod === 'BANK_TRANSFER' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-3">
                  💳 Thanh toán chuyển khoản - Đơn hàng {currentOrder?.orderCode ? `${currentOrder.orderCode}` : (currentOrder?.id ? `${currentOrder.id}` : '')}
                </h3>

                <div className="text-center">
                  <div className="text-sm text-blue-700 mb-4">
                    🔄 Đang chờ thanh toán... (Kiểm tra mỗi 5 giây)
                  </div>

                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Xem QR Code & Thông tin chuyển khoản
                  </button>
                </div>
              </div>
            )}

            {/* POS Order Status Management - removed per request */}

            <div className="mt-6">
              <button
                onClick={isPOSMode ? handleContinueToPayment : handleCreateOrder}
                disabled={loading || (!isPOSMode && !selectedCustomer) || orderItems.length === 0 || (isPOSMode && currentOrder)}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base block mx-auto"
              >
                {loading ? 'Đang xử lý...' :
                 isPOSMode ? (currentOrder ? 'Đang xử lý đơn hàng...' : 'Tiếp tục') :
                 'Tạo đơn hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 style: !mt-0" >
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Chọn phương thức thanh toán</h3>
              <button
                onClick={() => setShowPaymentMethodModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* <div className="text-sm text-gray-600 mb-4">
                Tổng tiền: <span className="font-semibold text-lg text-green-600">{formatCurrency(totalAmount)}</span>
              </div> */}

              <div className="space-y-4">
                <div className="flex items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    id="modal_cod"
                    name="modal_paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER')}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="modal_cod" className="ml-4 flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-900">Tiền mặt</div>
                      <div className="text-sm text-gray-500">Thanh toán trực tiếp tại quầy</div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    id="modal_bank_transfer"
                    name="modal_paymentMethod"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER')}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="modal_bank_transfer" className="ml-4 flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-900">Chuyển khoản</div>
                      <div className="text-sm text-gray-500">Thanh toán qua QR code</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPaymentMethodModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmPaymentMethod}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Hoàn thành bán hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment QR Modal */}
      {showPaymentModal && paymentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                💳 Thanh toán chuyển khoản - Đơn hàng {currentOrder?.orderCode ? `#${currentOrder.orderCode}` : (currentOrder?.id ? `#${currentOrder.id}` : '')}
              </h3>
              <button
                onClick={async () => {
                  setShowPaymentModal(false)
                  if (pendingCompleteOrderId) {
                    try {
                      const detail = await OrderApi.getById(pendingCompleteOrderId).catch(() => null)
                      let summary: any = detail?.data || detail || null
                      if (summary?.orderDetails && Array.isArray(summary.orderDetails)) {
                        const enriched = await Promise.all((summary.orderDetails || []).map(async (d: any) => {
                          const oi = orderItems.find(oi => oi.productUnitId === d.productUnitId)
                          if (oi) return { ...d, productName: oi.productName, unitName: oi.unitName }
                          try {
                            const unitInfo = await ProductService.getProductUnitById(d.productUnitId)
                            return { ...d, productName: unitInfo?.productName || `PU#${d.productUnitId}`, unitName: unitInfo?.unitName || 'Đơn vị' }
                          } catch {
                            return { ...d, productName: `PU#${d.productUnitId}`, unitName: 'Đơn vị' }
                          }
                        }))
                        summary = { ...summary, orderDetails: enriched }
                      }
                      setCurrentOrder(summary)
                      setOrderSummaryForConfirm(summary)
                      setShowCompleteConfirmModal(true)
                    } catch {}
                    setPendingCompleteOrderId(null)
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="text-sm text-gray-600 mb-3">Quét QR để thanh toán</div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <img
                      src={paymentInfo.qrContent}
                      alt="QR Code for payment"
                      className="mx-auto max-w-full h-auto"
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'block'
                        }
                      }}
                    />
                    <div
                      className="text-xs font-mono break-all text-gray-800 hidden"
                      style={{ display: 'none' }}
                    >
                      {paymentInfo.qrContent}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Sử dụng app ngân hàng để quét QR code này
                </div>
              </div>

              {/* Payment Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-3">Thông tin chuyển khoản</div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-mono font-medium text-gray-900">{paymentInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tên tài khoản:</span>
                      <span className="font-medium text-gray-900">{paymentInfo.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-medium text-gray-900">{getBankName(paymentInfo.bankCode)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-bold text-blue-600 text-lg">{formatCurrency(currentOrder?.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Nội dung:</span>
                      <span className="font-mono text-xs text-gray-900 text-right">{paymentInfo.transferContent}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <div className="font-medium mb-2">⚠️ Lưu ý quan trọng:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• Nhập chính xác nội dung chuyển khoản</li>
                      <li>• Số tiền phải khớp với đơn hàng</li>
                      <li>• Hệ thống sẽ tự động xác nhận sau khi chuyển khoản</li>
                      <li>• Kiểm tra mỗi 5 giây một lần</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-blue-700 mb-4">
                🔄 Đang chờ thanh toán... (Kiểm tra mỗi 5 giây)
              </div>

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    // Copy payment info to clipboard
                    const paymentText = `Số tài khoản: ${paymentInfo.accountNumber}\nTên: ${paymentInfo.accountName}\nNgân hàng: ${getBankName(paymentInfo.bankCode)}\nSố tiền: ${formatCurrency(currentOrder?.totalAmount || 0)}\nNội dung: ${paymentInfo.transferContent}`
                    navigator.clipboard.writeText(paymentText)
                    setSuccess('Đã copy thông tin chuyển khoản!')
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
                >
                  Copy thông tin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showPaymentSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 style: !mt-0">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                🎉 Thanh toán thành công!
              </h3>
              <p className="text-gray-600 mb-4">
                Đơn hàng #{currentOrder?.id} đã được thanh toán thành công
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-800">
                <div className="font-medium mb-2">✅ Xác nhận thanh toán:</div>
                <ul className="space-y-1 text-left">
                  <li>• Số tiền: <span className="font-bold">{formatCurrency(currentOrder?.totalAmount || 0)}</span></li>
                  <li>• Ngân hàng: {getBankName(paymentInfo?.bankCode || '')}</li>
                  <li>• Trạng thái: Đã thanh toán</li>
                  <li>• Đơn hàng: Đang xử lý...</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => {
                  setShowPaymentSuccessModal(false)
                  resetOrderForm()
                }}
                className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-medium text-lg"
              >
                Tạo đơn hàng mới
              </button>
              <button
                onClick={() => setShowPaymentSuccessModal(false)}
                className="bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 font-medium text-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Confirm Complete Modal removed per request */}

      {/* Print Invoice Modal */}
      {showPrintModal && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Xem trước hóa đơn</h3>
              <button onClick={() => { setShowPrintModal(false); resetOrderForm() }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Receipt Preview/Print Area */}
            <div className="flex justify-center">
              <div id="print-area" className="receipt shadow border w-[80mm] bg-white p-3 text-[12px] leading-5">
                <div className="text-center">
                  <div className="text-[14px] font-bold">{storeName}</div>
                  {storeAddress && <div className="text-[12px]">{storeAddress}</div>}
                  {storeTaxId && <div className="text-[12px]">MST: {storeTaxId}</div>}
                  <div className="mt-1 text-[13px] font-semibold">PHIẾU THANH TOÁN</div>
                  <div className="text-[12px]">Mã đơn: {invoiceData.orderCode ? `#${invoiceData.orderCode}` : (invoiceData.id ? `#${invoiceData.id}` : '')}</div>
                  <div className="text-[12px]">Thời gian: {new Date(invoiceData.createdAt).toLocaleString('vi-VN')}</div>
                </div>

                <div className="mt-2 text-[12px]">
                  <div>Khách hàng: {selectedCustomer?.fullName || invoiceData.customerName || 'Khách lẻ'}</div>
                  {(selectedCustomer?.phoneNumber || invoiceData.customerPhone) && <div>Điện thoại: {selectedCustomer?.phoneNumber || invoiceData.customerPhone}</div>}
                </div>

                <div className="my-2 border-t border-dashed"></div>

                {/* Items */}
                <div className="space-y-1">
                  {(invoiceData.orderDetails || []).map((d: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex justify-between">
                        <div className="pr-2">{d.productName || `PU#${d.productUnitId}`}</div>
                        <div className="text-right font-medium">{formatCurrency(d.subtotal || ((d.unitPrice||0)*(d.quantity||0)))}</div>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-600">
                        <div>{d.unitName || '—'}</div>
                        <div>{d.quantity} x {formatCurrency(d.unitPrice || 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-2 border-t border-dashed"></div>

                {/* Totals */}
                <div className="text-[12px] space-y-1">
                  <div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(computedSubtotal)}</span></div>
                  {computedDiscount > 0 && (<div className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(computedDiscount)}</span></div>)}
                  {vatAmount > 0 && (<div className="flex justify-between"><span>Thuế VAT</span><span>{formatCurrency(vatAmount)}</span></div>)}
                  {shippingFee > 0 && (<div className="flex justify-between"><span>Phí vận chuyển</span><span>{formatCurrency(shippingFee)}</span></div>)}
                  <div className="flex justify-between text-[14px] font-bold"><span>TỔNG CỘNG</span><span>{formatCurrency(finalTotal)}</span></div>
                </div>

                <div className="my-2 border-t border-dashed"></div>
                <div className="text-center text-[11px]">Cảm ơn Quý khách, hẹn gặp lại!</div>
              </div>
            </div>

            {/* Print controls */}
            <div className="mt-3 flex justify-end gap-3 print:hidden">
              <button onClick={() => { setShowPrintModal(false); resetOrderForm() }} className="px-4 py-2 border rounded-md">Đóng</button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-green-600 text-white rounded-md">In hóa đơn</button>
            </div>

            {/* Print CSS */}
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #print-area, #print-area * { visibility: visible; }
                #print-area { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 0; }
              }
              @page { size: 80mm auto; margin: 2mm; }
            `}</style>
          </div>
        </div>
      )}
      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        title="Thêm sản phẩm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sản phẩm
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(parseInt(e.target.value) || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Chọn sản phẩm</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.productName} - {product.unitName} - {formatCurrency(product.price)}
                  {product.stock > 0 ? ` (Còn: ${product.stock})` : ' (Hết hàng)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddProduct(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddProduct}
              disabled={!selectedProduct || quantity <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CreateOrderManagement
