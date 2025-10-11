import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { OrderApi } from '../services/orderService'
import { useCart } from '../contexts/CartContext'

const Payment: React.FC = () => {
  const { state } = useLocation() as { state?: { order?: any; qrLink?: string } }
  const navigate = useNavigate()
  const { orderId } = useParams()

  const order = state?.order
  const paymentInfo = order?.paymentInfo || {}
  const qrLink = state?.qrLink || paymentInfo?.qrContent
  const [isMatched, setIsMatched] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(false)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)
  const intervalRef = useRef<number | undefined>(undefined)
  const { clearCart } = useCart()

  const matchParams = useMemo(() => {
    const amount = Number(order?.totalAmount || order?.paymentInfo?.amount || 0)
    const content = paymentInfo?.transferContent || ''
    return { amount, content }
  }, [order, paymentInfo])

  useEffect(() => {
    let cancelled = false
    async function tick() {
      if (!matchParams.content || !matchParams.amount || isMatched) return
      setChecking(true)
      try {
        const matched = await (OrderApi as any).matchPaymentBySepay(matchParams.content, matchParams.amount, 20)
        if (!cancelled && matched) {
          setIsMatched(true)
          setShowSuccessModal(true)
          // Update order payment status to PAID
          const id = order?.id || orderId
          if (id) {
            try { await (OrderApi as any).updatePaymentStatus(Number(id), 'PAID') } catch {}
          }
          // stop polling once matched
          if (intervalRef.current) window.clearInterval(intervalRef.current)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    // Start polling every 5s
    intervalRef.current = window.setInterval(tick, 5000)
    // Run immediately once
    tick()
    return () => {
      cancelled = true
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [matchParams, order?.id, orderId, isMatched])

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    // Clear cart after successful bank transfer
    try { clearCart() } catch {}
    navigate('/cart', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Thanh toán chuyển khoản</h1>

          {qrLink ? (
            <div className="text-center">
              {/* If qrContent is a data URL or direct image, show it as image; else, render as text/qr component placeholder */}
              {qrLink.startsWith('data:image') || qrLink.startsWith('http') ? (
                <img src={qrLink} alt="QR Code" className="mx-auto w-64 h-64 object-contain" />
              ) : (
                <div className="mx-auto w-64 h-64 flex items-center justify-center border rounded bg-white">
                  <p className="text-xs break-all p-2">{qrLink}</p>
                </div>
              )}
              <p className="mt-3 text-sm text-gray-600">Quét mã QR để thanh toán đơn hàng #{order?.id || orderId}</p>

              {/* Payment detail lines */}
              {(paymentInfo?.accountNumber || paymentInfo?.accountName || paymentInfo?.bankCode || paymentInfo?.transferContent) && (
                <div className="mt-4 text-left inline-block bg-gray-50 border rounded p-4">
                  {paymentInfo?.accountNumber && (
                    <div className="text-sm text-gray-700"><span className="font-medium">Số tài khoản:</span> {paymentInfo.accountNumber}</div>
                  )}
                  {paymentInfo?.accountName && (
                    <div className="text-sm text-gray-700"><span className="font-medium">Chủ tài khoản:</span> {paymentInfo.accountName}</div>
                  )}
                  {paymentInfo?.bankCode && (
                    <div className="text-sm text-gray-700"><span className="font-medium">Ngân hàng:</span> {paymentInfo.bankCode}</div>
                  )}
                  {paymentInfo?.transferContent && (
                    <div className="text-sm text-gray-700"><span className="font-medium">Nội dung chuyển khoản:</span> {paymentInfo.transferContent}</div>
                  )}
                </div>
              )}

              {/* Match result */}
              {isMatched ? (
                <div className="mt-4 text-green-700 bg-green-50 border border-green-200 inline-flex items-center gap-2 px-3 py-2 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Đã xác nhận chuyển khoản. Đơn hàng đã được đánh dấu PAID.</span>
                </div>
              ) : (
                <div className="mt-4 text-gray-600 text-sm">Đang kiểm tra chuyển khoản mỗi 5 giây...</div>
              )}
            </div>
          ) : (
            <div className="text-center text-red-600">Không tìm thấy mã QR thanh toán.</div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Về trang chủ</Link>
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">Quay lại</button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thanh toán thành công!</h3>
            <p className="text-gray-600 mb-4">Đơn hàng #{order?.id || orderId} đã được thanh toán thành công.</p>
            <button
              onClick={handleSuccessClose}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Về trang giỏ hàng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payment


