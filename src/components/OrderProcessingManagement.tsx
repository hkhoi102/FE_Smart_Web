import React, { useEffect, useState } from 'react'
import { Order } from './OrderManagement'
import Modal from './Modal'
import OrderStatusTracker from './OrderStatusTracker'
import { OrderApi } from '../services/orderService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'
import { ReturnService } from '../services/returnService'
import ReturnProcessingManagement from './ReturnProcessingManagement'

const OrderProcessingManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [detailMap, setDetailMap] = useState<Record<number, { customerName?: string; paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'; paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'; discountAmount?: number; totalAmount?: number; updatedAt?: string }>>({})
  const [rawStatusMap, setRawStatusMap] = useState<Record<number, string>>({})
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null)
  const [unitInfoCache, setUnitInfoCache] = useState<Record<number, { productName?: string; unitName?: string }>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  // Deprecated local filter; use orderStatusFilter instead
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'DELIVERING'>('PENDING')
  const [activeSubTab, setActiveSubTab] = useState<'newOrders' | 'returnOrders'>('newOrders')

  // Map backend status to UI status
  const mapBackendStatusToUI = (status: string): Order['status'] => {
    switch (status) {
      case 'PENDING':
        return 'PENDING'
      case 'CONFIRMED':
      case 'DELIVERING':
        return 'PROCESSING'
      case 'COMPLETED':
        return 'COMPLETED'
      case 'CANCELLED':
        return 'CANCELLED'
      default:
        return 'PENDING'
    }
  }

  // Fetch orders from backend (pending/processing)
  useEffect(() => {
    let mounted = true
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        let arr: any[] = []
        if (orderStatusFilter === 'PENDING') {
          const res = await OrderApi.list({ page: 0, size: 20, status: 'PENDING' as any })
          arr = Array.isArray(res?.data) ? res.data : []
        } else if (orderStatusFilter === 'PROCESSING') {
          const c1 = await OrderApi.list({ page: 0, size: 20, status: 'CONFIRMED' as any })
          arr = Array.isArray(c1?.data) ? c1.data : []
        } else if (orderStatusFilter === 'DELIVERING') {
          const c2 = await OrderApi.list({ page: 0, size: 20, status: 'DELIVERING' as any })
          arr = Array.isArray(c2?.data) ? c2.data : []
        } else {
          const [p, c1, c2] = await Promise.all([
            OrderApi.list({ page: 0, size: 20, status: 'PENDING' as any }),
            OrderApi.list({ page: 0, size: 20, status: 'CONFIRMED' as any }),
            OrderApi.list({ page: 0, size: 20, status: 'DELIVERING' as any }),
          ])
          const a0 = Array.isArray(p?.data) ? p.data : []
          const a1 = Array.isArray(c1?.data) ? c1.data : []
          const a2 = Array.isArray(c2?.data) ? c2.data : []
          arr = [...a0, ...a1, ...a2]
        }
        const mapped: Order[] = arr.map((o: any) => ({
          id: o.id,
          created_at: o.createdAt ?? new Date().toISOString(),
          customer_id: o.customerId,
          promotion_applied_id: o.promotionAppliedId ?? undefined,
          status: mapBackendStatusToUI(o.status),
          total_amount: o.totalAmount ?? 0,
          updated_at: o.updatedAt ?? o.createdAt ?? new Date().toISOString(),
          discount_amount: o.discountAmount ?? 0,
          payment_method: (o.paymentMethod ?? 'COD') as any,
          payment_status: (o.paymentStatus ?? 'UNPAID') as any,
        }))
        if (mounted) {
          setOrders(mapped)
          const statusMap: Record<number, string> = {}
          arr.forEach((o: any) => { statusMap[o.id] = o.status })
          setRawStatusMap(statusMap)
        }

        // Enrich customerName from order detail
        // Prefer fetching names via customer service to ensure consistency
        const nameMap = await CustomerService.preloadNames(mapped.map(o => o.customer_id))
        const details = await Promise.all(mapped.map(o => OrderApi.getById(o.id).catch(() => null)))
        const map: Record<number, { customerName?: string; paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'; paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'; discountAmount?: number; totalAmount?: number; updatedAt?: string }> = {}
        details.forEach(d => {
          const data = (d as any)?.data
          if (data && typeof data.id === 'number') {
            map[data.id] = {
              customerName: nameMap[data.customerId] || data.customerName,
              paymentMethod: data.paymentMethod,
              paymentStatus: data.paymentStatus,
              discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : undefined,
              totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : undefined,
              updatedAt: data.updatedAt,
            }
          }
        })
        if (mounted) setDetailMap(map)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Không thể tải danh sách đơn hàng')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchOrders()
    return () => { mounted = false }
  }, [orderStatusFilter])

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
    try {
      const resp = await OrderApi.getById(order.id)
      const data = resp?.data || null
      setSelectedOrderDetail(data)
      // Preload unit info for items in this order
      if (data && Array.isArray(data.orderDetails)) {
        const unitIds = Array.from(new Set(data.orderDetails.map((d: any) => d.productUnitId))) as number[]
        const missing = unitIds.filter(id => !unitInfoCache[id])
        if (missing.length) {
          const results = await Promise.all(missing.map(id => ProductService.getProductUnitById(id)))
          const next = { ...unitInfoCache }
          results.forEach((info, idx) => {
            const key = missing[idx]
            if (info) next[key] = { productName: info.productName, unitName: info.unitName }
          })
          setUnitInfoCache(next)
        }
      }
    } catch {
      setSelectedOrderDetail(null)
    }
  }

  const handleConfirmOrder = async (id: number) => {
    // Bước xác nhận: chuyển trạng thái sang CONFIRMED (an toàn, không xuất kho)
    await OrderApi.updateStatus(id, 'CONFIRMED')
    // Remove from list since page chỉ hiển thị đơn chờ xử lý
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handleRejectOrder = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn từ chối đơn hàng này?')) {
      await OrderApi.updateStatus(id, 'CANCELLED')
      // Remove from list since không còn ở trạng thái chờ xử lý
      setOrders(prev => prev.filter(o => o.id !== id))
    }
  }

  const handleCompleteOrder = async (id: number) => {
    await OrderApi.updateStatus(id, 'COMPLETED')
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handleStartDelivery = async (id: number) => {
    await OrderApi.updateStatus(id, 'DELIVERING')
    // Remove from current list if filtering PENDING/PROCESSING
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handleSelectOrder = (id: number) => {
    setSelectedOrders(prev =>
      prev.includes(id)
        ? prev.filter(orderId => orderId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  const handleBulkConfirm = async () => {
    await Promise.all(selectedOrders.map(id => OrderApi.updateStatus(id, 'CONFIRMED')))
    setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)))
    setSelectedOrders([])
  }

  const handleBulkReject = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn từ chối ${selectedOrders.length} đơn hàng đã chọn?`)) {
      await Promise.all(selectedOrders.map(id => OrderApi.updateStatus(id, 'CANCELLED')))
      setOrders(prev => prev.filter(o => !selectedOrders.includes(o.id)))
      setSelectedOrders([])
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
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành'
      case 'PENDING': return 'Chờ xử lý'
      case 'PROCESSING': return 'Đang xử lý'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'UNPAID': return 'bg-red-100 text-red-800'
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán'
      case 'UNPAID': return 'Chưa thanh toán'
      case 'PARTIAL': return 'Thanh toán một phần'
      default: return status
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'COD': return 'Thanh toán khi nhận hàng'
      case 'BANK_TRANSFER': return 'Chuyển khoản'
      case 'CREDIT_CARD': return 'Thẻ tín dụng'
      default: return method
    }
  }

  // Use server-side filtered list; no client filter now
  const filteredOrders = orders

  // Stats
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length
  const processingOrders = orders.filter(o => o.status === 'PROCESSING').length
  const completedToday = orders.filter(o =>
    o.status === 'COMPLETED' &&
    new Date(o.updated_at).toDateString() === new Date().toDateString()
  ).length
  const urgentOrders = orders.filter(o =>
    o.status === 'PENDING' &&
    new Date().getTime() - new Date(o.created_at).getTime() > 2 * 60 * 60 * 1000 // 2 hours
  )

  return (
    <div className="space-y-6">
      {/* Inner Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'newOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveSubTab('newOrders')}
            >Đơn hàng mới</button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'returnOrders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveSubTab('returnOrders')}
            >Xử lý đơn trả về</button>
          </nav>
        </div>
      </div>

      {activeSubTab === 'returnOrders' ? (
        <ReturnProcessingManagement />
      ) : (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng đơn mới</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalOrders}</dd>
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
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chờ xử lý</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingOrders}</dd>
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
                  <span className="text-white text-sm font-medium">🔄</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đang xử lý</dt>
                  <dd className="text-lg font-medium text-gray-900">{processingOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Hoàn thành hôm nay</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🚨</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cần xử lý gấp</dt>
                  <dd className="text-lg font-medium text-gray-900">{urgentOrders.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Xử lý Đơn hàng Mới</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Lọc:</span>
            <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-300">
              <button onClick={()=> setOrderStatusFilter('ALL')} className={`px-3 py-1.5 text-sm ${orderStatusFilter==='ALL'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Tất cả</button>
              <button onClick={()=> setOrderStatusFilter('PENDING')} className={`px-3 py-1.5 text-sm border-l border-gray-300 ${orderStatusFilter==='PENDING'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Chờ xử lý</button>
              <button onClick={()=> setOrderStatusFilter('PROCESSING')} className={`px-3 py-1.5 text-sm border-l border-gray-300 ${orderStatusFilter==='PROCESSING'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Đang xử lý</button>
              <button onClick={()=> setOrderStatusFilter('DELIVERING')} className={`px-3 py-1.5 text-sm border-l border-gray-300 ${orderStatusFilter==='DELIVERING'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Đang giao</button>
            </div>
          </div>
        </div>

        {selectedOrders.length > 0 && (
          <div className="flex items-center space-x-4 mb-4 p-4 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-600">
              Đã chọn {selectedOrders.length} đơn hàng
            </span>

            <button
              onClick={handleBulkConfirm}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Xác nhận hàng loạt
            </button>

            <button
              onClick={handleBulkReject}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Từ chối hàng loạt
            </button>

            <button
              onClick={() => setSelectedOrders([])}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading && (
            <div className="p-4 text-sm text-gray-500">Đang tải danh sách đơn hàng...</div>
          )}
          {error && (
            <div className="p-4 text-sm text-red-600">{error}</div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian đặt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thanh toán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 ${urgentOrders.some(o => o.id === order.id) ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                    {urgentOrders.some(o => o.id === order.id) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Gấp
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {detailMap[order.id]?.customerName ? detailMap[order.id]?.customerName : `#${order.customer_id}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(detailMap[order.id]?.totalAmount ?? order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {rawStatusMap[order.id] === 'DELIVERING' ? 'Đang giao' : getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor((detailMap[order.id]?.paymentStatus as any) || order.payment_status)}`}>
                      {getPaymentStatusLabel((detailMap[order.id]?.paymentStatus as any) || order.payment_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem
                      </button>

                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Xác nhận
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      {rawStatusMap[order.id] === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStartDelivery(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Bắt đầu giao
                        </button>
                      )}
                      {rawStatusMap[order.id] === 'DELIVERING' && (
                        <button
                          onClick={() => handleCompleteOrder(order.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Hoàn thành
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chi tiết đơn hàng"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Đơn hàng</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Khách hàng</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.customer_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Thời gian đặt</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cập nhật lần cuối</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.updated_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency((selectedOrderDetail?.totalAmount ?? detailMap[selectedOrder.id!]?.totalAmount) ?? selectedOrder.total_amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Giảm giá</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency((selectedOrderDetail?.discountAmount ?? detailMap[selectedOrder.id!]?.discountAmount) ?? selectedOrder.discount_amount)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái thanh toán</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor((selectedOrderDetail?.paymentStatus as any) || selectedOrder.payment_status)}`}>
                  {getPaymentStatusLabel((selectedOrderDetail?.paymentStatus as any) || selectedOrder.payment_status)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
              <p className="mt-1 text-sm text-gray-900">{getPaymentMethodLabel((selectedOrderDetail?.paymentMethod as any) || selectedOrder.payment_method)}</p>
            </div>

            {selectedOrder.promotion_applied_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Khuyến mãi</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.promotion_applied_id}</p>
              </div>
            )}

            {/* Order Status Tracker */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Tiến trình đơn hàng</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <OrderStatusTracker
                  status={selectedOrder.status}
                  paymentStatus={selectedOrder.payment_status}
                  createdAt={selectedOrder.created_at}
                  updatedAt={selectedOrder.updated_at}
                />
              </div>
            </div>

            {/* Return order controls */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Xử lý đơn trả về (nếu có)</label>
              <div className="bg-white border rounded-lg p-4 space-y-3">
                {selectedOrderDetail?.returnOrder ? (
                  <>
                    <div className="text-sm text-gray-700">
                      Mã trả hàng: #{selectedOrderDetail.returnOrder.id} • Trạng thái hiện tại: {selectedOrderDetail.returnOrder.status}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrderDetail.returnOrder.status === 'REQUESTED' && (
                        <button
                          onClick={async () => { await ReturnService.approve(selectedOrderDetail.returnOrder.id); const r = await ReturnService.getById(selectedOrderDetail.returnOrder.id); setSelectedOrderDetail((prev:any)=> ({...prev, returnOrder: r.data})) }}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >Duyệt</button>
                      )}
                      {selectedOrderDetail.returnOrder.status === 'REQUESTED' && (
                        <button
                          onClick={async () => { await ReturnService.reject(selectedOrderDetail.returnOrder.id); const r = await ReturnService.getById(selectedOrderDetail.returnOrder.id); setSelectedOrderDetail((prev:any)=> ({...prev, returnOrder: r.data})) }}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >Từ chối</button>
                      )}
                      {selectedOrderDetail.returnOrder.status === 'APPROVED' && (
                        <button
                          onClick={async () => { await ReturnService.complete(selectedOrderDetail.returnOrder.id); const r = await ReturnService.getById(selectedOrderDetail.returnOrder.id); setSelectedOrderDetail((prev:any)=> ({...prev, returnOrder: r.data})) }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >Hoàn thành</button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Không có yêu cầu trả hàng cho đơn này.</div>
                )}
              </div>
            </div>

            {/* Products list */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Danh sách sản phẩm</label>
              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedOrderDetail?.orderDetails || []).map((item: any, idx: number) => {
                      const unitInfo = unitInfoCache[item.productUnitId]
                      return (
                        <tr key={item.id || idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unitInfo?.productName || `#${item.productUnitId}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unitInfo?.unitName || ''}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.subtotal ?? (item.unitPrice * item.quantity))}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              {selectedOrder.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      handleConfirmOrder(selectedOrder.id)
                      setIsModalOpen(false)
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Xác nhận đơn hàng
                  </button>
                  <button
                    onClick={() => {
                      handleRejectOrder(selectedOrder.id)
                      setIsModalOpen(false)
                    }}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Từ chối đơn hàng
                  </button>
                </>
              )}

              {selectedOrder.status === 'PROCESSING' && (
                <button
                  onClick={() => {
                    handleCompleteOrder(selectedOrder.id)
                    setIsModalOpen(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Hoàn thành đơn hàng
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderProcessingManagement
