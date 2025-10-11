import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '@/contexts/UserAuthContext'
import { CustomerService, CustomerInfoDto } from '@/services/customerService'
import { OrderApi, OrderResponseDto, OrderStatus, OrderSummaryDto } from '@/services/orderService'
import Modal from '@/components/Modal'
import { ProductService } from '@/services/productService'
import { OrderApi as OrderApiNs } from '@/services/orderService'

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

// Badge style for list table
const statusBadgeClass: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 ring-blue-200',
  DELIVERING: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  COMPLETED: 'bg-green-100 text-green-800 ring-green-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200',
}

export default function MyOrders() {
  const { user, isAuthenticated } = useUserAuth()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerInfoDto | null>(null)
  const [orders, setOrders] = useState<OrderSummaryDto[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [size, setSize] = useState<number>(10)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [detailOpen, setDetailOpen] = useState<boolean>(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderResponseDto | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)
  const [unitNames, setUnitNames] = useState<Record<number, { productName?: string; unitName?: string }>>({})
  const [returnOpen, setReturnOpen] = useState<boolean>(false)
  const [returnReason, setReturnReason] = useState<string>('')
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({})
  const [returnSubmitting, setReturnSubmitting] = useState<boolean>(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [noticeOpen, setNoticeOpen] = useState<boolean>(false)
  const [noticeMessage, setNoticeMessage] = useState<string>('')
  const [cancelSubmitting, setCancelSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      window.location.href = 'http://localhost:3000/login'
      return
    }

    let mounted = true
    async function init() {
      try {
        setLoading(true)
        setError(null)
        // Resolve customer by userId
        const cust = await CustomerService.getByUserId(user!.id)
        if (!mounted) return
        setCustomer(cust)

        type OrderListParams = { page?: number; size?: number; customerId?: number; status?: OrderStatus }
        const params: OrderListParams = { page, size }
        if (cust?.id) params.customerId = cust.id
        if (status) params.status = status

        const data = await OrderApi.list(params)
        if (!mounted) return
        const content = data.data ?? data?.content ?? data
        const total = data.totalPages ?? data?.page?.totalPages ?? 0
        setOrders(Array.isArray(content) ? content : [])
        setTotalPages(total)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Không thể tải đơn hàng')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [isAuthenticated, user, page, size, status, navigate])

  const canPrev = useMemo(() => page > 0, [page])
  const canNext = useMemo(() => page + 1 < totalPages, [page, totalPages])

  const openDetail = async (orderId: number) => {
    setSelectedOrderId(orderId)
    setDetailOpen(true)
    setDetailLoading(true)
    setOrderDetail(null)
    try {
      const res = await OrderApi.getById(orderId)
      const data: OrderResponseDto = res.data ?? res
      setOrderDetail(data)
      // Enrich product/unit names for the lines
      const lines = (data.orderDetails ?? [])
      const missingIds = lines
        .map((l) => l.productUnitId)
        .filter((id) => id && !unitNames[id]) as number[]
      if (missingIds.length > 0) {
        const fetched = await Promise.all(missingIds.map(async (id) => {
          const dto = await ProductService.getProductUnitById(id)
          return { id, productName: dto?.productName, unitName: dto?.unitName }
        }))
        setUnitNames((prev) => {
          const next = { ...prev }
          for (const f of fetched) next[f.id] = { productName: f.productName, unitName: f.unitName }
          return next
        })
      }
    } catch (e) {
      // swallow error, modal will show basic info
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedOrderId(null)
    setOrderDetail(null)
    setReturnOpen(false)
    setReturnReason('')
    setReturnQuantities({})
    setReturnError(null)
  }

  // Refresh the order list with current filters
  const refreshOrders = async () => {
    try {
      if (!customer?.id && !user) return
      const params: any = { page, size }
      if (customer?.id) params.customerId = customer.id
      if (status) params.status = status
      const data = await OrderApi.list(params)
      const content = data.data ?? data?.content ?? data
      const total = data.totalPages ?? data?.page?.totalPages ?? 0
      setOrders(Array.isArray(content) ? content : [])
      setTotalPages(total)
    } catch {}
  }

  // Sync a single order into list and modal from backend
  const syncOrder = async (orderId: number) => {
    try {
      const res = await OrderApi.getById(orderId)
      const data: OrderResponseDto = res.data ?? res
      setOrderDetail(data)
      setOrders((prev) => prev.map((o) => o.id === data.id ? {
        ...o,
        status: data.status as any,
        totalAmount: data.totalAmount,
        itemCount: (data.orderDetails?.length ?? o.itemCount)
      } : o))
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Đơn hàng của tôi</h1>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus((e.target.value as OrderStatus) || '')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.keys(statusLabel).map((s) => (
              <option key={s} value={s}>{statusLabel[s as OrderStatus]}</option>
            ))}
          </select>
          <select
            value={size}
            onChange={(e) => { setPage(0); setSize(Number(e.target.value)) }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/trang</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Đang tải đơn hàng...</div>
      ) : error ? (
        <div className="text-red-600 text-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-gray-600">Bạn chưa có đơn hàng nào.</div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">#{o.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{o.itemCount ?? '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.totalAmount?.toLocaleString('vi-VN')} đ</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statusBadgeClass[o.status]}`}>
                      {statusLabel[o.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openDetail(o.id)} className="text-primary-600 hover:text-primary-700 text-sm">Xem</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
            <div className="text-sm text-gray-600">Trang {page + 1}/{Math.max(totalPages, 1)}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!canPrev}
              >Trước</button>
              <button
                className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext}
              >Sau</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {customer?.address ? (
          <span>Địa chỉ giao hàng mặc định: {customer.address}</span>
        ) : null}
      </div>

      <Modal isOpen={detailOpen} onClose={closeDetail} title={`Chi tiết đơn hàng #${selectedOrderId ?? ''}`} size="xl">
        {detailLoading ? (
          <div className="text-gray-600">Đang tải chi tiết...</div>
        ) : orderDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Trạng thái</div>
                <div className="font-medium">{statusLabel[orderDetail.status]}</div>
              </div>
              {/* Tổng tiền và Giảm giá sẽ hiển thị dưới bảng chi tiết */}
              {orderDetail.paymentMethod && (
                <div>
                  <div className="text-gray-500">Phương thức thanh toán</div>
                  <div className="font-medium">{orderDetail.paymentMethod === 'COD' ? 'COD' : 'Chuyển khoản'}</div>
                </div>
              )}
              {orderDetail.paymentStatus && (
                <div>
                  <div className="text-gray-500">Trạng thái thanh toán</div>
                  <div className="font-medium">{orderDetail.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Ngày tạo</div>
                <div className="font-medium">{new Date(orderDetail.createdAt).toLocaleString()}</div>
              </div>
              {(orderDetail.shippingAddress || customer?.address) && (
                <div className="col-span-2">
                  <div className="text-gray-500">Địa chỉ giao hàng</div>
                  <div className="font-medium">{orderDetail.shippingAddress || customer?.address}</div>
                </div>
              )}
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orderDetail.orderDetails ?? []).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {unitNames[d.productUnitId]?.productName ? (
                          <span>{unitNames[d.productUnitId].productName} – {unitNames[d.productUnitId].unitName}</span>
                        ) : (
                          <span>#{d.productUnitId}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{d.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{d.unitPrice?.toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium">{d.subtotal?.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng kết dưới bảng */}
            <div className="flex flex-col items-end gap-1">
              {typeof orderDetail.discountAmount === 'number' && (
                <div className="text-sm text-gray-700">
                  <span className="mr-2">Giảm giá:</span>
                  <span className="font-medium">{orderDetail.discountAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <div className="text-base text-gray-900">
                <span className="mr-2 font-medium">Tổng tiền:</span>
                <span className="font-semibold">{orderDetail.totalAmount?.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2">
              {/* Cancel order for PENDING */}
              {(orderDetail.status === 'PENDING' || orderDetail.canCancel === true) && (
                <button
                  disabled={cancelSubmitting}
                  className="px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                  onClick={async () => {
                    if (!selectedOrderId) return
                    try {
                      setCancelSubmitting(true)
                      await OrderApi.cancel(selectedOrderId)
                      await syncOrder(selectedOrderId)
                      await refreshOrders()
                      setNoticeMessage('Đã hủy đơn hàng thành công')
                      setNoticeOpen(true)
                    } catch (e: any) {
                      setNoticeMessage(e?.message || 'Hủy đơn hàng thất bại')
                      setNoticeOpen(true)
                    } finally {
                      // Đóng modal chi tiết dù thành công hay thất bại
                      closeDetail()
                      setCancelSubmitting(false)
                    }
                  }}
                >Hủy đơn</button>
              )}

              {/* Return buttons only for COMPLETED */}
              {((orderDetail.canReturn === true) || (orderDetail.status === 'COMPLETED')) && (
                <button
                  className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => {
                    // Pre-fill quantities as 0
                    const init: Record<number, number> = {}
                    for (const d of (orderDetail.orderDetails ?? [])) init[d.id] = 0
                    setReturnQuantities(init)
                    setReturnReason('')
                    setReturnError(null)
                    setReturnOpen(true)
                  }}
                >Yêu cầu trả hàng</button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">Không thể tải chi tiết đơn hàng.</div>
        )}
      </Modal>

      {/* Return modal */}
      <Modal isOpen={returnOpen} onClose={() => setReturnOpen(false)} title={`Yêu cầu trả hàng #${selectedOrderId ?? ''}`} size="lg">
        {!orderDetail ? (
          <div className="text-gray-600">Không có dữ liệu đơn hàng.</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              Chọn sản phẩm và số lượng muốn trả.
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã mua</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trả</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(orderDetail.orderDetails ?? []).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {unitNames[d.productUnitId]?.productName ? (
                          <span>{unitNames[d.productUnitId].productName} – {unitNames[d.productUnitId].unitName}</span>
                        ) : (
                          <span>#{d.productUnitId}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{d.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        <input
                          type="number"
                          min={0}
                          max={d.quantity}
                          value={returnQuantities[d.id] ?? 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(d.quantity, Number(e.target.value)))
                            setReturnQuantities((prev) => ({ ...prev, [d.id]: val }))
                          }}
                          className="w-24 border rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Lý do trả hàng (tuỳ chọn)</label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Nhập lý do trả hàng"
              />
            </div>

            {returnError && <div className="text-sm text-red-600">{returnError}</div>}

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 text-sm border rounded-md" onClick={() => setReturnOpen(false)}>Hủy</button>
              <button
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md disabled:opacity-50"
                disabled={returnSubmitting || Object.values(returnQuantities).every((q) => !q)}
                onClick={async () => {
                  try {
                    setReturnSubmitting(true)
                    setReturnError(null)
                    if (!selectedOrderId) throw new Error('Thiếu orderId')
                    const details = Object.entries(returnQuantities)
                      .map(([orderDetailId, quantity]) => ({ orderDetailId: Number(orderDetailId), quantity: Number(quantity) }))
                      .filter((d) => d.quantity > 0)
                    const payload = { orderId: selectedOrderId, reason: returnReason || undefined, returnDetails: details }
                    const created = await OrderApiNs.createReturn(payload as any)
                    setReturnOpen(false)
                    if (created?.orderId) {
                      await syncOrder(created.orderId)
                      await refreshOrders()
                    }
                    setNoticeMessage('Đã gửi yêu cầu trả hàng thành công')
                    setNoticeOpen(true)
                  } catch (e: any) {
                    const msg = String(e?.message || 'Gửi yêu cầu trả hàng thất bại')
                    // Đóng modal trả hàng và hiện modal thông báo lỗi
                    setReturnOpen(false)
                    setNoticeMessage(msg)
                    setNoticeOpen(true)
                  } finally {
                    setReturnSubmitting(false)
                  }
                }}
              >Gửi yêu cầu</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notice modal */}
      <Modal isOpen={noticeOpen} onClose={() => setNoticeOpen(false)} title="Thông báo" size="md">
        <div className="text-sm text-gray-800 whitespace-pre-line">{noticeMessage}</div>
        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md" onClick={() => setNoticeOpen(false)}>Đóng</button>
        </div>
      </Modal>
    </div>
  )
}


