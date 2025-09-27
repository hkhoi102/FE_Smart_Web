import React, { useState } from 'react'
import { PromotionService, PromotionType, TargetType } from '@/services/promotionService'
import PromotionHeaderManagement from './PromotionHeaderManagement'

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
  // Bỏ các tab Lines/Details theo yêu cầu; giữ một màn hình quản lý Header
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [headerForm, setHeaderForm] = useState({
    name: '', startDate: '', endDate: '', type: 'DISCOUNT_PERCENT' as PromotionType,
  })
  type LineItem = {
    targetType: TargetType
    targetId: number
    type: PromotionType
    lineStartDate?: string
    lineEndDate?: string
    discountPercent?: string
    discountAmount?: string
    minAmount?: string
    maxDiscount?: string
    conditionQuantity?: string
    freeQuantity?: string
  }
  const newLine = (): LineItem => ({ targetType: 'PRODUCT', targetId: 0, type: 'DISCOUNT_PERCENT' })
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  const subTabs: Array<{ id: 'headers'; label: string; icon: string }> = [
    { id: 'headers', label: 'Header Khuyến mãi', icon: '📋' },
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
          <button onClick={() => setIsWizardOpen(true)} className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700">Tạo khuyến mãi nhanh</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { /* chỉ còn tab headers */ }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  true
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
          <PromotionHeaderManagement />
        </div>
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tạo khuyến mãi nhanh</h3>
              <button onClick={() => setIsWizardOpen(false)} className="text-gray-500 hover:text-gray-700">✖</button>
            </div>
            <div className="space-y-4">
              {/* Header section */}
              <div className="rounded border p-4">
                <div className="font-medium mb-3">Thông tin chương trình</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                    <input value={headerForm.name} onChange={e=>setHeaderForm({...headerForm, name:e.target.value})} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                    <input type="date" value={headerForm.startDate} onChange={e=>setHeaderForm({...headerForm, startDate:e.target.value})} className="w-full px-3 py-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc (tùy chọn)</label>
                    <input type="date" value={headerForm.endDate} onChange={e=>setHeaderForm({...headerForm, endDate:e.target.value})} className="w-full px-3 py-2 border rounded" />
                  </div>
                </div>
              </div>

              {/* Lines section */}
              <div className="rounded border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Các loại khuyến mãi áp dụng</div>
                  <button className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700" onClick={()=>setLines(prev=>[...prev, newLine()])}>+ Thêm loại</button>
                </div>
                <div className="space-y-4">
                  {lines.map((ln, idx) => (
                    <div key={idx} className="rounded-md border p-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Áp dụng cho</label>
                          <select value={ln.targetType} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetType:e.target.value as TargetType}:l))} className="w-full px-3 py-2 border rounded">
                            <option value="PRODUCT">Sản phẩm</option>
                            <option value="CATEGORY">Danh mục</option>
                            <option value="CUSTOMER">Khách hàng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">ID mục tiêu</label>
                          <input type="number" value={ln.targetId} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetId:Number(e.target.value)}:l))} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Loại</label>
                          <select value={ln.type} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, type:e.target.value as PromotionType}:l))} className="w-full px-3 py-2 border rounded">
                            <option value="DISCOUNT_PERCENT">Giảm theo %</option>
                            <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                            <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bắt đầu (Loại)</label>
                          <input type="date" value={ln.lineStartDate || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineStartDate:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Kết thúc (Loại)</label>
                          <input type="date" value={ln.lineEndDate || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineEndDate:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        {ln.type === 'DISCOUNT_PERCENT' && (
                          <div>
                            <label className="block text-sm font-medium mb-1">% giảm</label>
                            <input type="number" value={ln.discountPercent || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, discountPercent:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                          </div>
                        )}
                        {ln.type === 'DISCOUNT_AMOUNT' && (
                          <div>
                            <label className="block text-sm font-medium mb-1">Số tiền giảm</label>
                            <input type="number" value={ln.discountAmount || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, discountAmount:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                          </div>
                        )}
                        {ln.type === 'BUY_X_GET_Y' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1">Số lượng mua (X)</label>
                              <input type="number" value={ln.conditionQuantity || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, conditionQuantity:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Số lượng tặng (Y)</label>
                              <input type="number" value={ln.freeQuantity || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, freeQuantity:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-sm font-medium mb-1">Đơn tối thiểu</label>
                          <input type="number" value={ln.minAmount || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, minAmount:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Giảm tối đa</label>
                          <input type="number" value={ln.maxDiscount || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, maxDiscount:e.target.value}:l))} className="w-full px-3 py-2 border rounded" />
                        </div>
                      </div>
                      {lines.length > 1 && (
                        <div className="flex justify-end mt-3">
                          <button className="text-red-600" onClick={()=>setLines(prev=>prev.filter((_,i)=>i!==idx))}>Xóa loại</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded border" onClick={()=>setIsWizardOpen(false)}>Hủy</button>
                <button disabled={creating} className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50" onClick={async ()=>{
                  if (!headerForm.name.trim() || !headerForm.startDate) return
                  setCreating(true)
                  try {
                    const header = { name: headerForm.name.trim(), startDate: headerForm.startDate, endDate: headerForm.endDate || undefined, active: true }
                    // Tạo header trước
                    const h = await PromotionService.createHeader(header)
                    // Tạo tất cả line+detail
                    for (const ln of lines) {
                      const createdLine = await PromotionService.createLine({ promotionHeaderId: h.id, targetType: ln.targetType, targetId: Number(ln.targetId), startDate: ln.lineStartDate || undefined, endDate: ln.lineEndDate || undefined, active: true, type: ln.type })
                      const detail: any = { promotionLineId: createdLine.id, active: true }
                      if (ln.type === 'DISCOUNT_PERCENT') detail.discountPercent = Number(ln.discountPercent || 0)
                      if (ln.type === 'DISCOUNT_AMOUNT') detail.discountAmount = Number(ln.discountAmount || 0)
                      if (ln.type === 'BUY_X_GET_Y') { detail.conditionQuantity = Number(ln.conditionQuantity || 0); detail.freeQuantity = Number(ln.freeQuantity || 0) }
                      if (ln.minAmount) detail.minAmount = Number(ln.minAmount)
                      if (ln.maxDiscount) detail.maxDiscount = Number(ln.maxDiscount)
                      await PromotionService.createDetail(detail)
                    }
                    setIsWizardOpen(false)
                    alert('Tạo khuyến mãi thành công')
                  } catch (e:any) {
                    alert(e?.message || 'Tạo khuyến mãi thất bại')
                  } finally { setCreating(false) }
                }}>Tạo khuyến mãi</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromotionManagement
