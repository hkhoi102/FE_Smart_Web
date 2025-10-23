import React, { useState, useEffect } from 'react'
import { ReturnOrderService, ReturnOrderResponse } from '../services/returnOrderService'
import ReturnedOrderDetailModal from '../components/ReturnedOrderDetailModal'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalElements: number
  size: number
}

const ReturnedOrdersPage: React.FC = () => {
  const [returnedOrders, setReturnedOrders] = useState<ReturnOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10
  })
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrderResponse | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<ReturnOrderResponse[]>([])

  useEffect(() => {
    fetchReturnedOrders()
  }, [])

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(returnedOrders)
    } else {
      const filtered = returnedOrders.filter(order => {
        const returnCode = order.returnCode || `#${order.id}`
        return returnCode.toLowerCase().includes(searchTerm.toLowerCase())
      })
      setFilteredOrders(filtered)
    }
  }, [searchTerm, returnedOrders])

  const fetchReturnedOrders = async (page: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const response = await ReturnOrderService.getCompletedReturns({
        page,
        size: 10
      })

      // Try different response formats
      let orders = []
      let paginationInfo = {
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        size: 10
      }

      // Format 1: {success: true, data: {data: [], ...}}
      if (response.success && response.data) {
        orders = response.data.data || []
        paginationInfo = {
          currentPage: response.data.currentPage || 0,
          totalPages: response.data.totalPages || 0,
          totalElements: response.data.totalElements || 0,
          size: response.data.size || 10
        }
      }
      // Format 2: Direct data array
      else if (Array.isArray(response)) {
        orders = response
        paginationInfo = {
          currentPage: 0,
          totalPages: 1,
          totalElements: response.length,
          size: 10
        }
      }
      // Format 3: {data: [], ...} without success field
      else if (response.data && Array.isArray(response.data)) {
        orders = response.data
        paginationInfo = {
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0,
          size: response.size || 10
        }
      }
      // Format 4: {content: [], ...} (Spring Boot format)
      else if (response.content && Array.isArray(response.content)) {
        orders = response.content
        paginationInfo = {
          currentPage: response.number || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0,
          size: response.size || 10
        }
      }
      // Format 5: {result: [], ...} or {items: [], ...}
      else if (response.result && Array.isArray(response.result)) {
        orders = response.result
        paginationInfo = {
          currentPage: response.page || 0,
          totalPages: response.totalPages || 1,
          totalElements: response.total || response.result.length,
          size: response.size || 10
        }
      }
      else if (response.items && Array.isArray(response.items)) {
        orders = response.items
        paginationInfo = {
          currentPage: response.page || 0,
          totalPages: response.totalPages || 1,
          totalElements: response.total || response.items.length,
          size: response.size || 10
        }
      }
      else {
        setError('Không thể tải danh sách đơn hàng đã hoàn trả')
        return
      }

      setReturnedOrders(orders)
      setPagination(paginationInfo)
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    fetchReturnedOrders(newPage)
  }

  const handleViewDetail = async (order: ReturnOrderResponse) => {
    try {
      setLoading(true)
      const response = await ReturnOrderService.getReturnOrderById(order.id)

      let orderDetail = null

      // Try different response formats for detail
      // Format 1: {success: true, data: {...}}
      if (response.success && response.data) {
        orderDetail = response.data
      }
      // Format 2: Direct object
      else if (response && typeof response === 'object' && !response.success) {
        orderDetail = response
      }
      // Format 3: {data: {...}} without success field
      else if (response.data && typeof response.data === 'object') {
        orderDetail = response.data
      }
      else {
        setError('Không thể tải chi tiết đơn hàng')
        return
      }

      if (orderDetail) {
        // Fetch additional data
        const enhancedOrderDetail = await enhanceOrderDetail(orderDetail)
        setSelectedOrder(enhancedOrderDetail)
        setShowDetailModal(true)
      } else {
        setError('Không thể tải chi tiết đơn hàng')
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải chi tiết đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const enhanceOrderDetail = async (orderDetail: any) => {
    try {
      // Import services
      const { OrderApi } = await import('../services/orderService')
      const { ProductService } = await import('../services/productService')

      // Get original order information
      let orderCode = orderDetail.orderCode
      if (!orderCode && orderDetail.orderId) {
        try {
          const orderResponse = await OrderApi.getById(orderDetail.orderId)
          if (orderResponse.success && orderResponse.data) {
            orderCode = orderResponse.data.orderCode || orderResponse.data.order_code
          }
        } catch (err) {
          console.warn('Could not fetch order details:', err)
        }
      }

      // Get product information for return details
      if (orderDetail.returnDetails && Array.isArray(orderDetail.returnDetails)) {
        const enhancedReturnDetails = await Promise.all(
          orderDetail.returnDetails.map(async (detail: any) => {
            try {
              if (detail.productUnitId) {
                const productInfo = await ProductService.getProductUnitById(detail.productUnitId)
                if (productInfo) {
                  return {
                    ...detail,
                    productName: productInfo.productName || detail.productName || 'Sản phẩm không xác định',
                    unitName: productInfo.unitName || detail.unitName || 'Đơn vị không xác định'
                  }
                }
              }
              return {
                ...detail,
                productName: detail.productName || 'Sản phẩm không xác định',
                unitName: detail.unitName || 'Đơn vị không xác định'
              }
            } catch (err) {
              console.warn('Could not fetch product info for unit:', detail.productUnitId, err)
              return {
                ...detail,
                productName: detail.productName || 'Sản phẩm không xác định',
                unitName: detail.unitName || 'Đơn vị không xác định'
              }
            }
          })
        )

        return {
          ...orderDetail,
          orderCode: orderCode || `#${orderDetail.orderId}`,
          returnDetails: enhancedReturnDetails
        }
      }

      return {
        ...orderDetail,
        orderCode: orderCode || `#${orderDetail.orderId}`
      }
    } catch (err) {
      console.warn('Error enhancing order detail:', err)
      return orderDetail
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Đã hoàn trả'
      case 'APPROVED': return 'Đã duyệt'
      case 'REQUESTED': return 'Chờ duyệt'
      case 'REJECTED': return 'Từ chối'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && returnedOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách đơn hàng đã hoàn trả...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Đơn hàng đã hoàn trả</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Danh sách các đơn hàng đã được hoàn trả thành công
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalElements}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Trang hiện tại</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.currentPage + 1}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng trang</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.totalPages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm theo mã đơn trả
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập mã đơn trả để tìm kiếm..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                Tìm thấy {filteredOrders.length} đơn hàng với mã chứa "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng đã hoàn trả</h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Không tìm thấy đơn hàng nào' : 'Không có đơn hàng nào'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `Không có đơn hàng nào có mã chứa "${searchTerm}"` : 'Chưa có đơn hàng nào được hoàn trả.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn trả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lý do trả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền hoàn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      onClick={() => handleViewDetail(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.returnCode || `#${order.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={order.reason}>
                          {order.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(order.totalRefundAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!searchTerm && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {searchTerm ? (
                    <>Hiển thị {filteredOrders.length} kết quả tìm kiếm cho "{searchTerm}"</>
                  ) : (
                    <>Hiển thị {returnedOrders.length} trong tổng số {pagination.totalElements} đơn hàng</>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 0}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <span className="px-3 py-1 text-sm text-gray-700">
                    Trang {pagination.currentPage + 1} / {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages - 1}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <ReturnedOrderDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedOrder(null)
          }}
          order={selectedOrder}
        />
      )}
    </div>
  )
}

export default ReturnedOrdersPage
