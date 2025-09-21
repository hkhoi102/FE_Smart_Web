import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

const Cart: React.FC = () => {
  const { state: cartState, updateQuantity, removeFromCart } = useCart()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    updateQuantity(id, newQuantity)
  }

  const handleRemoveItem = (id: number) => {
    removeFromCart(id)
  }


  const shippingCost = 0 // Free shipping
  const subtotal = cartState.totalAmount
  const total = subtotal + shippingCost

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <span className="text-gray-900">Giỏ hàng</span>
          </nav>

          <div className="text-center py-16">
            <div className="mb-8">
              <svg className="w-24 h-24 mx-auto text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-600 mb-8">Hãy thêm một số sản phẩm vào giỏ hàng để bắt đầu mua sắm!</p>
            <Link 
              to="/products" 
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>›</span>
          <span className="text-gray-900">Giỏ hàng</span>
        </nav>

        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
                <div className="col-span-6">SẢN PHẨM</div>
                <div className="col-span-2 text-center">GIÁ</div>
                <div className="col-span-2 text-center">SỐ LƯỢNG</div>
                <div className="col-span-2 text-center">TỔNG</div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-gray-200">
                {cartState.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="md:col-span-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                            <img 
                              src="/images/fresh_fruit.png" 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {item.category_name} • {item.unit}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2 text-center">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                            </svg>
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="md:col-span-2 text-center">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="ml-4 text-gray-400 hover:text-red-500"
                          title="Xóa sản phẩm"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-4 justify-between">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Trở về Shop
                </Link>
                <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cập nhật giỏ
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Tổng thanh toán</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="text-primary-600 font-medium">Miễn phí</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Link 
                to="/checkout"
                className="block w-full mt-6 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium text-center"
              >
                Đến trang thanh toán
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
