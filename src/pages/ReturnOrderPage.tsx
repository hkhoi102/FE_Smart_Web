import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Order } from '../components/OrderManagement'
import { OrderApi } from '../services/orderService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'

interface OrderDetail {
  id: number
  productUnitId: number
  quantity: number
  unitPrice: number
  subtotal: number
  productName?: string
  unitName?: string
  returnQuantity: number
  returnReason: string
}

const ReturnOrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderCode, setOrderCode] = useState<string>('')
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const orderResponse = await OrderApi.getById(Number(orderId))
      const orderData = (orderResponse as any)?.data

      if (!orderData) {
        setError('Không tìm thấy đơn hàng')
        return
      }

      const orderInfo: Order = {
        id: orderData.id,
        created_at: orderData.createdAt ?? new Date().toISOString(),
        customer_id: orderData.customerId,
        promotion_applied_id: orderData.promotionAppliedId ?? undefined,
        status: orderData.status,
        total_amount: orderData.totalAmount ?? 0,
        updated_at: orderData.updatedAt ?? orderData.createdAt ?? new Date().toISOString(),
        discount_amount: orderData.discountAmount ?? 0,
        payment_method: (orderData.paymentMethod ?? 'COD') as any,
        payment_status: (orderData.paymentStatus ?? 'UNPAID') as any,
      }
      setOrder(orderInfo)

      // Set order code
      setOrderCode(orderData.orderCode || orderData.order_code || `#${orderData.id}`)

      // Fetch customer name
      try {
        const customerName = await CustomerService.getNameById(orderData.customerId)
        setCustomerName(customerName || `Khách hàng #${orderData.customerId}`)
      } catch {
        setCustomerName(`Khách hàng #${orderData.customerId}`)
      }

      // Fetch order details with product info
      if (orderData.orderDetails && Array.isArray(orderData.orderDetails)) {
        const unitIds = orderData.orderDetails.map((od: any) => od.productUnitId)
        const uniqueUnitIds = Array.from(new Set(unitIds)) as number[]

        const unitResults = await Promise.all(uniqueUnitIds.map(id => ProductService.getProductUnitById(id)))
        const unitMap: Record<number, { productName?: string; unitName?: string }> = {}

        unitResults.forEach((info, idx) => {
          const key = uniqueUnitIds[idx]
          if (info) unitMap[key] = { productName: info.productName, unitName: info.unitName }
        })

        const returnItems: OrderDetail[] = orderData.orderDetails.map((od: any) => ({
          id: od.id ?? od.orderDetailId ?? Math.random(),
          productUnitId: od.productUnitId,
          quantity: od.quantity,
          unitPrice: od.unitPrice,
          subtotal: od.subtotal ?? (od.unitPrice * od.quantity),
          productName: unitMap[od.productUnitId]?.productName,
          unitName: unitMap[od.productUnitId]?.unitName,
          returnQuantity: 0,
          returnReason: ''
        }))

        setOrderDetails(returnItems)
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedDetails = [...orderDetails]
    updatedDetails[index].returnQuantity = Math.min(Math.max(0, quantity), updatedDetails[index].quantity)
    setOrderDetails(updatedDetails)
  }

  const handleReasonChange = (index: number, reason: string) => {
    const updatedDetails = [...orderDetails]
    updatedDetails[index].returnReason = reason
    setOrderDetails(updatedDetails)
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      const validItems = orderDetails.filter(item => item.returnQuantity > 0 && item.returnReason.trim())

      if (validItems.length === 0) {
        setError('Vui lòng chọn ít nhất một sản phẩm để trả và nhập lý do')
        return
      }

      // TODO: Implement return order creation API call
      alert(`Đã tạo đơn trả hàng thành công cho ${validItems.length} sản phẩm`)
      navigate('/admin/order-list')
    } catch (e: any) {
      setError(e?.message || 'Không thể tạo đơn trả hàng')
    } finally {
      setSubmitting(false)
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Hoàn thành'
      case 'PENDING': return 'Chờ xử lý'
      case 'PROCESSING': return 'Đang xử lý'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
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

  const totalReturnAmount = orderDetails.reduce((sum, item) =>
    sum + (item.returnQuantity * item.unitPrice), 0
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/admin/order-list')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/order-list')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tạo đơn trả hàng</h1>
                <p className="text-sm text-gray-600">
                  Đơn hàng {orderCode} - {customerName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {formatDate(order?.created_at || '')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mã đơn hàng</label>
                  <p className="mt-1 text-sm text-gray-900">{orderCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                  <p className="mt-1 text-sm text-gray-900">{customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(order?.created_at || '')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {getStatusLabel(order?.status || '')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tổng tiền</label>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(order?.total_amount || 0)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thanh toán</label>
                  <p className="mt-1 text-sm text-gray-900">{getPaymentStatusLabel(order?.payment_status || '')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phương thức</label>
                  <p className="mt-1 text-sm text-gray-900">{getPaymentMethodLabel(order?.payment_method || '')}</p>
                </div>
                {order?.discount_amount && order.discount_amount > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giảm giá</label>
                    <p className="mt-1 text-sm text-red-600">{formatCurrency(order.discount_amount)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách sản phẩm</h2>
                <p className="text-sm text-gray-600">Chọn sản phẩm và số lượng cần trả</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STT
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng gốc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng trả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lý do trả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderDetails.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName || `Sản phẩm #${item.productUnitId}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.unitName || `Đơn vị #${item.productUnitId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.returnQuantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={item.returnReason}
                            onChange={(e) => handleReasonChange(index, e.target.value)}
                            className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Chọn lý do</option>
                            <option value="DEFECTIVE">Sản phẩm lỗi</option>
                            <option value="WRONG_ITEM">Sai sản phẩm</option>
                            <option value="DAMAGED">Sản phẩm hỏng</option>
                            <option value="NOT_AS_DESCRIBED">Không đúng mô tả</option>
                            <option value="CUSTOMER_REQUEST">Yêu cầu khách hàng</option>
                            <option value="OTHER">Khác</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.returnQuantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              {orderDetails.some(item => item.returnQuantity > 0) && (
                <div className="bg-blue-50 border-t border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Tóm tắt đơn trả hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {orderDetails.filter(item => item.returnQuantity > 0).length}
                      </div>
                      <div className="text-sm text-blue-700">Sản phẩm trả</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {orderDetails.reduce((sum, item) => sum + item.returnQuantity, 0)}
                      </div>
                      <div className="text-sm text-blue-700">Tổng số lượng</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {formatCurrency(totalReturnAmount)}
                      </div>
                      <div className="text-sm text-blue-700">Tổng tiền trả</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/admin/order-list')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !orderDetails.some(item => item.returnQuantity > 0 && item.returnReason)}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Đang xử lý...' : 'Tạo đơn trả hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReturnOrderPage
