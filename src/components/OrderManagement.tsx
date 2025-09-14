import React, { useState } from 'react'
import OrderListManagement from './OrderListManagement'
import ReturnOrderManagement from './ReturnOrderManagement'
import OrderProcessingManagement from './OrderProcessingManagement'

export interface Order {
  id: number
  created_at: string
  customer_id: number
  promotion_applied_id?: number
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING'
  total_amount: number
  updated_at: string
  discount_amount: number
  payment_method: 'COD' | 'BANK_TRANSFER' | 'CREDIT_CARD'
  payment_status: 'PAID' | 'UNPAID' | 'PARTIAL'
}

export interface OrderDetail {
  id: number
  order_id: number
  product_unit_id: number
  quantity: number
  subtotal: number
  unit_price: number
}

export interface ReturnOrder {
  id: number
  created_at: string
  customer_id: number
  processed_at: string
  reason: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  order_id: number
  refund_amount: number
}

export interface ReturnDetail {
  id: number
  order_detail_id: number
  quantity: number
  refund_amount: number
  return_order_id: number
}

const OrderManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'processing' | 'orders' | 'returns'>('processing')

  const subTabs = [
    { id: 'processing', label: 'Xử lý đơn hàng', icon: '⚡' },
    { id: 'orders', label: 'Danh sách đơn hàng', icon: '📋' },
    { id: 'returns', label: 'Đơn hàng trả về', icon: '↩️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
            <p className="text-gray-600 mt-1">Quản lý đơn hàng, chi tiết đơn hàng và đơn hàng trả về</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSubTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'processing' && <OrderProcessingManagement />}
          {activeSubTab === 'orders' && <OrderListManagement />}
          {activeSubTab === 'returns' && <ReturnOrderManagement />}
        </div>
      </div>
    </div>
  )
}

export default OrderManagement
