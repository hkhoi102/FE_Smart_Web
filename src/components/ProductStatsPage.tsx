import { useState, useEffect } from 'react'
import { ProductService, Product } from '@/services/productService'
import { productStatsService, ProductAnalytics } from '@/services/productStatsService'

interface ProductStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  totalCategories: number
  averagePrice: number
  topSellingProducts: Product[]
  categoryDistribution: Array<{
    categoryName: string
    count: number
    percentage: number
  }>
}

interface ProductAnalyticsData {
  bestSelling: ProductAnalytics[]
  worstSelling: ProductAnalytics[]
}

const ProductStatsPage = () => {
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [analyticsData, setAnalyticsData] = useState<ProductAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity')
  const [limit, setLimit] = useState<number>(10)

  // Khởi tạo ngày mặc định (30 ngày gần nhất)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      loadProductStats()
      loadAnalyticsData()
    }
  }, [startDate, endDate, sortBy, limit])

  const loadProductStats = async () => {
    try {
      // Lấy tất cả sản phẩm
      const productsResponse = await ProductService.getProducts(1, 1000)
      const products = productsResponse.products

      // Lấy danh mục
      const categories = await ProductService.getCategories()

      // Tính toán thống kê
      const totalProducts = products.length
      const activeProducts = products.filter(p => p.active).length
      const inactiveProducts = totalProducts - activeProducts

      // Tính giá trung bình (giả sử có giá từ productUnits)
      let totalPrice = 0
      let priceCount = 0
      products.forEach(product => {
        if (product.productUnits && product.productUnits.length > 0) {
          product.productUnits.forEach(unit => {
            // Giả sử có trường price trong unit
            if ((unit as any).price) {
              totalPrice += (unit as any).price
              priceCount++
            }
          })
        }
      })
      const averagePrice = priceCount > 0 ? totalPrice / priceCount : 0

      // Top sản phẩm (giả sử có trường sales hoặc popularity)
      const topSellingProducts = products
        .sort((a, b) => {
          const aSales = (a as any).sales || 0
          const bSales = (b as any).sales || 0
          return bSales - aSales
        })
        .slice(0, 5)

      // Phân bố theo danh mục
      const categoryMap = new Map<string, number>()
      products.forEach(product => {
        const categoryName = product.categoryName || `Danh mục ${product.categoryId}`
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1)
      })

      const categoryDistribution = Array.from(categoryMap.entries()).map(([categoryName, count]) => ({
        categoryName,
        count,
        percentage: (count / totalProducts) * 100
      })).sort((a, b) => b.count - a.count)

      setStats({
        totalProducts,
        activeProducts,
        inactiveProducts,
        totalCategories: categories.length,
        averagePrice,
        topSellingProducts,
        categoryDistribution
      })
    } catch (err) {
      console.error('Error loading product stats:', err)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('Loading analytics data...', { startDate, endDate, sortBy, limit })

      let bestSelling, worstSelling

      if (sortBy === 'revenue') {
        // Sử dụng API riêng cho doanh thu
        [bestSelling, worstSelling] = await Promise.all([
          productStatsService.getBestSellingProductsByRevenue(startDate, endDate, limit),
          productStatsService.getWorstSellingProductsByRevenue(startDate, endDate, limit)
        ])
      } else {
        // Sử dụng API chung cho số lượng
        [bestSelling, worstSelling] = await Promise.all([
          productStatsService.getBestSellingProducts(startDate, endDate, sortBy, limit),
          productStatsService.getWorstSellingProducts(startDate, endDate, sortBy, limit)
        ])
      }

      console.log('Analytics data loaded:', { bestSelling, worstSelling })
      setAnalyticsData({
        bestSelling,
        worstSelling
      })
    } catch (err) {
      console.error('Error loading analytics data:', err)
      // Không set error để tránh trang trắng, chỉ log lỗi
      setAnalyticsData({
        bestSelling: [],
        worstSelling: []
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Không return early để tránh trang trắng

  try {
    console.log('Rendering ProductStatsPage:', {
      stats: !!stats,
      analyticsData: !!analyticsData,
      loading,
      error
    })

    return (
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thống kê sản phẩm</h1>
        <p className="text-gray-600">Tổng quan về tình hình sản phẩm trong hệ thống</p>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Thống kê theo:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'quantity' | 'revenue')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="quantity">Số lượng</option>
              <option value="revenue">Doanh thu</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Số lượng hiển thị:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {(() => {
        console.log('Rendering stats cards:', { loading, stats: !!stats })
        if (loading && !stats) {
          return (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )
        }
        return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sản phẩm hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sản phẩm ngừng hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.inactiveProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng danh mục</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCategories || 0}</p>
            </div>
          </div>
        </div>
      </div>
        )
      })()}

      {/* Analytics Overview removed (backend không cung cấp endpoint) */}

      {/* Best Selling and Worst Selling Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sản phẩm bán chạy nhất
              {sortBy === 'quantity' ? '' : ''}
            </h2>
          </div>
          <div className="p-6">
            {(() => {
              console.log('Rendering best selling:', { loading, analyticsData: !!analyticsData, bestSelling: analyticsData?.bestSelling?.length })
              if (loading) {
                return (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                )
              }
              if (!analyticsData?.bestSelling || analyticsData.bestSelling.length === 0) {
                return (
                  <div className="text-center text-gray-500 py-8">
                    <p>Không có dữ liệu sản phẩm bán chạy</p>
                  </div>
                )
              }
              return (
              <div className="space-y-4">
                {analyticsData?.bestSelling?.map((product, index) => {
                  const maxValue = analyticsData?.bestSelling && analyticsData.bestSelling.length > 0
                    ? Math.max(...analyticsData.bestSelling.map(p => sortBy === 'quantity' ? p.quantity : p.revenue))
                    : 0
                  const currentValue = sortBy === 'quantity' ? (product.quantity || 0) : (product.revenue || 0)
                  const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0

                  return (
                    <div key={product.productUnitId} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">{product.productName}</span>
                          <span className="text-sm text-gray-500">
                            {sortBy === 'quantity'
                              ? `${(product.quantity || 0).toLocaleString()} sản phẩm`
                              : formatCurrency(product.revenue || 0)
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.categoryName && `${product.categoryName} • `}
                          {formatCurrency(product.averagePrice || 0)}/đơn vị
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              )
            })()}
          </div>
        </div>

        {/* Worst Selling Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Sản phẩm bán chậm nhất
              {sortBy === 'quantity' ? '' : ''}
            </h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : (!analyticsData?.worstSelling || analyticsData.worstSelling.length === 0) ? (
              <div className="text-center text-gray-500 py-8">
                <p>Không có dữ liệu sản phẩm bán chậm</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyticsData?.worstSelling?.map((product, index) => {
                  const maxValue = analyticsData?.worstSelling && analyticsData.worstSelling.length > 0
                    ? Math.max(...analyticsData.worstSelling.map(p => sortBy === 'quantity' ? p.quantity : p.revenue))
                    : 0
                  const currentValue = sortBy === 'quantity' ? (product.quantity || 0) : (product.revenue || 0)
                  const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0

                  return (
                    <div key={product.productUnitId} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">{product.productName}</span>
                          <span className="text-sm text-gray-500">
                            {sortBy === 'quantity'
                              ? `${(product.quantity || 0).toLocaleString()} sản phẩm`
                              : formatCurrency(product.revenue || 0)
                            }
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.categoryName && `${product.categoryName} • `}
                          {formatCurrency(product.averagePrice || 0)}/đơn vị
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Phân bố theo danh mục</h2>
          </div>
          <div className="p-6">
            {(!stats?.categoryDistribution || stats?.categoryDistribution?.length === 0) ? (
              <div className="text-center text-gray-500 py-8">
                <p>Không có dữ liệu phân bố danh mục</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.categoryDistribution?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{item.categoryName}</span>
                        <span className="text-sm text-gray-500">{item.count} sản phẩm</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sản phẩm nổi bật</h2>
          </div>
          <div className="p-6">
            {(!stats?.topSellingProducts || stats?.topSellingProducts?.length === 0) ? (
              <div className="text-center text-gray-500 py-8">
                <p>Không có dữ liệu sản phẩm nổi bật</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.topSellingProducts?.map((product, index) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.categoryName || `Danh mục ${product.categoryId}`}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-sm font-medium text-gray-900">{product.code || `SP${product.id}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tóm tắt thống kê</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Thông tin cơ bản</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Tổng sản phẩm:</dt>
                  <dd className="text-sm font-medium text-gray-900">{stats?.totalProducts || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Sản phẩm hoạt động:</dt>
                  <dd className="text-sm font-medium text-gray-900">{stats?.activeProducts || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Sản phẩm ngừng hoạt động:</dt>
                  <dd className="text-sm font-medium text-gray-900">{stats?.inactiveProducts || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Tổng danh mục:</dt>
                  <dd className="text-sm font-medium text-gray-900">{stats?.totalCategories || 0}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Tỷ lệ</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Tỷ lệ hoạt động:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats && stats.totalProducts > 0 ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1) : 0}%
                  </dd>
                </div>
                {/* <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Giá trung bình:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats && stats.averagePrice > 0 ? formatCurrency(stats.averagePrice) : 'Chưa có dữ liệu'}
                  </dd>
                </div> */}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  } catch (error) {
    console.error('Error rendering ProductStatsPage:', error)
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thống kê sản phẩm</h1>
          <p className="text-red-600">Có lỗi xảy ra khi tải trang. Vui lòng thử lại.</p>
        </div>
      </div>
    )
  }
}

export default ProductStatsPage
