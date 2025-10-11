import React from 'react'
import { CartItem } from '../contexts/CartContext'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  discountAmount?: number
  shippingCost?: number
  total: number
  appliedPromotion?: {
    id: number
    name: string
    type: string
    discountAmount: number
  }
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  discountAmount = 0,
  shippingCost = 0,
  total,
  appliedPromotion
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Đơn hàng</h2>

      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg">
                <img
                  src="/images/fresh_fruit.png"
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                <p className="text-xs text-gray-500">{item.unitName || ''} × {item.quantity}</p>
              </div>
            </div>
            <span className="font-medium text-gray-900">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Order Totals */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá:</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        {appliedPromotion && (
          <div className="flex justify-between text-sm text-blue-600">
            <span>Khuyến mãi ({appliedPromotion.name}):</span>
            <span>-{formatCurrency(appliedPromotion.discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển:</span>
          <span className={shippingCost === 0 ? "text-primary-600 font-medium" : ""}>
            {shippingCost === 0 ? 'Miễn phí' : formatCurrency(shippingCost)}
          </span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Tổng:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Promotion Info */}
      {appliedPromotion && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-500 text-lg mr-2">🎉</div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Áp dụng khuyến mãi: {appliedPromotion.name}
              </p>
              <p className="text-xs text-green-600">
                Tiết kiệm: {formatCurrency(appliedPromotion.discountAmount)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderSummary
