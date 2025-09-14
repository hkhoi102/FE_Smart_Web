import React, { useState } from 'react'
import PromotionHeaderManagement from './PromotionHeaderManagement'
import PromotionLineManagement from './PromotionLineManagement'
import PromotionDetailManagement from './PromotionDetailManagement'

export interface PromotionHeader {
  id: number
  name: string
  start_date: string
  end_date: string
  active: number
  created_at: string
}

export interface PromotionLine {
  id: number
  promotion_header_id: number
  target_id: number
  target_type: 'PRODUCT' | 'CATEGORY'
  type: 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y'
  start_date: string
  end_date: string
  active: number
}

export interface PromotionDetail {
  id: number
  promotion_line_id: number
  discount_percent?: number
  discount_amount?: number
  min_amount?: number
  max_discount?: number
  condition_quantity?: number
  free_quantity?: number
  active: number
}

const PromotionManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'lines' | 'details'>('headers')

  const subTabs = [
    { id: 'headers', label: 'Header Khuyến mãi', icon: '📋' },
    { id: 'lines', label: 'Dòng Khuyến mãi', icon: '📝' },
    { id: 'details', label: 'Chi tiết Khuyến mãi', icon: '⚙️' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Khuyến mãi</h1>
            <p className="text-gray-600 mt-1">Quản lý các chương trình khuyến mãi và giảm giá</p>
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
          {activeSubTab === 'headers' && <PromotionHeaderManagement />}
          {activeSubTab === 'lines' && <PromotionLineManagement />}
          {activeSubTab === 'details' && <PromotionDetailManagement />}
        </div>
      </div>
    </div>
  )
}

export default PromotionManagement
