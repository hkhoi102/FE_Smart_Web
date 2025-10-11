import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CategoryMenu from '../components/CategoryMenu'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import { ProductService } from '../services/productService'

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsData, setProductsData] = useState<{
    products: any[]
    totalCount: number
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }>({
    products: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Handle URL search params
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search')
    const urlCategoryId = searchParams.get('categoryId')
    const urlCategoryName = searchParams.get('category')

    if (urlSearchTerm) {
      setSearchTerm(urlSearchTerm)
      setSelectedCategory(null) // Clear category filter when searching from header
    }

    if (urlCategoryId && urlCategoryName) {
      setSelectedCategory({ id: parseInt(urlCategoryId), name: urlCategoryName })
      setSearchTerm('') // Clear search when filtering by category
    }
  }, [searchParams])

  // Fetch products from API
  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await ProductService.getProducts(
        currentPage,
        20,
        searchTerm || undefined,
        selectedCategory?.id
      )

      setProductsData({
        products: response.products,
        totalCount: response.pagination.total_items,
        currentPage: response.pagination.current_page,
        totalPages: response.pagination.total_pages,
        hasNextPage: response.pagination.current_page < response.pagination.total_pages,
        hasPrevPage: response.pagination.current_page > 1
      })

      console.log('Products loaded:', {
        currentPage: response.pagination.current_page,
        totalPages: response.pagination.total_pages,
        totalCount: response.pagination.total_items,
        productsCount: response.products.length
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.')
      // Set empty data on error
      setProductsData({
        products: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      })
    } finally {
      setLoading(false)
    }
  }

  // Load products when dependencies change
  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, searchTerm, priceRange.min, priceRange.max, sortBy, sortOrder])

  // Reset to page 1 when filters change (but not on initial load)
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, searchTerm, priceRange.min, priceRange.max])


  const handleCategorySelect = (category: { id: number; name: string }) => {
    setSelectedCategory(category)
    setCurrentPage(1)
    // Update URL params
    setSearchParams({ categoryId: category.id.toString(), category: category.name })
  }


  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPriceRange({ min: '', max: '' })
    setSortBy('name')
    setSortOrder('asc')
    setSelectedCategory(null)
    setCurrentPage(1)
    // Clear URL search params
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Category Menu */}
          <div className="lg:w-64 flex-shrink-0">
            <CategoryMenu
              initialActive={0}
              activeCategory={selectedCategory?.name}
              onSelect={handleCategorySelect}
            />

            {/* Filters */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
              </div>
              <div className="p-6">

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm, danh mục, đơn vị..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoảng giá
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                      placeholder="Từ"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                      placeholder="Đến"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
              </div>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Xóa bộ lọc
              </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    Hiển thị {productsData.products.length} / {productsData.totalCount} sản phẩm
                  </span>
                  {searchTerm && (
                    <span className="text-sm text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      Tìm kiếm: "{searchTerm}"
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="text-sm text-gray-500">
                      trong danh mục "{selectedCategory.name}"
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Sắp xếp theo:</span>
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field as 'name' | 'price' | 'rating')
                      setSortOrder(order as 'asc' | 'desc')
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="name-asc">Tên A-Z</option>
                    <option value="name-desc">Tên Z-A</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                    <option value="rating-desc">Đánh giá cao nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-600">Đang tải sản phẩm...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={loadProducts}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && productsData.products.length > 0 && (() => {
              // Create separate products for each unit
              const expandedProducts = productsData.products.flatMap((product: any) => {
                if (product.productUnits && product.productUnits.length > 0) {
                  return product.productUnits.map((unit: any) => ({
                    ...product,
                    id: `${product.id}-${unit.id}`, // Unique ID for each unit
                    productUnits: [unit], // Only this unit
                    currentUnit: unit
                  }))
                }
                return [product]
              })

              console.log('🔍 Debug - Expanded products:', expandedProducts)

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {expandedProducts.map((product: any) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              )
            })()}

            {/* Empty State */}
            {!loading && !error && productsData.products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500">Thử thay đổi bộ lọc hoặc danh mục để tìm sản phẩm khác.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && productsData.totalCount > 0 && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="text-sm text-gray-600">
                  Trang {productsData.currentPage} / {productsData.totalPages}
                  (Hiển thị {productsData.products.length} / {productsData.totalCount} sản phẩm)
                </div>
                <Pagination
                  pagination={{
                    current_page: productsData.currentPage,
                    total_pages: productsData.totalPages,
                    total_items: productsData.totalCount,
                    items_per_page: 20
                  }}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Products
