import React, { useEffect, useState } from 'react'
import { ReturnOrder, ReturnDetail } from './OrderManagement'
import Modal from './Modal'
import { ReturnService } from '../services/returnService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'

const ReturnOrderManagement: React.FC = () => {
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([])
  const [returnDetails, setReturnDetails] = useState<ReturnDetail[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'REJECTED'>('ALL')
  const [nameMap, setNameMap] = useState<Record<number, string>>({})
  const [unitCache, setUnitCache] = useState<Record<number, { productName?: string; unitName?: string }>>({})
  const [refundMap, setRefundMap] = useState<Record<number, number>>({})

  const toNumber = (v: any): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const s = v.replace(/\./g, '').replace(/,/g, '.')
      const n = Number(s)
      return isNaN(n) ? 0 : n
    }
    return 0
  }
  const pickRefund = (obj: any): number => {
    if (!obj) return 0
    return toNumber(
      obj.refundAmount ?? obj.refund_amount ?? obj.totalRefundAmount ?? obj.total_refund_amount ?? obj.refund
    )
  }

  useEffect(() => {
    let mounted = true
    const fetchReturns = async () => {
      try {
        setLoading(true)
        setError(null)
        // Only COMPLETED/REJECTED orders for this page
        let arr: any[] = []
        if (statusFilter === 'ALL') {
          const [comp, rej] = await Promise.all([
            ReturnService.list({ page: 0, size: 50, status: 'COMPLETED' }),
            ReturnService.list({ page: 0, size: 50, status: 'REJECTED' }),
          ])
          const a1 = Array.isArray(comp?.data) ? comp.data : []
          const a2 = Array.isArray(rej?.data) ? rej.data : []
          arr = [...a1, ...a2]
        } else {
          const res = await ReturnService.list({ page: 0, size: 50, status: statusFilter })
          arr = Array.isArray(res?.data) ? res.data : []
        }
        const mapped: ReturnOrder[] = arr.map((r: any) => ({
          id: r.id,
          created_at: r.createdAt || r.created_at,
          customer_id: r.customerId || r.customer_id,
          processed_at: r.processedAt || r.processed_at || '',
          reason: r.reason,
          status: (r.status || 'COMPLETED') as any,
          order_id: r.orderId || r.order_id,
          refund_amount: pickRefund(r),
        }))
        if (mounted) setReturnOrders(mapped)
        // preload customer names
        const nm = await CustomerService.preloadNames(mapped.map(m => m.customer_id))
        if (mounted) setNameMap(nm)
        // ensure refund totals from detail if not on list
        const details = await Promise.all(mapped.map(m => ReturnService.getById(m.id).catch(()=>null)))
        const totals: Record<number, number> = {}
        details.forEach((resp: any) => { const d = resp?.data; if (d) totals[d.id] = pickRefund(d) })
        if (mounted) setRefundMap(totals)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Không thể tải danh sách trả hàng')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchReturns()
    return () => { mounted = false }
  }, [statusFilter])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null)
  // Editing state removed for read-only history page
  const [editingOrder] = useState<ReturnOrder | null>(null)
  const [formData, setFormData] = useState({
    customer_id: 0,
    order_id: 0,
    reason: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
    refund_amount: 0
  })

  const handleViewReturnDetails = async (order: ReturnOrder) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
    try {
      const resp = await ReturnService.getById(order.id)
      const data = resp?.data
      if (data && Array.isArray(data.returnDetails)) {
        const mapped: ReturnDetail[] = data.returnDetails.map((d: any) => ({
          id: d.id,
          order_detail_id: d.orderDetailId,
          quantity: d.quantity,
          refund_amount: d.refundAmount,
          return_order_id: order.id,
          // @ts-ignore carry unit id for name lookup
          product_unit_id: d.productUnitId,
        }))
        setReturnDetails(mapped)
        const unitIds = Array.from(new Set(data.returnDetails.map((d: any) => d.productUnitId))) as number[]
        const missing = unitIds.filter(id => !unitCache[id])
        if (missing.length) {
          const infos = await Promise.all(missing.map(id => ProductService.getProductUnitById(id)))
          const next = { ...unitCache }
          infos.forEach((info, idx) => { const key = missing[idx]; if (info) next[key] = { productName: info.productName, unitName: info.unitName } })
          setUnitCache(next)
        }
      } else {
        setReturnDetails([])
      }
    } catch {
      setReturnDetails([])
    }
  }

  // Editing flow removed for history page

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingOrder) {
      setReturnOrders(returnOrders.map(o =>
        o.id === editingOrder.id
          ? {
              ...o,
              ...formData,
              processed_at: formData.status === 'COMPLETED' ? new Date().toISOString() : o.processed_at
            }
          : o
      ))
    } else {
      const newOrder: ReturnOrder = {
        id: Math.max(...returnOrders.map(o => o.id)) + 1,
        created_at: new Date().toISOString(),
        processed_at: formData.status === 'COMPLETED' ? new Date().toISOString() : '',
        ...formData
      }
      setReturnOrders([...returnOrders, newOrder])
    }

    setIsModalOpen(false)
  }

  // Delete flow removed for history page

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
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành'
      case 'REJECTED': return 'Thất bại'
      case 'PENDING': return 'Chờ xử lý'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  // Stats
  const totalReturns = returnOrders.length
  const completedReturns = returnOrders.filter(o => o.status === 'COMPLETED').length
  const rejectedReturns = returnOrders.filter(o => (o as any).status === 'REJECTED').length
  const totalRefundAmount = returnOrders.reduce((sum, o) => sum + (refundMap[o.id] ?? o.refund_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">↩️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng trả hàng</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalReturns}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{completedReturns}</dd>
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
                  <span className="text-white text-sm font-medium">✖</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Bị từ chối</dt>
                  <dd className="text-lg font-medium text-gray-900">{rejectedReturns}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Removed defectiveReturns widget to avoid undefined var */}

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
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng hoàn tiền</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalRefundAmount)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Đơn hàng Trả về</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Lọc:</span>
              <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-300">
                <button onClick={()=> setStatusFilter('ALL')} className={`px-3 py-1.5 text-sm ${statusFilter==='ALL'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Tất cả</button>
                <button onClick={()=> setStatusFilter('COMPLETED')} className={`px-3 py-1.5 text-sm border-l border-gray-300 ${statusFilter==='COMPLETED'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Hoàn thành</button>
                <button onClick={()=> setStatusFilter('REJECTED')} className={`px-3 py-1.5 text-sm border-l border-gray-300 ${statusFilter==='REJECTED'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}>Từ chối</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading && (<div className="p-4 text-sm text-gray-500">Đang tải danh sách trả hàng...</div>)}
            {error && (<div className="p-4 text-sm text-red-600">{error}</div>)}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    ID Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hoàn tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {nameMap[order.customer_id] || `#${order.customer_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(refundMap[order.id] ?? order.refund_amount ?? 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleViewReturnDetails(order)} className="text-blue-600 hover:text-blue-900">Xem</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? 'Chỉnh sửa đơn trả về' : 'Thêm đơn trả về mới'}
      >
        {editingOrder ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Khách hàng *
                </label>
                <input
                  type="number"
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Đơn hàng *
                </label>
                <input
                  type="number"
                  required
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lý do trả hàng *
              </label>
              <select
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Chọn lý do</option>
                <option value="Đối ý - trả 1 phần">Đối ý - trả 1 phần</option>
                <option value="Sản phẩm bị lỗi">Sản phẩm bị lỗi</option>
                <option value="Không đúng sản phẩm">Không đúng sản phẩm</option>
                <option value="Giao hàng chậm">Giao hàng chậm</option>
                <option value="Khác">Khác</option>
              </select>
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
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số tiền hoàn
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.refund_amount}
                  onChange={(e) => setFormData({ ...formData, refund_amount: parseInt(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
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
                {editingOrder ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        ) : selectedOrder ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Đơn trả về</label>
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
                <label className="block text-sm font-medium text-gray-700">Ngày xử lý</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.processed_at}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ID Đơn hàng</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.order_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lý do</label>
                <p className="mt-1 text-sm text-gray-900">{selectedOrder.reason}</p>
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
                <label className="block text-sm font-medium text-gray-700">Số tiền hoàn</label>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedOrder.refund_amount)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Return Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Chi tiết trả hàng"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Chi tiết trả hàng cho đơn #{selectedOrder.id}
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Chi tiết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Đơn hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số tiền hoàn
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {returnDetails
                    .filter(detail => detail.return_order_id === selectedOrder.id)
                    .map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {detail.order_detail_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {detail.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(detail.refund_amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {returnDetails.filter(detail => detail.return_order_id === selectedOrder.id).length === 0 && (
              <p className="text-gray-500 text-center py-4">Không có chi tiết trả hàng</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReturnOrderManagement
