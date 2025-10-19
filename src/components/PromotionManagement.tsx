import React, { useEffect, useState } from 'react'
import { PromotionService, PromotionType, TargetType } from '@/services/promotionService'
import PromotionHeaderManagement from './PromotionHeaderManagement'
import { ProductService } from '@/services/productService'

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
    name: '', startDate: '', endDate: '', type: 'DISCOUNT_PERCENT' as PromotionType, active: true,
  })
  type LineItem = {
    targetType: TargetType
    targetId: number
    type: PromotionType
    lineStartDate?: string
    lineEndDate?: string
    targetNameQuery?: string
  }
  const newLine = (): LineItem => ({ targetType: 'PRODUCT', targetId: 0, type: 'DISCOUNT_PERCENT' })
  const [lines, setLines] = useState<LineItem[]>([newLine()])

  const [productOptions, setProductOptions] = useState<Array<{ id: number; name: string }>>([])
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: number; name: string }>>([])

  useEffect(() => {
    if (!isWizardOpen) return
    ;(async () => {
      try {
        const prods = await ProductService.getProducts(1, 1000)
        setProductOptions(prods.products.map(p => ({ id: p.id, name: p.name })))
      } catch { setProductOptions([]) }
      try {
        const cats = await ProductService.getCategories()
        setCategoryOptions(cats.map((c: any) => ({ id: c.id, name: c.name })))
      } catch { setCategoryOptions([]) }
    })()
  }, [isWizardOpen])

  const subTabs: Array<{ id: 'headers'; label: string; icon: string }> = [
    { id: 'headers', label: 'Header Khuyến mãi', icon: '📋' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Quản lý Khuyến mãi</h1>
            <p className="text-sm text-gray-600 mt-1">Quản lý các chương trình khuyến mãi và giảm giá</p>
          </div>
          <button onClick={() => setIsWizardOpen(true)} className="px-3 py-1.5 rounded-md text-sm text-white bg-green-600 hover:bg-green-700">Tạo khuyến mãi mới</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 style: !mt-0">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-7 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Tạo khuyến mãi mới</h3>
              <button onClick={() => setIsWizardOpen(false)} className="text-gray-500 hover:text-gray-700">✖</button>
            </div>
            <div className="space-y-4">
              {/* Header section */}
              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="text-base font-semibold text-gray-900 mb-4">Thông tin chương trình</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
                    <input value={headerForm.name} onChange={e=>setHeaderForm({...headerForm, name:e.target.value})} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                    <input type="date" value={headerForm.startDate} onChange={e=>setHeaderForm({...headerForm, startDate:e.target.value})} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc (tùy chọn)</label>
                    <input type="date" value={headerForm.endDate} onChange={e=>setHeaderForm({...headerForm, endDate:e.target.value})} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={headerForm.active ? '1' : '0'} onChange={(e)=>setHeaderForm({...headerForm, active: e.target.value==='1'})}>
                      <option value="1">Kích hoạt</option>
                      <option value="0">Tạm dừng</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lines section */}
              <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base font-semibold text-gray-900">Các loại khuyến mãi áp dụng</div>
                  <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700" onClick={()=>setLines(prev=>[...prev, newLine()])}>
                    <span className="text-lg leading-none">＋</span> Thêm loại
                  </button>
                </div>
                <div className="space-y-4">
                  {lines.map((ln, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* Ẩn hoàn toàn Áp dụng cho & Mục tiêu cho mọi loại khuyến mãi theo yêu cầu */}
                        <div>
                          <label className="block text-sm font-medium mb-1">Loại</label>
                          <select value={ln.type} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, type:e.target.value as PromotionType}:l))} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="DISCOUNT_PERCENT">Giảm theo %</option>
                            <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                            <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bắt đầu</label>
                          <input type="date" value={ln.lineStartDate || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineStartDate:e.target.value}:l))} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Kết thúc</label>
                          <input type="date" value={ln.lineEndDate || ''} onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineEndDate:e.target.value}:l))} className="w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                      {/* Bỏ phần detail cho khuyến mãi */}
                      {lines.length > 1 && (
                        <div className="flex justify-end mt-3">
                          <button className="text-red-600 hover:text-red-700" onClick={()=>setLines(prev=>prev.filter((_,i)=>i!==idx))}>Xóa loại</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 rounded-md border" onClick={()=>setIsWizardOpen(false)}>Hủy</button>
                <button disabled={creating} className="px-5 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50" onClick={async ()=>{
                  if (!headerForm.name.trim() || !headerForm.startDate) return
                  setCreating(true)
                  try {
                    const header = { name: headerForm.name.trim(), startDate: headerForm.startDate, endDate: headerForm.endDate || undefined, active: !!headerForm.active }
                    // Tạo header trước
                    const h = await PromotionService.createHeader(header)
                    // Tạo các line (không tạo detail)
                    for (const ln of lines) {
                      await PromotionService.createLine({ promotionHeaderId: h.id, targetType: null as any, targetId: null as any, startDate: ln.lineStartDate || undefined, endDate: ln.lineEndDate || undefined, active: true, type: ln.type })
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
