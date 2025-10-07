import React, { useState, useEffect } from 'react'
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<ProductUnit[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
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

  // Form states for adding products
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('')
  const [quantity, setQuantity] = useState(1)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const scanLoopRef = React.useRef<number | null>(null)
  const zxingReaderRef = React.useRef<any>(null)

  // POS specific states
  const [barcodeInput, setBarcodeInput] = useState('')
  const [quickSearch, setQuickSearch] = useState('')
  const [isPOSMode, setIsPOSMode] = useState(true)

  // POS mode: always walk-in customer, no promotions

  useEffect(() => {
    fetchInitialData()
  }, [])

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
      setOrderItems(prev => prev.map(item =>
        item.productUnitId === selectedProduct
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
          : item
      ))
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

  // Camera barcode scanning using native BarcodeDetector (Chromium-based browsers)
  const startCameraScanner = async () => {
    try {
      setError(null)
      setShowCameraScanner(true)
      // Request back camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Prefer native BarcodeDetector when available
      const isSupported = (window as any).BarcodeDetector && typeof (window as any).BarcodeDetector === 'function'
      if (!isSupported) {
        // Fallback to ZXing if not supported
        await startZxingFallback()
        return
      }

      const detector = isSupported ? new (window as any).BarcodeDetector({ formats: ['ean_13', 'code_128', 'ean_8', 'qr_code'] }) : null
      const startTime = Date.now()
      const scanFrame = async () => {
        try {
          if (!videoRef.current || videoRef.current.readyState !== 4 || !detector) {
            scanLoopRef.current = requestAnimationFrame(scanFrame)
            return
          }
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes && barcodes.length > 0) {
            const value = barcodes[0].rawValue || barcodes[0].rawValue
            await stopCameraScanner()
            await handleBarcodeScan(String(value))
            return
          }
          // If no result after 3 seconds, fallback to ZXing (more robust on many devices)
          if (Date.now() - startTime > 3000) {
            await startZxingFallback()
            return
          }
        } catch (e) {
          // continue scanning silently
        }
        scanLoopRef.current = requestAnimationFrame(scanFrame)
      }
      scanLoopRef.current = requestAnimationFrame(scanFrame)
    } catch (e: any) {
      setError('Không thể mở camera: ' + (e?.message || ''))
      await stopCameraScanner()
    }
  }

  const startZxingFallback = async () => {
    try {
      // Dynamically load ZXing UMD bundle
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
      if (!ZX || !ZX.BrowserMultiFormatReader) throw new Error('ZXing not available')
      const reader = new ZX.BrowserMultiFormatReader()
      zxingReaderRef.current = reader
      if (!videoRef.current) return
      // Use default device (back camera chosen by facingMode in getUserMedia)
      await reader.decodeFromVideoDevice(null, videoRef.current, async (result: any) => {
        if (result && result.getText) {
          const text = result.getText()
          await stopCameraScanner()
          await handleBarcodeScan(String(text))
        }
        // keep scanning on errors
      })
    } catch (e) {
      setError('Trình duyệt không hỗ trợ quét mã tự động. Vui lòng nhập mã hoặc dùng thiết bị khác.')
    }
  }

  const stopCameraScanner = async () => {
    try {
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
      if (zxingReaderRef.current) {
        try { zxingReaderRef.current.reset() } catch (_) {}
        zxingReaderRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    } finally {
      setShowCameraScanner(false)
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

            // Bước 3: DELIVERING → COMPLETED
            setTimeout(async () => {
              try {
            // Trước khi chuyển COMPLETED hiển thị xác nhận hóa đơn
            try {
              const detail = await OrderApi.getById(orderId).catch(() => null)
              let summary: any = detail?.data || detail || null
              if (summary?.orderDetails && Array.isArray(summary.orderDetails)) {
                const enriched = await Promise.all(summary.orderDetails.map(async (d: any) => {
                  // Ưu tiên lấy tên từ giỏ hiện tại
                  const oi = orderItems.find(oi => oi.productUnitId === d.productUnitId)
                  if (oi) {
                    return { ...d, productName: oi.productName, unitName: oi.unitName }
                  }
                  // Nếu không có trong giỏ, gọi ProductService để lấy tên
                  try {
                    const unitInfo = await ProductService.getProductUnitById(d.productUnitId)
                    return { ...d, productName: unitInfo?.productName || `PU#${d.productUnitId}`, unitName: unitInfo?.unitName || 'Đơn vị' }
                  } catch {
                    return { ...d, productName: `PU#${d.productUnitId}`, unitName: 'Đơn vị' }
                  }
                }))
                summary = { ...summary, orderDetails: enriched }
              }
              setOrderSummaryForConfirm(summary)
            } catch {}
            setShowCompleteConfirmModal(true)
            // Dừng luồng tại đây; việc chuyển COMPLETED sẽ thực hiện khi người dùng bấm OK
            return

            // Nếu là COD, sau khi hoàn thành đơn, cập nhật payment-status = PAID
            try {
              if (markPaid) {
                console.log('💳 Mark COD order as PAID...')
                await updatePaymentStatus(orderId)
              }
            } catch (e) {
              console.error('❌ Failed to update payment status for COD:', e)
            }

                // Reset form sau khi hoàn thành
                setTimeout(() => {
                  handleClearCart()
                }, 2000)
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
  }

  const handleUpdateQuantity = (productUnitId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productUnitId)
      return
    }

    setOrderItems(prev => prev.map(item =>
      item.productUnitId === productUnitId
        ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
        : item
    ))
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

        // Xử lý thanh toán chuyển khoản
        if (paymentMethod === 'BANK_TRANSFER') {
          setSuccess(`Đơn hàng #${result.id} đã tạo! Vui lòng quét QR để thanh toán.`)
          await handleBankTransferPayment(result.id, result.totalAmount)
        } else {
          // Thanh toán tiền mặt - tự động chuyển trạng thái
          setSuccess(`Đơn hàng #${result.id} đã tạo! Đang tự động xuất kho và hoàn thành...`)
          await handleCashPaymentWorkflow(result.id, true)
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bán hàng tại quầy</h1>
            <p className="text-gray-600">Hệ thống bán hàng POS - Point of Sale</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPOSMode(!isPOSMode)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isPOSMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isPOSMode ? 'Chế độ POS' : 'Chế độ thường'}
            </button>
            <button
              onClick={handleClearCart}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Xóa giỏ hàng
            </button>
            <button
              onClick={fetchInitialData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Tải lại dữ liệu
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* POS Quick Actions */}
          {isPOSMode && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>

              {/* Barcode Scanner */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quét mã vạch / Tìm kiếm sản phẩm
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBarcodeScan(barcodeInput)}
                    placeholder="Quét mã vạch hoặc nhập tên sản phẩm..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleBarcodeScan(barcodeInput)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Quét
                  </button>
                  <button
                    onClick={startCameraScanner}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Quét bằng camera
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="mb-4">
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm nhanh..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quick Product Grid */}
              {quickSearch && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
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
          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>

            {isPOSMode ? (
              // POS Mode: Walk-in customer only
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {/* <div className="flex items-center">
                  <div className="text-blue-500 text-2xl mr-3">🛒</div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-800">Khách lẻ - Bán hàng tại quầy</h3>
                    <p className="text-sm text-blue-600">Khách hàng mua trực tiếp tại cửa hàng, không cần thông tin cá nhân</p>
                  </div>
                </div> */}
              </div>
            ) : (
              // Regular Mode: Customer selection
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn khách hàng *
                  </label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const customerId = parseInt(e.target.value)
                      const customer = customers.find(c => c.id === customerId)
                      setSelectedCustomer(customer || null)
                      if (customer) {
                        setShippingAddress(customer.address)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.fullName} - {customer.phoneNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Tên:</span> {selectedCustomer.fullName}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">SĐT:</span> {selectedCustomer.phoneNumber}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Email:</span> {selectedCustomer.email}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isPOSMode && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ giao hàng
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nhập địa chỉ giao hàng"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

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
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.productUnitId, parseInt(e.target.value) || 0)}
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
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          {/* Payment Method */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="cod" className="ml-2 text-sm font-medium text-gray-900">
                  {isPOSMode ? 'Tiền mặt' : 'Thanh toán khi nhận hàng (COD)'}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="bank_transfer"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === 'BANK_TRANSFER'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COD' | 'BANK_TRANSFER')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="bank_transfer" className="ml-2 text-sm font-medium text-gray-900">
                  {isPOSMode ? 'Chuyển khoản' : 'Chuyển khoản ngân hàng'}
                </label>
              </div>
            </div>

            {isPOSMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-blue-500 text-lg mr-2">💳</div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Bán hàng tại quầy
                    </p>
                    <p className="text-xs text-blue-600">
                      Khách hàng thanh toán trực tiếp tại cửa hàng
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  💳 Thanh toán chuyển khoản - Đơn hàng #{currentOrder.id}
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

            {/* POS Order Status Management */}
            {isPOSMode && currentOrder && !paymentInfo && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-3">
                  Đơn hàng #{currentOrder.id} - Tự động xử lý
                </h3>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      orderStatus === 'PENDING' ? 'bg-yellow-500' :
                      orderStatus === 'CONFIRMED' ? 'bg-orange-500' :
                      orderStatus === 'DELIVERING' ? 'bg-blue-500' :
                      orderStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {orderStatus === 'PENDING' ? 'Đang tạo đơn hàng...' :
                       orderStatus === 'CONFIRMED' ? 'Đã xác nhận đơn hàng...' :
                       orderStatus === 'DELIVERING' ? 'Đang xuất kho...' :
                       orderStatus === 'COMPLETED' ? 'Hoàn thành!' : 'Không xác định'}
                    </span>
                  </div>

                  {orderStatus === 'PENDING' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  )}

                  {orderStatus === 'CONFIRMED' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  )}

                  {orderStatus === 'DELIVERING' && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-green-700 mb-3">
                  {orderStatus === 'PENDING' && 'Đang tạo đơn hàng...'}
                  {orderStatus === 'CONFIRMED' && 'Đã xác nhận đơn hàng, chuẩn bị xuất kho...'}
                  {orderStatus === 'DELIVERING' && 'Đang xuất kho và hoàn thành đơn hàng...'}
                  {orderStatus === 'COMPLETED' && 'Đơn hàng đã hoàn thành! Giao dịch thành công.'}
                </div>

                {orderStatus === 'COMPLETED' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleClearCart}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                    >
                      Tạo đơn hàng mới
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleCreateOrder}
                disabled={loading || (!isPOSMode && !selectedCustomer) || orderItems.length === 0 || (isPOSMode && currentOrder)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {loading ? 'Đang xử lý...' :
                 isPOSMode ? (currentOrder ? 'Đang xử lý đơn hàng...' : 'Hoàn thành bán hàng') :
                 'Tạo đơn hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment QR Modal */}
      {showPaymentModal && paymentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                💳 Thanh toán chuyển khoản - Đơn hàng #{currentOrder?.id}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  handleClearCart()
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

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quét mã bằng camera</h3>
              <button onClick={stopCameraScanner} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <video ref={videoRef} className="w-full rounded border bg-black" playsInline muted />
              <div className="text-xs text-gray-500">Hướng camera vào mã vạch/QR. Khi nhận diện được, sản phẩm sẽ được thêm vào giỏ.</div>
              <div className="flex justify-end">
                <button onClick={stopCameraScanner} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Complete Modal */}
      {showCompleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận hoàn thành đơn hàng</h3>
              <button onClick={() => setShowCompleteConfirmModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {orderSummaryForConfirm ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-600">Mã đơn:</span> <span className="font-medium">#{orderSummaryForConfirm.id}</span></div>
                  <div><span className="text-gray-600">Ngày tạo:</span> {new Date(orderSummaryForConfirm.createdAt).toLocaleString('vi-VN')}</div>
                  <div><span className="text-gray-600">Phương thức:</span> {orderSummaryForConfirm.paymentMethod === 'COD' ? 'Tiền mặt' : 'Chuyển khoản'}</div>
                  <div><span className="text-gray-600">Tổng tiền:</span> <span className="font-semibold text-blue-600">{formatCurrency(orderSummaryForConfirm.totalAmount || 0)}</span></div>
                </div>
                <div className="mt-2">
                  <div className="font-medium text-gray-800 mb-2">Chi tiết sản phẩm</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600">Sản phẩm</th>
                          <th className="px-3 py-2 text-left text-gray-600">Đơn vị</th>
                          <th className="px-3 py-2 text-right text-gray-600">SL</th>
                          <th className="px-3 py-2 text-right text-gray-600">Đơn giá</th>
                          <th className="px-3 py-2 text-right text-gray-600">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {(orderSummaryForConfirm.orderDetails || []).map((d: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{d.productName || `PU#${d.productUnitId}`}</td>
                            <td className="px-3 py-2">{d.unitName || '—'}</td>
                            <td className="px-3 py-2 text-right">{d.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(d.unitPrice || 0)}</td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(d.subtotal || ((d.unitPrice||0)*(d.quantity||0)))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Đang tải chi tiết đơn hàng...</div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCompleteConfirmModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Hủy</button>
              <button
                onClick={async () => {
                  try {
                    if (!currentOrder?.id) return
                    // Tiếp tục cập nhật COMPLETED
                    const completedResult = await updateOrderStatusAPI(currentOrder.id, 'COMPLETED')
                    setOrderStatus('COMPLETED')
                    setCurrentOrder(completedResult.data || completedResult)
                    setSuccess('Đơn hàng đã hoàn thành! Giao dịch thành công.')
                    // Sau khi hoàn thành, cập nhật trạng thái thanh toán thành PAID
                    try {
                      await updatePaymentStatus(currentOrder.id)
                    } catch (e) {
                      console.error('❌ Failed to mark payment PAID on complete:', e)
                    }
                    setShowCompleteConfirmModal(false)
                  } catch (e: any) {
                    setError('Lỗi khi hoàn thành đơn hàng: ' + (e?.message || ''))
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                OK, hoàn thành
              </button>
            </div>
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
