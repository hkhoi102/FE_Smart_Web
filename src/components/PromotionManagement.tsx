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
    name: '', startDate: '', endDate: '', type: 'DISCOUNT_PERCENT' as PromotionType, active: true,
  })
  const [headerDateError, setHeaderDateError] = useState('')
  const [lineDateErrors, setLineDateErrors] = useState<Record<number, string>>({})
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

  const validateHeaderDates = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        setHeaderDateError('Ngày kết thúc phải sau ngày bắt đầu')
        return false
      }
    }
    setHeaderDateError('')
    return true
  }

  const validateLineDates = (lineIndex: number, startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        setLineDateErrors(prev => ({ ...prev, [lineIndex]: 'Ngày kết thúc phải sau ngày bắt đầu' }))
        return false
      }
    }
    setLineDateErrors(prev => ({ ...prev, [lineIndex]: '' }))
    return true
  }


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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 !mt-0">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tạo khuyến mãi mới</h3>
                <p className="text-xs text-gray-600 mt-0.5">Tạo chương trình khuyến mãi và cấu hình các loại giảm giá</p>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="text-base font-semibold text-gray-900">Thông tin chương trình</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tên chương trình <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={headerForm.name}
                        onChange={e=>setHeaderForm({...headerForm, name:e.target.value})}
                        placeholder="Nhập tên chương trình khuyến mãi..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Ngày bắt đầu <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={headerForm.startDate}
                          onChange={e=>{
                            const newStartDate = e.target.value
                            setHeaderForm({...headerForm, startDate: newStartDate})
                            // Kiểm tra validation khi cả 2 ngày đã được chọn
                            if (newStartDate && headerForm.endDate) {
                              validateHeaderDates(newStartDate, headerForm.endDate)
                            }
                          }}
                          className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${headerDateError ? 'border-red-500' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Ngày kết thúc <span className="text-gray-400 text-xs">(tùy chọn)</span>
                        </label>
                        <input
                          type="date"
                          value={headerForm.endDate}
                          onChange={e=>{
                            const newEndDate = e.target.value
                            setHeaderForm({...headerForm, endDate: newEndDate})
                            // Kiểm tra validation khi cả 2 ngày đã được chọn
                            if (headerForm.startDate && newEndDate) {
                              validateHeaderDates(headerForm.startDate, newEndDate)
                            }
                          }}
                          className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${headerDateError ? 'border-red-500' : ''}`}
                        />
                        {headerDateError && (
                          <p className="mt-1 text-sm text-red-600">{headerDateError}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
                        <select
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                          value={headerForm.active ? '1' : '0'}
                          onChange={(e)=>setHeaderForm({...headerForm, active: e.target.value==='1'})}
                        >
                          <option value="1">Kích hoạt</option>
                          <option value="0">Tạm dừng</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lines Section */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <h4 className="text-base font-semibold text-gray-900">Dòng khuyến mãi</h4>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {lines.length}
                      </span>
                    </div>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm hover:shadow"
                      onClick={()=>setLines(prev=>[...prev, newLine()])}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm dòng
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    {lines.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <p className="text-sm">Chưa có dòng khuyến mãi nào</p>
                      </div>
                    ) : (
                      lines.map((ln, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 12 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                Loại khuyến mãi
                              </label>
                              <select
                                value={ln.type}
                                onChange={e=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, type:e.target.value as PromotionType}:l))}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-colors"
                              >
                                <option value="DISCOUNT_PERCENT">Giảm theo %</option>
                                <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                                <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                              </select>
                            </div>
                            <div>
                              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Ngày bắt đầu
                              </label>
                              <input
                                type="date"
                                value={ln.lineStartDate || ''}
                                onChange={e=>{
                                  const newStartDate = e.target.value
                                  setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineStartDate: newStartDate}:l))
                                  // Kiểm tra validation khi cả 2 ngày đã được chọn
                                  if (newStartDate && ln.lineEndDate) {
                                    validateLineDates(idx, newStartDate, ln.lineEndDate)
                                  }
                                }}
                                className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${lineDateErrors[idx] ? 'border-red-500' : ''}`}
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Ngày kết thúc
                              </label>
                              <input
                                type="date"
                                value={ln.lineEndDate || ''}
                                onChange={e=>{
                                  const newEndDate = e.target.value
                                  setLines(prev=>prev.map((l,i)=> i===idx?{...l, lineEndDate: newEndDate}:l))
                                  // Kiểm tra validation khi cả 2 ngày đã được chọn
                                  if (ln.lineStartDate && newEndDate) {
                                    validateLineDates(idx, ln.lineStartDate, newEndDate)
                                  }
                                }}
                                className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${lineDateErrors[idx] ? 'border-red-500' : ''}`}
                              />
                              {lineDateErrors[idx] && (
                                <p className="mt-1 text-sm text-red-600">{lineDateErrors[idx]}</p>
                              )}
                            </div>
                          </div>
                          {/* Chỉ hiển thị nút xóa khi có nhiều hơn 1 dòng (trong modal tạo mới, tất cả dòng đều là dòng mới) */}
                          {lines.length > 1 && (
                            <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                onClick={()=>setLines(prev=>prev.filter((_,i)=>i!==idx))}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Xóa dòng
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                onClick={()=>setIsWizardOpen(false)}
              >
                Hủy
              </button>
              <button
                disabled={creating || !!headerDateError || Object.values(lineDateErrors).some(error => error)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow ${
                  creating || !!headerDateError || Object.values(lineDateErrors).some(error => error)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={async ()=>{
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
                }}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tạo khuyến mãi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PromotionManagement
