import React from 'react'
import { ReturnOrderResponse } from '../services/returnOrderService'

interface ReturnedOrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: ReturnOrderResponse
}

const ReturnedOrderDetailModal: React.FC<ReturnedOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi tiết đơn hàng hoàn trả #{order.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Đơn hàng gốc #{order.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn trả</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Mã đơn trả</label>
                      <p className="text-sm text-gray-900">{order.returnCode || `#${order.id}`}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Mã đơn hàng</label>
                      <p className="text-sm text-gray-900">{order.orderCode || `#${order.orderId}`}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Lý do trả hàng</label>
                      <p className="text-sm text-gray-900">{order.reason}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Trạng thái</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Ngày tạo</label>
                      <p className="text-sm text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    {order.processedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Ngày xử lý</label>
                        <p className="text-sm text-gray-900">{formatDate(order.processedAt)}</p>
                      </div>
                    )}
                    {order.adminNote && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Ghi chú admin</label>
                        <p className="text-sm text-gray-900">{order.adminNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt đơn trả</h4>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatCurrency(order.totalRefundAmount)}
                      </div>
                      <div className="text-sm font-medium text-blue-600">Tổng tiền hoàn trả</div>
                    </div>
                  </div>
                </div>

                {/* Return Details */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sản phẩm trả</h4>
                  {order.returnDetails && order.returnDetails.length > 0 ? (
                    <div className="space-y-3">
                      {order.returnDetails.map((detail, index) => (
                        <div key={detail.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-900">{detail.productName}</h5>
                              <p className="text-xs text-gray-500">{detail.unitName}</p>
                              <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                                <span>Số lượng trả: <span className="font-medium">{detail.quantity}</span></span>
                                <span>Đơn giá: <span className="font-medium">{formatCurrency(detail.unitPrice)}</span></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(detail.refundAmount)}
                              </div>
                              <div className="text-xs text-gray-500">Thành tiền</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="mt-2 text-sm">Không có chi tiết sản phẩm</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReturnedOrderDetailModal
