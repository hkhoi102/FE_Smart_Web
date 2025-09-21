import React, { useEffect, useState } from 'react'
import { Order } from './OrderManagement'
import Modal from './Modal'
import OrderStatusTracker from './OrderStatusTracker'
import { OrderApi } from '../services/orderService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'

// Keeping detail shape flexible; concrete mapping happens at render time

const OrderListManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [detailMap, setDetailMap] = useState<Record<number, { customerName?: string; paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'; paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL'; discountAmount?: number }>>({})

  // Mock order details data
  const [orderDetailsMap, setOrderDetailsMap] = useState<Record<number, Array<{ id: number; productUnitId: number; quantity: number; unitPrice: number; subtotal: number; productName?: string; unitName?: string }>>>({})
  const [unitInfoCache, setUnitInfoCache] = useState<Record<number, { productName?: string; unitName?: string }>>({})

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'products'>('info')
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [bulkStatus, setBulkStatus] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING'>('PENDING')
  // bulk payment status controls are not used on this page (placeholder removed)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL')
  const mapBackendStatusToUI = (status: string): Order['status'] => {
    switch (status) {
      case 'PENDING': return 'PENDING'
      case 'CONFIRMED':
      case 'DELIVERING': return 'PROCESSING'
      case 'COMPLETED': return 'COMPLETED'
      case 'CANCELLED': return 'CANCELLED'
      default: return 'PENDING'
    }
  }

  const mapUIStatusToBackend = (status: Order['status']): 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED' => {
    switch (status) {
      case 'PENDING': return 'PENDING'
      case 'PROCESSING': return 'DELIVERING'
      case 'COMPLETED': return 'COMPLETED'
      case 'CANCELLED': return 'CANCELLED'
      default: return 'PENDING'
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await OrderApi.list({ page: 0, size: 50 })
      const arr = Array.isArray(res?.data) ? res.data : []
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
      setOrders(mapped)

      // Preload customer names
      const customerIds = mapped.map(o => o.customer_id)
      const nameMap = await CustomerService.preloadNames(customerIds)

      // Fetch order details for each order to display products tab
      const detailsResp = await Promise.all(mapped.map(o => OrderApi.getById(o.id).catch(() => null)))
      const detailMap: Record<number, Array<{ id: number; productUnitId: number; quantity: number; unitPrice: number; subtotal: number; productName?: string; unitName?: string }>> = {}
      const unitIds: number[] = []
      detailsResp.forEach(d => {
        const data = (d as any)?.data
        if (data && typeof data.id === 'number' && Array.isArray(data.orderDetails)) {
          const items = data.orderDetails.map((od: any) => ({
            id: od.id ?? od.orderDetailId ?? Math.random(),
            productUnitId: od.productUnitId,
            quantity: od.quantity,
            unitPrice: od.unitPrice,
            subtotal: od.subtotal ?? (od.unitPrice * od.quantity),
          }))
          detailMap[data.id] = items
          items.forEach((i: any) => unitIds.push(i.productUnitId))
        }
      })
      // Preload unit info (productName, unitName)
      const uniqueUnitIds = Array.from(new Set(unitIds)) as number[]
      const unitResults = await Promise.all(uniqueUnitIds.map(id => ProductService.getProductUnitById(id)))
      const unitMap: Record<number, { productName?: string; unitName?: string }> = { ...unitInfoCache }
      unitResults.forEach((info, idx) => {
        const key = uniqueUnitIds[idx]
        if (info) unitMap[key] = { productName: info.name, unitName: info.unitName }
      })
      // Attach names into details
      Object.keys(detailMap).forEach((orderId) => {
        detailMap[Number(orderId)] = detailMap[Number(orderId)].map(item => ({
          ...item,
          productName: unitMap[item.productUnitId]?.productName,
          unitName: unitMap[item.productUnitId]?.unitName,
        }))
      })
      setUnitInfoCache(unitMap)
      setOrderDetailsMap(detailMap)

      // Enrich with details (payment, discount, customer name) which are not included in summary
      const details = await Promise.all(mapped.map(o => OrderApi.getById(o.id).catch(() => null)))
      const map: Record<number, { customerName?: string; paymentMethod?: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'; paymentStatus?: 'PAID' | 'UNPAID'; discountAmount?: number }> = {}
      details.forEach(d => {
        const data = (d as any)?.data
        if (data && typeof data.id === 'number') {
          map[data.id] = {
            customerName: nameMap[data.customerId] || data.customerName,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
            discountAmount: typeof data.discountAmount === 'number' ? data.discountAmount : undefined,
          }
        }
      })
      setDetailMap(map)
    } catch (e: any) {
      setError(e?.message || 'Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'>('ALL')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [sortBy, setSortBy] = useState<'id' | 'created_at' | 'updated_at' | 'total_amount' | 'customer_id'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [formData, setFormData] = useState({
    customer_id: 0,
    promotion_applied_id: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING',
    total_amount: 0,
    discount_amount: 0,
    payment_method: 'COD' as 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD',
    payment_status: 'UNPAID' as 'PAID' | 'UNPAID' | 'PARTIAL'
  })

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setActiveDetailTab('info')
    setIsModalOpen(true)
  }

  const handleEdit = (order: Order) => {
    setEditingOrder(order)
    setFormData({
      customer_id: order.customer_id,
      promotion_applied_id: order.promotion_applied_id?.toString() || '',
      status: order.status,
      total_amount: order.total_amount,
      discount_amount: order.discount_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingOrder) {
      setOrders(orders.map(o =>
        o.id === editingOrder.id
          ? {
              ...o,
              ...formData,
              promotion_applied_id: formData.promotion_applied_id ? parseInt(formData.promotion_applied_id) : undefined,
              updated_at: new Date().toISOString()
            }
          : o
      ))
    }

    setIsModalOpen(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
      setOrders(orders.filter(o => o.id !== id))
    }
  }

  const handleStatusChange = async (id: number, newStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING') => {
    await OrderApi.updateStatus(id, mapUIStatusToBackend(newStatus) as any)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, updated_at: new Date().toISOString() } : o))
  }

  // Payment status editing is disabled on this page

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

  const handleBulkStatusChange = async () => {
    await Promise.all(selectedOrders.map(id => OrderApi.updateStatus(id, mapUIStatusToBackend(bulkStatus) as any)))
    setOrders(prev => prev.map(o => selectedOrders.includes(o.id) ? { ...o, status: bulkStatus, updated_at: new Date().toISOString() } : o))
    setSelectedOrders([])
  }

  // Bulk payment status editing is disabled on this page

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
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
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Đã thanh toán'
      case 'UNPAID': return 'Chưa thanh toán'
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

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    // Only display COMPLETED and CANCELLED on this page
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') return false
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        order.id.toString().includes(searchLower) ||
        order.customer_id.toString().includes(searchLower) ||
        order.total_amount.toString().includes(searchLower) ||
        order.discount_amount.toString().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Status filter (limited set)
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false
    }

    // Payment status filter - use detailed data if available
    const effectivePaymentStatus = (detailMap[order.id]?.paymentStatus as any) || order.payment_status
    if (paymentStatusFilter !== 'ALL' && effectivePaymentStatus !== paymentStatusFilter) {
      return false
    }

    // Payment method filter
    if (paymentMethodFilter !== 'ALL' && order.payment_method !== paymentMethodFilter) {
      return false
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      const orderDate = new Date(order.created_at)
      const startDate = dateRange.start ? new Date(dateRange.start) : null
      const endDate = dateRange.end ? new Date(dateRange.end) : null

      if (startDate && orderDate < startDate) return false
      if (endDate && orderDate > endDate) return false
    }

    return true
  }).sort((a, b) => {
    let aValue: any = a[sortBy]
    let bValue: any = b[sortBy]

    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPaymentStatusFilter('ALL')
    setPaymentMethodFilter('ALL')
    setDateRange({ start: '', end: '' })
    setSortBy('created_at')
    setSortOrder('desc')
  }

  // Get order details for selected order
  const getOrderDetails = (orderId: number) => {
    return orderDetailsMap[orderId] || []
  }

  // Calculate total for order details
  const calculateOrderTotal = (details: any[]) => {
    return details.reduce((sum, detail) => sum + (detail.subtotal ?? 0), 0)
  }

  // Stats
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length
  const paidOrders = orders.filter(o => o.payment_status === 'PAID').length
  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID')
    .reduce((sum, o) => sum + o.total_amount, 0)

  return (
    <div className="space-y-6">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng đơn hàng</dt>
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Hoàn thành</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedOrders}</dd>
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đã thanh toán</dt>
                  <dd className="text-lg font-medium text-gray-900">{paidOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">💵</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Doanh thu</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tìm kiếm và Lọc</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              placeholder="ID, khách hàng, tổng tiền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter (only show COMPLETED / CANCELLED per requirement) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="UNPAID">Chưa thanh toán</option>

            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="COD">COD</option>
              <option value="BANK_TRANSFER">Chuyển khoản</option>
              <option value="CREDIT_CARD">Thẻ tín dụng</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="created_at">Ngày tạo</option>
                <option value="id">ID</option>
                <option value="total_amount">Tổng tiền</option>
                <option value="customer_id">Khách hàng</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách Đơn hàng</h3>

            {selectedOrders.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Đã chọn {selectedOrders.length} đơn hàng
                </span>

                <div className="flex items-center space-x-2">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as any)}
                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>

                  <button
                    onClick={handleBulkStatusChange}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Chuyển trạng thái
                  </button>
                </div>

                {/* Cột thanh toán chỉ hiển thị, không cho sửa hàng loạt */}

                <button
                  onClick={() => setSelectedOrders([])}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>

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
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Phương thức
                   </th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     Thao tác
                   </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewDetails(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detailMap[order.id]?.customerName ? detailMap[order.id]?.customerName : `#${order.customer_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detailMap[order.id]?.discountAmount ?? order.discount_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(order.status)}`}
                      >
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor((detailMap[order.id]?.paymentStatus as any) || order.payment_status)}`}>
                        {getPaymentStatusLabel((detailMap[order.id]?.paymentStatus as any) || order.payment_status)}
                      </span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {getPaymentMethodLabel((detailMap[order.id]?.paymentMethod as any) || order.payment_method)}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? 'Chỉnh sửa đơn hàng' : 'Chi tiết đơn hàng'}
      >
        {editingOrder ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Khách hàng
                </label>
                <input
                  type="number"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Khuyến mãi
                </label>
                <input
                  type="number"
                  value={formData.promotion_applied_id}
                  onChange={(e) => setFormData({ ...formData, promotion_applied_id: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tổng tiền
                </label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Giảm giá
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Trạng thái thanh toán
                </label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as any })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="UNPAID">Chưa thanh toán</option>
                  <option value="PAID">Đã thanh toán</option>
                  <option value="PARTIAL">Thanh toán một phần</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phương thức thanh toán
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="COD">Thanh toán khi nhận hàng</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
                <option value="CREDIT_CARD">Thẻ tín dụng</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cập nhật
              </button>
            </div>
          </form>
        ) : selectedOrder ? (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveDetailTab('info')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeDetailTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Thông tin đơn hàng
                </button>
                <button
                  onClick={() => setActiveDetailTab('products')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeDetailTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Danh sách sản phẩm
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeDetailTab === 'info' && (
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
                    <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.created_at}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày cập nhật</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.updated_at}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giảm giá</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedOrder.discount_amount)}</p>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor((detailMap[selectedOrder.id]?.paymentStatus as any) || selectedOrder.payment_status)}`}>
                      {getPaymentStatusLabel((detailMap[selectedOrder.id]?.paymentStatus as any) || selectedOrder.payment_status)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phương thức thanh toán</label>
                  <p className="mt-1 text-sm text-gray-900">{getPaymentMethodLabel(selectedOrder.payment_method)}</p>
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
              </div>
            )}

            {activeDetailTab === 'products' && (
              <div className="space-y-4">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Danh sách sản phẩm</h3>

                    {(() => {
                      const details = getOrderDetails(selectedOrder.id)
                      const total = calculateOrderTotal(details)

                      return (
                        <>
                          <div className="overflow-x-auto">
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
                                    Đơn vị
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số lượng
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Đơn giá
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thành tiền
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {details.map((detail, index) => (
                                  <tr key={detail.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {detail.productName ? detail.productName : `#${detail.productUnitId}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {detail.unitName || ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {detail.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatCurrency(detail.unitPrice)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {formatCurrency(detail.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary */}
                          <div className="mt-6 border-t pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-medium text-gray-900">Tổng cộng:</span>
                              <span className="text-xl font-bold text-blue-600">{formatCurrency(total)}</span>
                            </div>
                            {selectedOrder.discount_amount > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-600">Giảm giá:</span>
                                <span className="text-sm text-red-600">-{formatCurrency(selectedOrder.discount_amount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                              <span className="text-lg font-bold text-gray-900">Thành tiền:</span>
                              <span className="text-xl font-bold text-green-600">
                                {formatCurrency(selectedOrder.total_amount)}
                              </span>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default OrderListManagement
