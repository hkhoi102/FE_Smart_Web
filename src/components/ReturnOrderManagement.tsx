import React, { useState } from 'react'
import { ReturnOrder, ReturnDetail } from './OrderManagement'
import Modal from './Modal'

const ReturnOrderManagement: React.FC = () => {
  const [returnOrders, setReturnOrders] = useState<ReturnOrder[]>([
    {
      id: 1,
      created_at: '2025-09-09 07:37:48.621282',
      customer_id: 2,
      processed_at: '2025-09-09 07:41:42.491318',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 1,
      refund_amount: 0
    },
    {
      id: 2,
      created_at: '2025-09-09 07:58:14.412227',
      customer_id: 2,
      processed_at: '2025-09-09 08:00:23.863036',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 1,
      refund_amount: 0
    },
    {
      id: 3,
      created_at: '2025-09-09 08:09:30.432255',
      customer_id: 2,
      processed_at: '2025-09-09 08:10:39.628519',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 1,
      refund_amount: 0
    },
    {
      id: 4,
      created_at: '2025-09-09 08:13:41.289878',
      customer_id: 2,
      processed_at: '2025-09-09 08:14:36.612099',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 2,
      refund_amount: 0
    },
    {
      id: 5,
      created_at: '2025-09-09 08:16:01.165794',
      customer_id: 2,
      processed_at: '2025-09-09 08:17:13.419403',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 2,
      refund_amount: 0
    },
    {
      id: 6,
      created_at: '2025-09-09 08:19:31.739163',
      customer_id: 2,
      processed_at: '2025-09-09 08:20:34.591764',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 2,
      refund_amount: 0
    },
    {
      id: 7,
      created_at: '2025-09-09 08:28:41.237970',
      customer_id: 2,
      processed_at: '2025-09-09 08:32:32.851581',
      reason: 'Đối ý - trả 1 phần',
      status: 'COMPLETED',
      order_id: 2,
      refund_amount: 0
    },
    {
      id: 8,
      created_at: '2025-09-11 08:53:29.646843',
      customer_id: 2,
      processed_at: '2025-09-11 08:56:17.038324',
      reason: 'Sản phẩm bị lỗi',
      status: 'COMPLETED',
      order_id: 4,
      refund_amount: 10000
    },
    {
      id: 9,
      created_at: '2025-09-11 08:58:14.849011',
      customer_id: 2,
      processed_at: '2025-09-11 08:59:38.067273',
      reason: 'Sản phẩm bị lỗi',
      status: 'COMPLETED',
      order_id: 4,
      refund_amount: 280000
    }
  ])

  const [returnDetails, setReturnDetails] = useState<ReturnDetail[]>([
    { id: 8, order_detail_id: 7, quantity: 1, refund_amount: 300000, return_order_id: 6 },
    { id: 10, order_detail_id: 7, quantity: 1, refund_amount: 300000, return_order_id: 7 },
    { id: 12, order_detail_id: 9, quantity: 1, refund_amount: 300000, return_order_id: 9 },
    { id: 11, order_detail_id: 10, quantity: 1, refund_amount: 100000, return_order_id: 8 },
    { id: 9, order_detail_id: 6, quantity: 1, refund_amount: 15000, return_order_id: 7 }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ReturnOrder | null>(null)
  const [editingOrder, setEditingOrder] = useState<ReturnOrder | null>(null)
  const [formData, setFormData] = useState({
    customer_id: 0,
    order_id: 0,
    reason: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
    refund_amount: 0
  })

  const handleViewDetails = (order: ReturnOrder) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleViewReturnDetails = (order: ReturnOrder) => {
    setSelectedOrder(order)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (order: ReturnOrder) => {
    setEditingOrder(order)
    setFormData({
      customer_id: order.customer_id,
      order_id: order.order_id,
      reason: order.reason,
      status: order.status,
      refund_amount: order.refund_amount
    })
    setIsModalOpen(true)
  }

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

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng trả về này?')) {
      setReturnOrders(returnOrders.filter(o => o.id !== id))
    }
  }

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
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành'
      case 'PENDING': return 'Chờ xử lý'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  // Stats
  const totalReturns = returnOrders.length
  const completedReturns = returnOrders.filter(o => o.status === 'COMPLETED').length
  const pendingReturns = returnOrders.filter(o => o.status === 'PENDING').length
  const totalRefundAmount = returnOrders.reduce((sum, o) => sum + o.refund_amount, 0)
  const defectiveReturns = returnOrders.filter(o => o.reason === 'Sản phẩm bị lỗi').length

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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Chờ xử lý</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingReturns}</dd>
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
                  <span className="text-white text-sm font-medium">🔧</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sản phẩm lỗi</dt>
                  <dd className="text-lg font-medium text-gray-900">{defectiveReturns}</dd>
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
            <button
              onClick={() => {
                setEditingOrder(null)
                setFormData({
                  customer_id: 0,
                  order_id: 0,
                  reason: '',
                  status: 'PENDING',
                  refund_amount: 0
                })
                setIsModalOpen(true)
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-2">+</span>
              Thêm đơn trả về
            </button>
          </div>

          <div className="overflow-x-auto">
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
                      #{order.customer_id}
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
                      {formatCurrency(order.refund_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => handleViewReturnDetails(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-yellow-600 hover:text-yellow-900"
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
