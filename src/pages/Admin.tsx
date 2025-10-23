import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import React, { useEffect, useState, useMemo } from 'react'
import { ProductService, Product, ProductCategory, ProductUnit, CreateProductRequest, UpdateProductRequest } from '@/services/productService'
import { InventoryService, WarehouseDto, StockLocationDto } from '@/services/inventoryService'
import { Pagination, ProductTable, ProductFormWithUnitsAndPrices, Modal, UnitManagement, PriceManagement, AccountManagement, InventoryManagement, InventoryCheckManagement, WarehouseTab, PromotionManagement, OrderManagement, OrderProcessingManagement, OrderListManagement, AdminSidebar, WarehouseStatsPage, RevenuePage, ProductStatsPage } from '@/components'
import CreateOrderManagement from '@/components/CreateOrderManagement'
import InventoryImportExportCreate from '@/components/InventoryImportExportCreate'
import InventoryImportExportList from '@/components/InventoryImportExportList'
import PriceHeaderDetail from '@/pages/PriceHeaderDetail'
import InventoryCheckCreate from '@/pages/InventoryCheckCreate'
import CategoryManagement from '@/components/CategoryManagement'
import ReturnOrderManagement from '@/components/ReturnOrderManagement'
import ReturnedOrdersPage from '@/pages/ReturnedOrdersPage'

const Admin = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { headerId, tab } = useParams<{ headerId?: string; tab?: string }>()

  // Detect create inventory check page
  const isInventoryCheckCreate = location.pathname === '/admin/inventory-check/create'

  // Detect price management page
  const isPriceManagement = location.pathname === '/admin/prices'

  // Detect price header detail page
  const isPriceHeaderDetail = location.pathname.startsWith('/admin/prices/') && headerId

  // State for products
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  type TabType = 'overview' | 'management' | 'products' | 'categories' | 'units' | 'prices' | 'inventory' | 'inventory-management' | 'inventory-import-export' | 'inventory-import-export-list' | 'inventory-check-create' | 'inventory-check' | 'warehouses' | 'warehouse-list' | 'warehouse-history' | 'accounts' | 'promotions' | 'orders' | 'order-processing' | 'order-list' | 'return-processing' | 'returned-orders' | 'create-order' | 'statistics' | 'revenue' | 'warehouse-stats' | 'product-stats'

  const [currentTab, setCurrentTab] = useState<TabType>(
    (tab as TabType) ||
    (isInventoryCheckCreate ? 'inventory-check-create' :
     isPriceManagement ? 'prices' :
     isPriceHeaderDetail ? 'prices' : 'overview')
  )

  const handleTabChange = (next: TabType) => {
    setCurrentTab(next)
    if (next === 'inventory-check-create') {
      navigate('/admin/inventory-check/create')
      return
    }
    navigate(`/admin/${next}`)
  }

  // Keep tab in sync with URL changes
  useEffect(() => {
    if (isInventoryCheckCreate) {
      setCurrentTab('inventory-check-create')
    } else if (isPriceManagement) {
      setCurrentTab('prices')
    } else if (isPriceHeaderDetail) {
      setCurrentTab('prices')
    } else if (tab) {
      setCurrentTab(tab as TabType)
    } else if (!tab && currentTab !== 'overview' && location.pathname === '/admin') {
      setCurrentTab('overview')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, tab])

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // row-level actions
  const [unitModalOpen, setUnitModalOpen] = useState(false)
  const [targetProduct] = useState<Product | null>(null)
  const [unitForm, setUnitForm] = useState<{ unitId: number | ''; conversionFactor: number; isDefault: boolean; barcodeCode: string; barcodeType: string }>({ unitId: '', conversionFactor: 1, isDefault: false, barcodeCode: '', barcodeType: 'EAN13' })
  const [allUnits, setAllUnits] = useState<Array<{ id: number; name: string; isDefault?: boolean }>>([])
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null)
  const [barcodeInputs, setBarcodeInputs] = useState<Record<number, { code: string; type: string }>>({})
  const [unitCFEdit, setUnitCFEdit] = useState<Record<number, number>>({})
  // price modal states
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [selectedUnit] = useState<{ productUnitId: number; unitId?: number; unitName?: string } | null>(null)
  const [priceHistory, setPriceHistory] = useState<Array<{ id: number; unitId: number; unitName?: string; price: number; validFrom?: string; validTo?: string; priceHeaderId?: number }>>([])
  const [unitsWithHeader, setUnitsWithHeader] = useState<Set<number>>(new Set())
  const [headerByUnit, setHeaderByUnit] = useState<Record<number, number>>({})
  // Headers không hiển thị trong UI
  const [newPrice, setNewPrice] = useState<{ price: string; validFrom: string; validTo: string }>({ price: '', validFrom: '', validTo: '' })
  const [priceLoading, setPriceLoading] = useState(false)

  // View detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)

  // Import/Upload modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importWarehouseId, setImportWarehouseId] = useState<string>('')
  const [importStockLocationId, setImportStockLocationId] = useState<string>('')
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([])




  // Notification modal
  const [notify, setNotify] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({ open: false, title: '', message: '', type: 'success' })
  const openNotify = (title: string, message: string, type: 'success' | 'error' = 'success') => setNotify({ open: true, title, message, type })
  const closeNotify = () => setNotify(prev => ({ ...prev, open: false }))

  // Stats for overview
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts()
      loadCategories()
    }
  }, [isAuthenticated])

  // Preload warehouses and locations for import modal
  useEffect(() => {
    InventoryService.getWarehouses()
      .then(setWarehouses)
      .catch(() => setWarehouses([]))
  }, [])
  // preload units when needed
  useEffect(() => {
    if (!unitModalOpen) return
    ProductService.getUnits()
      .then(res => setAllUnits(res.map((u: any) => ({ id: u.id, name: u.name, isDefault: u.isDefault }))))
      .catch(() => setAllUnits([]))
    if (targetProduct?.id) {
      ProductService.getProductById(targetProduct.id)
        .then(p => {
          setDetailedProduct(p)
          // Prefill barcode inputs per unit with existing barcode
          const mp: Record<number, { code: string; type: string }> = {}
          const units = (p.productUnits || []) as any[]
          const productAny = p as unknown as { barcodeList?: Array<{ id: number; productUnitId: number; code: string; type?: string }> }
          for (const u of units) {
            const list = (u.barcodes && u.barcodes.length > 0)
              ? u.barcodes
              : (productAny?.barcodeList || []).filter(b => b.productUnitId === (u.id ?? u.unitId))
            if (list && list.length > 0) {
              mp[u.id] = { code: list[0].code, type: list[0].type || 'EAN13' }
            }
          }
          setBarcodeInputs(mp)
        })
        .catch(() => setDetailedProduct(targetProduct))
    }
    // Always reset isDefault when opening (avoid setting new default if one exists)
    setUnitForm(prev => ({ ...prev, isDefault: false }))
  }, [unitModalOpen])

  useEffect(() => {
    const wid = importWarehouseId ? Number(importWarehouseId) : undefined
    InventoryService.getStockLocations(wid)
      .then(setStockLocations)
      .catch(() => setStockLocations([]))
  }, [importWarehouseId])

  // Calculate stats when categories and products change
  useEffect(() => {
    if (categories.length > 0) {
      calculateStats()
    }
  }, [categories, products])

  // Load products when page or filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts()
    }
  }, [pagination.current_page, selectedCategory])

  // Load products when switching to products tab
  useEffect(() => {
    if (isAuthenticated && currentTab === 'products') {
      loadProducts()
    }
  }, [currentTab, isAuthenticated])

  // Filter products locally based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products
    }

    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [products, searchTerm])

  // After products load, detect units that already have price headers to drive the button label
  useEffect(() => {
    if (!products || products.length === 0) {
      setUnitsWithHeader(new Set())
      return
    }
    // Simplified: assume all units can have price headers, no need to check API
    const acc = new Set<number>()
    for (const p of products) {
      for (const u of (p.productUnits || [])) {
        acc.add(u.id)
      }
    }
    setUnitsWithHeader(acc)
  }, [products])

  const loadProducts = async () => {
    console.log('🔄 Loading products...', {
      page: pagination.current_page,
      limit: pagination.items_per_page,
      category: selectedCategory
    })
    setLoading(true)
    try {
      const response = await ProductService.getProducts(
        pagination.current_page,
        pagination.items_per_page,
        undefined, // Không search qua API nữa
        selectedCategory
      )
      console.log('✅ Products loaded:', response)
      setProducts(response.products)
      setPagination(response.pagination)
    } catch (error) {
      console.error('❌ Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await ProductService.getCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const calculateStats = async () => {
    try {
      // Get all products for stats calculation
      const allProductsResponse = await ProductService.getProducts(1, 1000) // Get all products
      const allProducts = allProductsResponse.products

      const totalProducts = allProducts.length
      const activeProducts = allProducts.filter(p => p.active).length
      const totalCategories = categories.length

      // Backend giá sẽ xử lý sau; tạm thời đặt 0
      const totalRevenue = 0

      setStats({
        totalProducts,
        activeProducts,
        totalCategories,
        totalRevenue
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }))
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    // Không cần reset pagination vì search là local
  }

  const handleCategoryFilter = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId)
    setPagination(prev => ({ ...prev, current_page: 1 }))
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const handleSubmitProduct = async (productData: any) => {
    setIsSubmitting(true)
    try {
      // Nếu form báo lỗi validation
      if (productData && productData.__error) {
        openNotify('Thiếu thông tin', String(productData.__error), 'error')
        return
      }
      // Nếu productData đã có id (được tạo kèm ảnh từ form) coi như thành công, không gọi API lần nữa
      if (productData && productData.id) {
        await loadProducts()
        handleCloseModal()
        openNotify('Thành công', 'Đã thêm sản phẩm thành công', 'success')
        return
      }
      const payload: CreateProductRequest | UpdateProductRequest = {
        name: productData.name,
        code: productData.code || '',
        description: productData.description,
        imageUrl: productData.image_url || productData.imageUrl,
        expirationDate: productData.expiration_date || productData.expirationDate,
        categoryId: productData.category_id || productData.categoryId,
        active: (productData.active === 1) ? true : !!productData.active,
      }
      if (editingProduct) await ProductService.updateProductWithImage(editingProduct.id, payload as UpdateProductRequest, undefined)
      else await ProductService.createProduct(payload)

      // Reload products
      await loadProducts()
      handleCloseModal()
      openNotify('Thành công', 'Đã thêm sản phẩm thành công', 'success')
    } catch (error) {
      // Thất bại rõ ràng: hiện thông báo lỗi
      handleCloseModal()
      openNotify('Thất bại', 'Không thể lưu sản phẩm. Vui lòng kiểm tra dữ liệu và thử lại.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleUnitStatus = async (product: Product, unit: ProductUnit) => {
    try {
      if (unit.active) {
        // Tạm dừng đơn vị
        await ProductService.deactivateProductUnit(product.id, unit.id)
        setProducts(prev => prev.map(p =>
          p.id === product.id ? {
            ...p,
            productUnits: p.productUnits?.map(u =>
              u.id === unit.id ? { ...u, active: false } : u
            ) || []
          } : p
        ))
      } else {
        // Kích hoạt đơn vị
        await ProductService.activateProductUnit(product.id, unit.id)
        setProducts(prev => prev.map(p =>
          p.id === product.id ? {
            ...p,
            productUnits: p.productUnits?.map(u =>
              u.id === unit.id ? { ...u, active: true } : u
            ) || []
          } : p
        ))
      }
    } catch (error) {
      console.error('Error toggling unit status:', error)
    }
  }

  // Đồng bộ editingProduct khi products state thay đổi
  useEffect(() => {
    if (editingProduct) {
      const updatedProduct = products.find(p => p.id === editingProduct.id)
      if (updatedProduct) {
        setEditingProduct(updatedProduct)
      }
    }
  }, [products, editingProduct])

  // Xử lý thay đổi trạng thái đơn vị từ modal
  const handleUnitStatusChange = (productId: number, unitId: number, active: boolean) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? {
        ...p,
        productUnits: p.productUnits?.map(u =>
          u.id === unitId ? { ...u, active } : u
        ) || []
      } : p
    ))
  }

  // --- Price modal helpers ---
  // Load price history and headers once when opening price modal
  useEffect(() => {
    if (!priceModalOpen || !targetProduct || !selectedUnit) return
    let cancelled = false
    ;(async () => {
      try {
        setPriceLoading(true)
        const rowsRaw = await ProductService.getUnitPriceHistory(targetProduct.id, selectedUnit.productUnitId)
        if (cancelled) return
        const rows = rowsRaw.map((r: any) => ({
          id: r.id,
          unitId: r.unitId ?? r.productUnitId ?? selectedUnit.productUnitId,
          unitName: r.unitName,
          price: r.price,
          validFrom: r.timeStart ?? r.validFrom,
          validTo: r.timeEnd ?? r.validTo,
          priceHeaderId: r.priceHeaderId ?? r.priceHeader?.id,
        }))
        setPriceHistory(rows)
        // Mark that this unit now has at least one header/price so table button switches to "Xem giá"
        if (rows.length > 0) {
          setUnitsWithHeader(prev => new Set(prev).add(selectedUnit.productUnitId))
        }
      } catch {
        if (!cancelled) setPriceHistory([])
      } finally {
        if (!cancelled) setPriceLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [priceModalOpen, targetProduct, selectedUnit])

  // Headers not loaded anymore

  const CreatePriceHeaderForm = ({ productId, productUnitId, onCreated }: { productId: number; productUnitId: number; onCreated: (headerId: number) => void }) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [timeStart, setTimeStart] = useState('')
    const [timeEnd, setTimeEnd] = useState('')
    const [active, setActive] = useState(true)
    return (
      <form onSubmit={async (e) => {
        e.preventDefault()
        if (!name.trim()) return
        try {
          const created = await ProductService.createPriceHeader(productId, productUnitId, { name: name.trim(), description: description || undefined, timeStart: timeStart || undefined, timeEnd: timeEnd || undefined, active })
          setName(''); setDescription(''); setTimeStart(''); setTimeEnd(''); setActive(true)
          onCreated(created?.id || 0)
        } catch {}
      }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên bảng giá</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả (tùy chọn)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ (tùy chọn)</label>
            <input type="datetime-local" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đến (tùy chọn)</label>
            <input type="datetime-local" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
            <span className="text-sm">Kích hoạt</span>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="submit" className="px-4 py-2 rounded-md text-white bg-gray-700 hover:bg-gray-800">Tạo đơn giá</button>
        </div>
      </form>
    )
  }




  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-2">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Trang quản trị</h1>
                <p className="text-sm text-gray-600">Chào mừng, {user?.fullName} ({user?.role})</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      className="w-56 pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"/>
                    </svg>
                  </div>
                </div>

                {/* Grid Icon */}
                <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </button>

                {/* Bell Icon */}
                <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md relative">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
            </div>
            <button
              onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
            >
              Đăng xuất
            </button>
                </div>
              </div>
          </div>
        </div>
      </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">

          {currentTab === 'management' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quản lý</h2>
              <p className="text-gray-600">Chọn một mục con từ menu bên trái để quản lý.</p>
          </div>
          )}

          {currentTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tổng sản phẩm</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalProducts}</dd>
                    </dl>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Sản phẩm hoạt động</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.activeProducts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Danh mục</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalCategories}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tổng giá trị</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(stats.totalRevenue)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Recent Products */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Sản phẩm gần đây</h3>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Xem tất cả →
                </button>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.slice(0, 5).map((product, idx) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {product.imageUrl ? (
                                <img
                                  className="h-8 w-8 rounded object-cover"
                                  src={product.imageUrl}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.categoryName || categories.find(cat => cat.id === product.categoryId)?.name || `ID: ${product.categoryId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
            </>
          )}

          {currentTab === 'products' && (
            <div className="space-y-6">
              {/* Filters moved into table header */}

              {/* Products Table */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <h3 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h3>
                    <div className="flex items-center gap-2">
                      <div className="hidden md:block">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder="Nhập tên sản phẩm..."
                          className="w-56 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div className="hidden md:block">
                        <select
                          value={selectedCategory || ''}
                          onChange={(e) => handleCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Tất cả danh mục</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Import sản phẩm
                      </button>

                      <button
                        onClick={handleAddProduct}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Thêm sản phẩm
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : (
                  <>
                    <ProductTable
                      products={filteredProducts}
                      categories={categories}
                      onEdit={handleEditProduct}
                      onToggleUnitStatus={handleToggleUnitStatus}
                      onViewDetail={async (p) => {
                        try {
                          const fresh = await ProductService.getProductById(p.id)
                          setDetailProduct(fresh)
                        } catch {
                          setDetailProduct(p)
                        }
                        setDetailModalOpen(true)
                      }}
                    />
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {currentTab === 'categories' && (
            <CategoryManagement />
          )}

          {currentTab === 'units' && (
            <UnitManagement />
          )}

          {currentTab === 'prices' && (
            headerId ? <PriceHeaderDetail /> : <PriceManagement />
          )}

          {currentTab === 'inventory' && (
            <InventoryManagement />
          )}

          {currentTab === 'inventory-management' && (
            <InventoryManagement />
          )}

          {currentTab === 'inventory-import-export' && (
            <InventoryImportExportCreate />
          )}

          {currentTab === 'inventory-import-export-list' && (
            <InventoryImportExportList />
          )}

          {currentTab === 'inventory-check-create' && (
            <InventoryCheckCreate />
          )}

          {currentTab === 'inventory-check' && (
            <InventoryCheckManagement />
          )}

          {currentTab === 'warehouses' && (
            <WarehouseTab />
          )}

          {currentTab === 'warehouse-list' && (
            <WarehouseTab />
          )}

          {currentTab === 'accounts' && (
            <AccountManagement />
          )}

          {currentTab === 'promotions' && (
            <PromotionManagement />
          )}

          {currentTab === 'orders' && (
            <OrderManagement />
          )}

          {currentTab === 'order-processing' && (
            <OrderProcessingManagement />
          )}

          {currentTab === 'order-list' && (
            <OrderListManagement />
          )}

          {currentTab === 'return-processing' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Xử lý đơn trả về</h2>
              <p className="text-gray-600">Chức năng xử lý đơn trả về sẽ được triển khai ở đây.</p>
        </div>
          )}

          {currentTab === 'create-order' && (
            <CreateOrderManagement />
          )}

          {currentTab === 'returned-orders' && (
            <ReturnedOrdersPage />
          )}

          {currentTab === 'warehouse-history' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử nhập xuất</h2>
              <p className="text-gray-600">Chức năng xem lịch sử nhập xuất sẽ được triển khai ở đây.</p>
            </div>
          )}

          {currentTab === 'revenue' && (
            <RevenuePage />
          )}

          {currentTab === 'warehouse-stats' && (
            <WarehouseStatsPage />
          )}

          {currentTab === 'product-stats' && (
            <ProductStatsPage />
          )}
      </main>
      </div>

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        size="lg"
      >
        <ProductFormWithUnitsAndPrices
          product={editingProduct as any}
          categories={categories as any}
          onSubmit={handleSubmitProduct}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
          onUnitStatusChange={handleUnitStatusChange}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailProduct ? `Chi tiết: ${detailProduct.name}` : 'Chi tiết sản phẩm'}
        size="lg"
      >
        {detailProduct ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                {detailProduct.imageUrl ? (
                  <img src={detailProduct.imageUrl} alt={detailProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900">{detailProduct.name}</div>
                <div className="text-sm text-gray-600 mt-1">{detailProduct.description || '—'}</div>
                <div className="text-sm text-gray-600 mt-1">Danh mục: {detailProduct.categoryName || categories.find(c => c.id === detailProduct.categoryId)?.name || `ID: ${detailProduct.categoryId}`}</div>
                <div className="text-sm text-gray-600 mt-1">HSD: {detailProduct.expirationDate ? new Date(detailProduct.expirationDate).toLocaleDateString('vi-VN') : 'Không có'}</div>
                <div className="text-sm text-gray-600 mt-1">Trạng thái: {detailProduct.active ? 'Hoạt động' : 'Không hoạt động'}</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-800 mb-2">Đơn vị & Barcode</div>
              {(detailProduct.productUnits || []).length === 0 ? (
                <div className="text-sm text-gray-500">Chưa có đơn vị.</div>
              ) : (
                <div className="space-y-2">
                  {(detailProduct.productUnits || []).map((u: any) => (
                    <UnitRow key={u.id} productId={detailProduct.id} product={detailProduct} unit={u} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Đang tải...</div>
        )}
      </Modal>

      {/* Price Modal: Xem/Tạo đơn giá cho đơn vị */}
      <Modal
        isOpen={priceModalOpen}
        onClose={() => setPriceModalOpen(false)}
        title={targetProduct ? `Lịch sử giá: ${targetProduct.name}${selectedUnit ? ` - ${selectedUnit.unitName}` : ''}` : 'Lịch sử giá'}
        size="lg"
      >
        <div className="space-y-4">
          {priceModalOpen && targetProduct && selectedUnit && (
            <></>
          )}

          {selectedUnit && !priceLoading && !unitsWithHeader.has(selectedUnit.productUnitId) && (
            <div className="rounded-md border p-4 bg-yellow-50">
              <div className="text-sm text-yellow-800 mb-2">Chưa có lịch sử giá cho đơn vị này. Vui lòng tạo Bảng giá trước, sau đó thêm giá.</div>
              <CreatePriceHeaderForm
                productId={targetProduct?.id || 0}
                productUnitId={selectedUnit.productUnitId}
                onCreated={(headerId) => {
                  setUnitsWithHeader(prev => new Set(prev).add(selectedUnit.productUnitId))
                  setHeaderByUnit(prev => ({ ...prev, [selectedUnit.productUnitId]: headerId }))
                  setPriceModalOpen(false)
                }}
              />
            </div>
          )}

          <div className="overflow-hidden rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiệu lực từ</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đến</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {priceLoading ? (
                  <tr><td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>Đang tải...</td></tr>
                ) : priceHistory.length === 0 ? (
                  <tr><td className="px-4 py-3 text-sm text-gray-500" colSpan={6}>Chưa có dữ liệu giá.</td></tr>
                ) : (
                  priceHistory.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.unitName || `Unit #${p.unitId}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.validFrom ? new Date(p.validFrom).toLocaleString('vi-VN') : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.validTo ? new Date(p.validTo).toLocaleString('vi-VN') : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        {(() => {
                          const now = Date.now()
                          const start = p.validFrom ? new Date(p.validFrom).getTime() : undefined
                          const end = p.validTo ? new Date(p.validTo).getTime() : undefined
                          let label = '—'
                          let cls = 'text-gray-700'
                          if (start && now < start) { label = 'Chuẩn bị'; cls = 'text-blue-600' }
                          else if (start && (!end || now <= end) && now >= start) { label = 'Hoạt động'; cls = 'text-green-600' }
                          else if (end && now > end) { label = 'Kết thúc'; cls = 'text-red-600' }
                          return <span className={cls}>{label}</span>
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedUnit && unitsWithHeader.has(selectedUnit.productUnitId) && (
            <div className="rounded-md border p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Giá</label>
                  <input type="number" min="0" value={newPrice.price} onChange={(e) => setNewPrice(prev => ({ ...prev, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hiệu lực từ</label>
                  <input type="datetime-local" value={newPrice.validFrom} onChange={(e) => setNewPrice(prev => ({ ...prev, validFrom: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đến (tùy chọn)</label>
                  <input type="datetime-local" value={newPrice.validTo} onChange={(e) => setNewPrice(prev => ({ ...prev, validTo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white bg-orange-600 hover:bg-orange-700"
                  onClick={async () => {
                    if (!targetProduct || !selectedUnit || !newPrice.price || !newPrice.validFrom) {
                      openNotify('Thiếu thông tin', 'Nhập giá và thời gian', 'error')
                      return
                    }
                    try {
                      // Lấy headerId: ưu tiên id đã lưu khi tạo header cho đơn vị; sau đó tới lịch sử
                      let headerId = headerByUnit[selectedUnit.productUnitId] || priceHistory.find(r => r.priceHeaderId)?.priceHeaderId
                      if (!headerId) {
                        // Simplified: use a default header ID or create one
                        openNotify('Thiếu thông tin', 'Đơn vị chưa có PriceHeader. Hãy tạo đơn giá trước.', 'error')
                        return
                      }
                      const numericPrice = Number(String(newPrice.price).replace(/\./g, ''))
                      await ProductService.addUnitPriceWithHeader(targetProduct.id, selectedUnit.productUnitId, { priceHeaderId: Number(headerId), price: numericPrice, timeStart: newPrice.validFrom, timeEnd: newPrice.validTo || undefined })
                      const refreshedRaw = await ProductService.getUnitPriceHistory(targetProduct.id, selectedUnit.productUnitId)
                      const refreshed = refreshedRaw.map((r: any) => ({ id: r.id, unitId: r.unitId ?? r.productUnitId ?? selectedUnit.productUnitId, unitName: r.unitName, price: r.price, validFrom: r.timeStart ?? r.validFrom, validTo: r.timeEnd ?? r.validTo, priceHeaderId: r.priceHeaderId }))
                      setPriceHistory(refreshed)
                      setNewPrice({ price: '', validFrom: '', validTo: '' })
                      openNotify('Thành công', 'Đã thêm giá vào bảng giá', 'success')
                    } catch (err) {
                      openNotify('Thất bại', 'Không thể thêm giá', 'error')
                    }
                  }}
                >Thêm giá</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Row action: Add Unit to Product (with optional barcode) */}
      <Modal
        isOpen={unitModalOpen}
        onClose={() => setUnitModalOpen(false)}
        title={targetProduct ? `Thêm đơn vị cho: ${targetProduct.name}` : 'Thêm đơn vị'}
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!targetProduct || !unitForm.unitId) {
              openNotify('Thiếu thông tin', 'Vui lòng chọn đơn vị tính', 'error')
              return
            }
            try {
              await ProductService.addProductUnit(targetProduct.id, {
                unitId: Number(unitForm.unitId),
                conversionFactor: Number(unitForm.conversionFactor) || 1,
                isDefault: !!unitForm.isDefault,
              })
              // If barcode provided, get product to find new productUnitId then add barcode
              if (unitForm.barcodeCode.trim()) {
                try {
                  const fresh = await ProductService.getProductById(targetProduct.id)
                  const pu = (fresh.productUnits || []).find((u: any) => u.unitId === Number(unitForm.unitId))
                  if (pu?.id) {
                    const { BarcodeService } = await import('@/services/barcodeService')
                    await BarcodeService.addBarcode(pu.id, unitForm.barcodeCode.trim(), unitForm.barcodeType || 'EAN13')
                  }
                } catch (_) { /* ignore */ }
              }
              setUnitForm({ unitId: '', conversionFactor: 1, isDefault: false, barcodeCode: '', barcodeType: 'EAN13' })
              // refresh details
              if (targetProduct?.id) {
                const fresh = await ProductService.getProductById(targetProduct.id)
                setDetailedProduct(fresh)
              }
              await loadProducts()
              await loadProducts()
              openNotify('Thành công', 'Đã thêm đơn vị cho sản phẩm', 'success')
            } catch (err) {
              openNotify('Thất bại', 'Không thể thêm đơn vị', 'error')
            }
          }}
        >
          <div className="space-y-6">
            {/* Existing units & barcodes */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Đơn vị hiện có</h4>
              {((detailedProduct?.productUnits || targetProduct?.productUnits || []).length === 0) ? (
                <div className="text-sm text-gray-500">Chưa có đơn vị.</div>
              ) : (
                <div className="space-y-3">
                  {(detailedProduct?.productUnits || targetProduct?.productUnits || []).map((u: any) => (
                    <div key={u.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{u.unitName || u.name}</span>
                          <span className="ml-2 text-gray-600">Hệ số:</span>
                          <input
                            type="number"
                            min={1}
                            className="ml-2 w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={unitCFEdit[u.unitId] ?? (u.conversionFactor ?? u.conversionRate ?? u.conversion_rate ?? 1)}
                            onChange={(e) => setUnitCFEdit(prev => ({ ...prev, [u.unitId]: Number(e.target.value) }))}
                          />
                          <button
                            type="button"
                            className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                            onClick={async () => {
                              try {
                                // Attempt both endpoints for compatibility
                                const cf = Number(unitCFEdit[u.unitId] ?? u.conversionFactor ?? u.conversionRate ?? 1)
                                try {
                                  await ProductService.updateProductUnit(targetProduct!.id, u.unitId, { conversionFactor: cf })
                                } catch (_) {
                                  await ProductService.updateProductUnitByProductUnitId(u.id ?? u.unitId, { conversionFactor: cf })
                                }
                                const fresh = await ProductService.getProductById(targetProduct!.id)
                                setDetailedProduct(fresh)
                                openNotify('Thành công', 'Đã cập nhật hệ số quy đổi', 'success')
                              } catch (err) {
                                openNotify('Thất bại', 'Không thể cập nhật hệ số', 'error')
                              }
                            }}
                          >Lưu</button>
                          {u.isDefault && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Mặc định</span>}
                        </div>
                        {!u.isDefault && (
                          <button
                            type="button"
                            className="text-xs text-green-700 hover:text-green-900"
                            onClick={async () => {
                              try {
                                await ProductService.makeDefaultProductUnit(targetProduct!.id, u.unitId)
                                const fresh = await ProductService.getProductById(targetProduct!.id)
                                setDetailedProduct(fresh)
                                await loadProducts()
                                openNotify('Thành công', 'Đã đặt đơn vị cơ bản', 'success')
                              } catch (err) {
                                openNotify('Thất bại', 'Không thể đặt đơn vị cơ bản', 'error')
                              }
                            }}
                          >Đặt đơn vị cơ bản</button>
                        )}
                      </div>
                      {/* Barcode inline editor (prefilled if exists) */}
                      <div className="mt-3 text-sm">
                        <div className="text-gray-700 font-medium mb-1">Barcode</div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Nhập barcode"
                            value={barcodeInputs[u.id]?.code || ''}
                            onChange={(e) => setBarcodeInputs(prev => ({ ...prev, [u.id]: { code: e.target.value, type: prev[u.id]?.type || 'EAN13' } }))}
                          />
              <select
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={barcodeInputs[u.id]?.type || 'EAN13'}
                            onChange={(e) => setBarcodeInputs(prev => ({ ...prev, [u.id]: { code: prev[u.id]?.code || '', type: e.target.value } }))}
                          >
                            <option value="EAN13">EAN13</option>
                            <option value="BARCODE">BARCODE</option>
                            <option value="QR_CODE">QR_CODE</option>
              </select>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            onClick={async () => {
                              const payload = barcodeInputs[u.id]
                              const productAny = detailedProduct as unknown as { barcodeList?: Array<{ id: number; productUnitId: number; code: string; type?: string }> }
                              const existing = (u.barcodes && (u as any).barcodes?.length > 0)
                                ? (u as any).barcodes[0]
                                : (productAny?.barcodeList || []).find(b => b.productUnitId === (u.id ?? u.unitId))
                              try {
                                const { BarcodeService } = await import('@/services/barcodeService')
                                if (existing && (!payload || !payload.code.trim())) {
                                  // delete if cleared
                                  await BarcodeService.deleteBarcode((existing as any).id)
                                } else if (!existing && payload && payload.code.trim()) {
                                  // add new
                                  await BarcodeService.addBarcode(u.id ?? u.unitId, payload.code.trim(), payload.type || 'EAN13')
                                } else if (existing && payload && payload.code.trim() && payload.code.trim() !== existing.code) {
                                  // replace
                                  await BarcodeService.deleteBarcode((existing as any).id)
                                  await BarcodeService.addBarcode(u.id ?? u.unitId, payload.code.trim(), payload.type || (existing as any).type || 'EAN13')
                                }
                                const fresh = await ProductService.getProductById(targetProduct!.id)
                                setDetailedProduct(fresh)
                                openNotify('Thành công', 'Đã lưu barcode', 'success')
                              } catch (err) {
                                openNotify('Thất bại', 'Không thể lưu barcode', 'error')
                              }
                            }}
                          >Lưu barcode</button>
            </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={unitForm.unitId}
                onChange={(e) => setUnitForm(prev => ({ ...prev, unitId: Number(e.target.value) }))}
              >
                <option value="">-- Chọn đơn vị --</option>
                {(() => {
                   const existing = new Set((targetProduct?.productUnits || []).map(u => u.unitId))
                  return allUnits
                     .filter(u => !existing.has(u.id))
                     .filter(u => !u.isDefault) // only non-default units selectable
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))
                })()}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hệ số quy đổi</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={unitForm.conversionFactor}
                onChange={(e) => setUnitForm(prev => ({ ...prev, conversionFactor: Number(e.target.value) }))}
              />
            </div>
            {(() => {
              const hasDefault = (detailedProduct?.productUnits || targetProduct?.productUnits || []).some((u: any) => u.isDefault)
              return (
            <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="mkDefaultUnit"
                    checked={unitForm.isDefault && !hasDefault}
                    disabled={hasDefault}
                    onChange={(e) => !hasDefault && setUnitForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded disabled:opacity-50"
                  />
                  <label htmlFor="mkDefaultUnit" className="text-sm text-gray-700">
                    Đặt làm đơn vị mặc định {hasDefault ? '(đã có mặc định)' : ''}
                  </label>
                </div>
              )
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode (tùy chọn)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={unitForm.barcodeCode}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, barcodeCode: e.target.value }))}
                  placeholder="VD: 8938505974xxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại barcode</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={unitForm.barcodeType}
                  onChange={(e) => setUnitForm(prev => ({ ...prev, barcodeType: e.target.value }))}
                >
                  <option value="EAN13">EAN13</option>
                  <option value="BARCODE">BARCODE</option>
                  <option value="QR_CODE">QR_CODE</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setUnitModalOpen(false)} className="px-4 py-2 rounded-md border text-gray-700">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700">Thêm đơn vị</button>
          </div>
        </form>
      </Modal>


      {/* Import Products Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import sản phẩm từ Excel"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!importFile) {
              openNotify('Thiếu file', 'Vui lòng chọn tệp Excel (.xlsx, .xls)', 'error')
              return
            }
            try {
              const result = await ProductService.importProductsExcel(importFile, {
                warehouseId: importWarehouseId ? Number(importWarehouseId) : undefined,
                stockLocationId: importStockLocationId ? Number(importStockLocationId) : undefined,
              })
              setIsImportModalOpen(false)
              setImportFile(null)
              setImportWarehouseId('')
              setImportStockLocationId('')
              await loadProducts()
              openNotify('Import thành công', `Tổng: ${result.totalRows}, Thành công: ${result.successCount}, Lỗi: ${result.errorCount}`, 'success')
            } catch (err) {
              openNotify('Import thất bại', 'Không thể import. Kiểm tra định dạng file hoặc dữ liệu.', 'error')
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn tệp Excel</label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng hỗ trợ: .xlsx, .xls. Cột mẫu: name, description, categoryId, ...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kho (Warehouse)</label>
                <select
                  value={importWarehouseId}
                  onChange={(e) => setImportWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Chọn kho (tùy chọn) --</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name || `Kho #${w.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí tồn (Stock location)</label>
                <select
                  value={importStockLocationId}
                  onChange={(e) => setImportStockLocationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Chọn vị trí (tùy chọn) --</option>
                  {stockLocations.map(sl => (
                    <option key={sl.id} value={sl.id}>{sl.name || `Vị trí #${sl.id}`} {sl.warehouseId ? `(Kho ${sl.warehouseId})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-md border text-gray-700">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-gray-700 hover:bg-gray-800">Import</button>
          </div>
        </form>
      </Modal>



      {/* Notification Modal */}
      <Modal
        isOpen={notify.open}
        onClose={closeNotify}
        title={notify.title}
        size="sm"
      >
        <div className={`flex items-start gap-3 ${notify.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          <div className={`mt-0.5 rounded-full h-6 w-6 flex items-center justify-center ${notify.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {notify.type === 'success' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            )}
          </div>
          <div className="text-sm">
            {notify.message}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={closeNotify} className={`px-4 py-2 rounded-md text-white ${notify.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>Đóng</button>
        </div>
      </Modal>
    </div>
  )
}

export default Admin

// Subcomponent: display a unit row with current price and barcode
const UnitRow = ({ productId, product, unit }: { productId: number; product: Product; unit: any }) => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const price = await ProductService.getCurrentPrice(productId, unit.id)
        if (!cancelled) setCurrentPrice(price)
      } catch {
        if (!cancelled) setCurrentPrice(null)
      }
    })()
    return () => { cancelled = true }
  }, [productId, unit?.id])

  const productAny = product as unknown as { barcodeList?: Array<{ productUnitId: number; code: string; type?: string }> }
  const barcodes = (unit.barcodes && unit.barcodes.length > 0)
    ? unit.barcodes
    : (productAny?.barcodeList || []).filter(b => b.productUnitId === (unit.id ?? unit.unitId))

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-md p-3">
      <div className="text-sm text-gray-800">
        <span className="font-medium">{unit.unitName}</span>
        <span className="ml-2 text-gray-600">Hệ số: {unit.conversionFactor ?? unit.conversionRate ?? 1}</span>
        {unit.isDefault && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">Đơn vị cơ bản</span>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-800">
          Giá hiện tại: {currentPrice !== null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentPrice) : '—'}
        </div>
        <div className="text-xs text-gray-600">
          {barcodes && barcodes.length > 0
            ? <span>Barcode: {barcodes[0].code} ({barcodes[0].type || 'EAN13'})</span>
            : <span className="text-gray-400">Chưa có barcode</span>}
        </div>
      </div>
    </div>
  )
}
