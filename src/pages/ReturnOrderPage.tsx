import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Order } from '../components/OrderManagement'
import { OrderApi } from '../services/orderService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'
import ReturnInvoiceModal from '../components/ReturnInvoiceModal'

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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [returnOrderData, setReturnOrderData] = useState<any>(null)

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
      setError(null)

      const validItems = orderDetails.filter(item => item.returnQuantity > 0 && item.returnReason.trim())

      if (validItems.length === 0) {
        setError('Vui lòng chọn ít nhất một sản phẩm để trả và nhập lý do')
        return
      }

      if (!order) {
        setError('Không tìm thấy thông tin đơn hàng')
        return
      }

      // Tạo return details từ valid items
      const returnDetails = validItems.map(item => ({
        orderDetailId: item.id,
        quantity: item.returnQuantity
      }))

      // Debug log để kiểm tra dữ liệu
      console.log('Valid items:', validItems)
      console.log('Return details:', returnDetails)

      // Tạo request để tạo đơn trả hàng
      const createReturnRequest = {
        orderId: order.id,
        reason: validItems.map(item => item.returnReason).join(', '), // Gộp tất cả lý do
        returnDetails: returnDetails
      }

      console.log('Create return request:', createReturnRequest)

      // Bước 1: Tạo đơn trả hàng
      const returnOrder = await OrderApi.createReturn(createReturnRequest)
      console.log('Return order response:', returnOrder)

      if (!returnOrder || !returnOrder.id) {
        throw new Error('Không thể tạo đơn trả hàng')
      }

      // Bước 2: Duyệt đơn trả hàng (chuyển trạng thái thành APPROVED)
      await OrderApi.approveReturn(returnOrder.id)

      // Bước 3: Hoàn thành đơn trả hàng (chuyển trạng thái thành COMPLETED)
      await OrderApi.completeReturn(returnOrder.id)

      // Lấy dữ liệu đơn hàng đã được cập nhật từ BE
      const updatedOrderResponse = await OrderApi.getById(order.id)
      const updatedOrderData = (updatedOrderResponse as any)?.data

      if (!updatedOrderData) {
        throw new Error('Không thể lấy dữ liệu đơn hàng sau khi trả')
      }

      // Lấy thông tin đơn trả hàng từ BE
      const returnOrderData = await OrderApi.getReturnById(returnOrder.id)
      console.log('Return order data:', returnOrderData)

      // Lấy danh sách sản phẩm gốc từ order_details (từ dữ liệu đã fetch trước đó)
      const originalOrderDetails = orderDetails.map(item => ({
        id: item.id,
        productUnitId: item.productUnitId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        productName: item.productName,
        unitName: item.unitName
      }))

      // Lấy danh sách sản phẩm trả từ return_details
      const returnDetailsData = returnOrderData.returnDetails || []

      // Lấy thông tin sản phẩm cho các sản phẩm trả
      const returnDetailsWithProductInfo = await Promise.all(
        returnDetailsData.map(async (detail: any) => {
          try {
            const productInfo = await ProductService.getProductUnitById(detail.productUnitId)
            return {
              ...detail,
              productName: productInfo?.productName || `Sản phẩm #${detail.productUnitId}`,
              unitName: productInfo?.unitName || `Đơn vị #${detail.productUnitId}`
            }
          } catch {
            return {
              ...detail,
              productName: `Sản phẩm #${detail.productUnitId}`,
              unitName: `Đơn vị #${detail.productUnitId}`
            }
          }
        })
      )

      // Lấy tổng tiền trả từ return_orders (totalRefundAmount)
      const totalReturnAmount = returnOrderData.totalRefundAmount || 0

      const invoiceData = {
        // Thông tin đơn hàng gốc
        orderCode,
        customerName,
        createdAt: order.created_at,

        // Dữ liệu TRƯỚC khi trả hàng
        originalTotal: order.total_amount,
        originalDiscount: order.discount_amount,
        originalOrderDetails: originalOrderDetails,

        // Dữ liệu SAU khi trả hàng
        finalTotal: updatedOrderData.totalAmount || 0,
        finalDiscount: updatedOrderData.discountAmount || 0,

        // Dữ liệu trả hàng
        returnDetails: returnDetailsWithProductInfo,
        totalReturnAmount: totalReturnAmount,

        // Thông tin đơn trả hàng
        returnOrder: {
          id: returnOrder.id,
          reason: returnOrderData.reason,
          status: returnOrderData.status,
          createdAt: returnOrderData.createdAt
        }
      }

      setReturnOrderData(invoiceData)
      setShowInvoiceModal(true)

    } catch (e: any) {
      console.error('Error creating return order:', e)
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

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false)
    setReturnOrderData(null)
    // Chuyển về danh sách đơn hàng sau khi đóng modal
    navigate('/admin/order-list')
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/order-list')}
                className="mr-4 p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Tạo đơn trả hàng
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Đơn hàng <span className="font-semibold text-blue-600">{orderCode}</span> - {customerName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-600">
                  {formatDate(order?.created_at || '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Information Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Thông tin đơn hàng</h2>
              </div>
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Mã đơn hàng</label>
                  <p className="text-sm font-semibold text-blue-600">{orderCode}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Khách hàng</label>
                  <p className="text-sm font-semibold text-gray-900">{customerName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ngày tạo</label>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(order?.created_at || '')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Trạng thái</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    {getStatusLabel(order?.status || '')}
                  </span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <label className="block text-sm font-medium text-blue-600 mb-1">Tổng tiền</label>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(order?.total_amount || 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Thanh toán</label>
                  <p className="text-sm font-semibold text-gray-900">{getPaymentStatusLabel(order?.payment_status || '')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phương thức</label>
                  <p className="text-sm font-semibold text-gray-900">{getPaymentMethodLabel(order?.payment_method || '')}</p>
                </div>
                {order?.discount_amount && order.discount_amount > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <label className="block text-sm font-medium text-red-600 mb-1">Giảm giá</label>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(order.discount_amount)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Danh sách sản phẩm</h2>
                    <p className="text-sm text-gray-600 mt-1">Chọn sản phẩm và số lượng cần trả</p>
                  </div>
                </div>
              </div>

              <div>
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-2 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-12">
                        STT
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                        Sản phẩm
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                        Đơn vị
                      </th>
                      <th className="px-2 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                        Đơn giá
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                        Số lượng gốc
                      </th>
                      <th className="px-2 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                        Số lượng trả
                      </th>
                      <th className="px-2 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                        Lý do trả
                      </th>
                      <th className="px-2 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {orderDetails.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 py-4 text-center text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-2 py-4 text-left">
                          <div className="text-sm font-medium text-gray-900 truncate" title={item.productName || `Sản phẩm #${item.productUnitId}`}>
                            {item.productName || `Sản phẩm #${item.productUnitId}`}
                          </div>
                        </td>
                        <td className="px-2 py-4 text-left text-sm text-gray-500">
                          {item.unitName || `Đơn vị #${item.productUnitId}`}
                        </td>
                        <td className="px-2 py-4 text-right text-sm text-gray-900">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-2 py-4 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-2 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.returnQuantity}
                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                            className="w-16 px-1 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-4 text-left">
                          <select
                            value={item.returnReason}
                            onChange={(e) => handleReasonChange(index, e.target.value)}
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          >
                            <option value="">Chọn lý do</option>
                            <option value="Sản phẩm lỗi">Sản phẩm lỗi</option>
                            <option value="Sai sản phẩm">Sai sản phẩm</option>
                            <option value="Sản phẩm hỏng">Sản phẩm hỏng</option>
                            <option value="Không đúng mô tả">Không đúng mô tả</option>
                            <option value="Yêu cầu khách hàng">Yêu cầu khách hàng</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </td>
                        <td className="px-2 py-4 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(item.returnQuantity * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-t border-red-200 p-4">
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


              {/* Summary */}
              {orderDetails.some(item => item.returnQuantity > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 p-6">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-blue-900">Tóm tắt đơn trả hàng</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {orderDetails.filter(item => item.returnQuantity > 0).length}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Sản phẩm trả</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {orderDetails.reduce((sum, item) => sum + item.returnQuantity, 0)}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Tổng số lượng</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-4 shadow-sm border-2 border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatCurrency(totalReturnAmount)}
                      </div>
                      <div className="text-sm font-medium text-gray-600">Tổng tiền trả</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {orderDetails.length > 0 && !orderDetails.some(item => item.returnQuantity > 0 && item.returnReason.trim()) && (
                <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-yellow-800">
                      Vui lòng chọn số lượng trả và lý do cho ít nhất một sản phẩm để có thể tạo đơn trả hàng.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => navigate('/admin/order-list')}
                  className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !orderDetails.some(item => item.returnQuantity > 0 && item.returnReason.trim())}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  )}
                  {submitting ? 'Đang kiểm tra...' : 'Trả hàng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Invoice Modal */}
      {returnOrderData && (
        <ReturnInvoiceModal
          isOpen={showInvoiceModal}
          onClose={handleCloseInvoiceModal}
          orderData={returnOrderData}
        />
      )}
    </div>
  )
}

export default ReturnOrderPage
