import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ProductService, Product, ProductCategory, CreateProductRequest, UpdateProductRequest } from '@/services/productService'
import { InventoryService, WarehouseDto, StockLocationDto } from '@/services/inventoryService'
import { Pagination, ProductTable, ProductForm, Modal, UnitManagement, ManagementDropdown, PriceManagement, AccountManagement, InventoryManagement, WarehouseTab, PromotionManagement, OrderManagement, BarcodeModal, AddBarcodeModal } from '@/components'
import CategoryManagement from '@/components/CategoryManagement'

const Admin = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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
  const [currentTab, setCurrentTab] = useState<'overview' | 'products' | 'categories' | 'units' | 'prices' | 'inventory' | 'warehouses' | 'accounts' | 'promotions' | 'orders'>('overview')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
  const [unitForm, setUnitForm] = useState<{ productId: number | ''; unitId: number | ''; conversionFactor: number; isDefault: boolean }>({ productId: '', unitId: '', conversionFactor: 1, isDefault: false })
  const [allUnits, setAllUnits] = useState<Array<{ id: number; name: string; isDefault?: boolean }>>([])

  // Barcode modal states
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null)
  const [isAddBarcodeModalOpen, setIsAddBarcodeModalOpen] = useState(false)
  // Import/Upload modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importWarehouseId, setImportWarehouseId] = useState<string>('')
  const [importStockLocationId, setImportStockLocationId] = useState<string>('')
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([])
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false)
  const [uploadTargetProductId, setUploadTargetProductId] = useState<number | ''>('')
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!isUnitModalOpen) return
    // Load all units once when modal opens
    ProductService.getUnits()
      .then(res => setAllUnits(res.map((u: any) => ({ id: u.id, name: u.name, isDefault: u.isDefault }))))
      .catch(() => setAllUnits([]))
  }, [isUnitModalOpen])

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
  }, [pagination.current_page, searchTerm, selectedCategory])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await ProductService.getProducts(
        pagination.current_page,
        pagination.items_per_page,
        searchTerm || undefined,
        selectedCategory
      )
      setProducts(response.products)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Error loading products:', error)
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
    setPagination(prev => ({ ...prev, current_page: 1 }))
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
        description: productData.description,
        imageUrl: productData.image_url || productData.imageUrl,
        expirationDate: productData.expiration_date || productData.expirationDate,
        categoryId: productData.category_id || productData.categoryId,
        active: (productData.active === 1) ? true : !!productData.active,
      }
      if (editingProduct) await ProductService.updateProduct(editingProduct.id, payload)
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

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await ProductService.deleteProduct(id)
        loadProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const handleAddBarcode = (product: Product) => {
    setSelectedProductForBarcode(product)
    setIsBarcodeModalOpen(true)
  }

  const handleBarcodeSuccess = () => {
    // Reload products to get updated barcode information
    loadProducts()
  }

  const handleAddBarcodeClick = () => {
    setIsAddBarcodeModalOpen(true)
  }


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trang quản trị</h1>
              <p className="text-gray-600">Chào mừng, {user?.fullName} ({user?.role})</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tổng quan
              </button>
              <ManagementDropdown
                currentTab={currentTab}
                onTabChange={setCurrentTab}
              />
              <button
                onClick={() => setCurrentTab('warehouses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'warehouses'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kho
              </button>
              <button
                onClick={() => setCurrentTab('accounts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'accounts'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tài khoản
              </button>
              <button
                onClick={() => setCurrentTab('promotions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'promotions'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Khuyến mãi
              </button>
              <button
                onClick={() => setCurrentTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  currentTab === 'orders'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đơn hàng
              </button>
            </nav>
          </div>

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

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Thao tác nhanh</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleAddProduct}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Thêm sản phẩm mới
                </button>
                <button
                  onClick={() => setCurrentTab('products')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Quản lý sản phẩm
                </button>
                <button
                  onClick={() => {
                    calculateStats()
                    alert('Dữ liệu đã được làm mới!')
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Làm mới dữ liệu
                </button>
              </div>
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Sản phẩm gần đây</h3>
                <button
                  onClick={() => setCurrentTab('products')}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã SP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{product.id}
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
                          —
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
          </div>
            </>
          )}

          {currentTab === 'products' && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tìm kiếm sản phẩm
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Nhập tên sản phẩm..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục
                    </label>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => handleCategoryFilter(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory(undefined)
                        setPagination(prev => ({ ...prev, current_page: 1 }))
                      }}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Danh sách sản phẩm ({pagination.total_items})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Import sản phẩm (Excel)
                      </button>
                      <button
                        onClick={() => setIsUploadImageModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Thêm ảnh cho sản phẩm
                      </button>
                      <button
                        onClick={handleAddBarcodeClick}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Thêm barcode
                      </button>
                      <button
                        onClick={() => setIsUnitModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Thêm đơn vị tính cho sản phẩm
                      </button>
                      <button
                        onClick={handleAddProduct}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Thêm sản phẩm mới
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
                      products={products}
                      categories={categories}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
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
            <PriceManagement />
          )}

          {currentTab === 'inventory' && (
            <InventoryManagement />
          )}

          {currentTab === 'warehouses' && (
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
        </div>
      </main>

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        size="lg"
      >
        <ProductForm
          product={editingProduct as any}
          categories={categories as any}
          onSubmit={handleSubmitProduct}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Modal thêm đơn vị tính cho sản phẩm */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Thêm đơn vị tính cho sản phẩm"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!unitForm.productId || !unitForm.unitId) {
              openNotify('Thiếu thông tin', 'Vui lòng chọn sản phẩm và đơn vị tính', 'error')
              return
            }
            try {
              const pid = Number(unitForm.productId)
              const uid = Number(unitForm.unitId)
              await ProductService.addProductUnit(pid, {
                unitId: uid,
                conversionFactor: Number(unitForm.conversionFactor),
                isDefault: false,
              })
              setIsUnitModalOpen(false)
              openNotify('Thành công', 'Đã thêm đơn vị tính cho sản phẩm', 'success')
              await loadProducts()
            } catch (err) {
              openNotify('Thất bại', 'Không thể thêm đơn vị tính. Vui lòng thử lại.', 'error')
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={unitForm.productId}
                onChange={(e) => setUnitForm(prev => ({ ...prev, productId: Number(e.target.value) }))}
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị tính</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={unitForm.unitId}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  let cf = unitForm.conversionFactor
                  const selected = e.target.options[e.target.selectedIndex]?.text?.toLowerCase()
                  if (selected?.includes('thùng')) cf = 24
                  else if (selected?.includes('lốc') || selected?.includes('pack')) cf = 6
                  setUnitForm(prev => ({ ...prev, unitId: value, conversionFactor: cf }))
                }}
              >
                <option value="">-- Chọn đơn vị --</option>
                {(() => {
                  const selectedProduct = products.find(p => p.id === Number(unitForm.productId))
                  const existingUnitIds = new Set((selectedProduct?.productUnits || []).map(u => u.unitId))
                  return allUnits
                    .filter(u => !existingUnitIds.has(u.id) && !u.isDefault)
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))
                })()}
              </select>
              <div className="mt-2 text-xs text-gray-500">Chỉ hiển thị các đơn vị chưa có trong sản phẩm và không đặt mặc định.</div>
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
              <p className="text-xs text-gray-500 mt-1">Gợi ý: Thùng = 24, Lốc = 6</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefaultUnit" checked={unitForm.isDefault} onChange={(e) => setUnitForm(prev => ({ ...prev, isDefault: e.target.checked }))} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
              <label htmlFor="isDefaultUnit" className="text-sm text-gray-700">Đặt làm đơn vị mặc định</label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-4 py-2 rounded-md border text-gray-700">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700">Hoàn thành</button>
          </div>
        </form>
      </Modal>

      {/* Barcode Modal */}
      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        product={selectedProductForBarcode}
        onSuccess={handleBarcodeSuccess}
      />

      {/* Add Barcode Modal */}
      <AddBarcodeModal
        isOpen={isAddBarcodeModalOpen}
        onClose={() => setIsAddBarcodeModalOpen(false)}
        products={products}
        onSuccess={handleBarcodeSuccess}
      />

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

      {/* Upload Product Image Modal */}
      <Modal
        isOpen={isUploadImageModalOpen}
        onClose={() => setIsUploadImageModalOpen(false)}
        title="Thêm/Cập nhật ảnh cho sản phẩm"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!uploadTargetProductId || !uploadImageFile) {
              openNotify('Thiếu thông tin', 'Vui lòng chọn sản phẩm và ảnh cần tải lên', 'error')
              return
            }
            try {
              await ProductService.updateProductImage(Number(uploadTargetProductId), uploadImageFile)
              setIsUploadImageModalOpen(false)
              setUploadTargetProductId('')
              setUploadImageFile(null)
              await loadProducts()
              openNotify('Thành công', 'Đã cập nhật ảnh sản phẩm', 'success')
            } catch (err) {
              openNotify('Thất bại', 'Không thể cập nhật ảnh. Vui lòng thử lại.', 'error')
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn sản phẩm</label>
              <select
                value={uploadTargetProductId}
                onChange={(e) => setUploadTargetProductId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ảnh</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadImageFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Hỗ trợ JPG, PNG, WEBP... dung lượng tối đa 5MB</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setIsUploadImageModalOpen(false)} className="px-4 py-2 rounded-md border text-gray-700">Hủy</button>
            <button type="submit" className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Cập nhật ảnh</button>
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
