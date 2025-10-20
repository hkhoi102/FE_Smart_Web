import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PromotionServiceApi } from '@/services/promotionService'
import { ProductService } from '@/services/productService'

const PromotionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [header, setHeader] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [productNameCache, setProductNameCache] = useState<Record<number, string>>({})
  const [categoryNameCache, setCategoryNameCache] = useState<Record<number, string>>({})
  const [lineEditOpen, setLineEditOpen] = useState(false)
  const [lineEditing, setLineEditing] = useState<any | null>(null)
  const [lineDetails, setLineDetails] = useState<any[]>([])

  useEffect(() => {
    if (id) {
      loadPromotionDetails(parseInt(id))
    }
  }, [id])

  const loadPromotionDetails = async (promotionId: number) => {
    try {
      setLoading(true)

      // Load header
      const headerData = await PromotionServiceApi.getHeaderById(promotionId)
      setHeader({
        id: headerData.id,
        name: headerData.name,
        start_date: headerData.startDate,
        end_date: headerData.endDate,
        active: headerData.active,
        created_at: (headerData as any).createdAt
      })

      // Load lines
      const linesData = await PromotionServiceApi.getLinesAll(promotionId)
      const mappedLines = linesData.map((l: any) => ({
        id: l.id,
        targetType: l.targetType,
        targetId: l.targetId,
        type: l.type || l.promotionType,
        startDate: l.startDate,
        endDate: l.endDate,
        active: l.active,
      }))
      setLines(mappedLines)

      // Load target names
      await loadTargetNames(mappedLines)
    } catch (error) {
      console.error('Error loading promotion details:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTargetNames = async (lines: any[]) => {
    // Load categories if needed
    const needsCategory = lines.some(m => String(m.targetType).toUpperCase() === 'CATEGORY')
    if (needsCategory && Object.keys(categoryNameCache).length === 0) {
      try {
        const cats = await ProductService.getCategories()
        const rec: Record<number, string> = {}
        ;(cats || []).forEach((c: any) => { rec[c.id] = c.name })
        setCategoryNameCache(rec)
      } catch {}
    }

    // Load product names
    const unitIds = lines.filter(m => String(m.targetType).toUpperCase() === 'PRODUCT').map(m => m.targetId)
    for (const unitId of unitIds) {
      if (!productNameCache[unitId]) {
        try {
          const info = await ProductService.getProductUnitById(unitId)
          const title = info?.productName ? `${info.productName}` : `#${unitId}`
          setProductNameCache(prev => ({ ...prev, [unitId]: title }))
        } catch {
          setProductNameCache(prev => ({ ...prev, [unitId]: `#${unitId}` }))
        }
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const viType = (t?: string) => {
    switch ((t || '').toUpperCase()) {
      case 'DISCOUNT_PERCENT': return 'Giảm theo %'
      case 'DISCOUNT_AMOUNT': return 'Giảm tiền'
      case 'BUY_X_GET_Y': return 'Mua X tặng Y'
      default: return t || '-'
    }
  }

  const viTarget = (t?: string) => {
    switch ((t || '').toUpperCase()) {
      case 'PRODUCT': return 'Sản phẩm'
      case 'CATEGORY': return 'Danh mục'
      case 'CUSTOMER': return 'Khách hàng'
      default: return t || '-'
    }
  }

  const getStatusColor = (active: boolean) => {
    return active
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getStatusLabel = (active: boolean) => {
    return active ? 'Kích hoạt' : 'Tạm dừng'
  }

  const openLineEditor = async (line: any) => {
    setLineEditing(line)
    try {
      const ds = await PromotionServiceApi.getDetailsAll(line.id)
      setLineDetails(Array.isArray(ds) ? ds : [])
    } catch {
      setLineDetails([])
    }
    setLineEditOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 text-lg">Đang tải chi tiết khuyến mãi...</span>
        </div>
      </div>
    )
  }

  if (!header) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy khuyến mãi</h1>
          <button
            onClick={() => navigate('/admin?tab=promotions')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/promotions')}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chi tiết khuyến mãi</h1>
                <p className="text-sm text-gray-600 mt-0.5">{header.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(header.active)}`}>
                {getStatusLabel(header.active)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Promotion Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">#</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">ID</p>
                <p className="text-xl font-semibold text-gray-900">{header.id}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(header.start_date)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏰</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Ngày kết thúc</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(header.end_date)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Số dòng khuyến mãi</p>
                <p className="text-xl font-semibold text-gray-900">{lines.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lines Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Các dòng khuyến mãi</h3>
            <p className="text-sm text-gray-500 mt-1">Chi tiết các dòng khuyến mãi áp dụng</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bắt đầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết thúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lines.map((line: any) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{line.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {viType(line.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {line.startDate ? formatDate(line.startDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {line.endDate ? formatDate(line.endDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(line.active)}`}>
                        {getStatusLabel(line.active)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openLineEditor(line)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={6}>
                      <div className="flex flex-col items-center gap-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Chưa có dòng khuyến mãi</h3>
                          <p className="text-gray-500 mt-1">Khuyến mãi này chưa có dòng chi tiết nào.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Line Detail Editor Modal */}
      {lineEditOpen && lineEditing && (
        <LineDetailEditor
          line={lineEditing}
          details={lineDetails}
          onChange={(arr) => setLineDetails(arr)}
          onClose={() => setLineEditOpen(false)}
        />
      )}
    </div>
  )
}

// Modal: Edit details for a single line
const LineDetailEditor: React.FC<{ line: any; details: any[]; onChange: (arr: any[]) => void; onClose: () => void }> = ({ line, details, onChange, onClose }) => {
  const [saving, setSaving] = useState(false)
  const [giftNameByUnitId, setGiftNameByUnitId] = useState<Record<number, string>>({})
  const [giftUnitOptions, setGiftUnitOptions] = useState<Array<{ id: number; label: string }>>([])
  const [conditionUnitOptions, setConditionUnitOptions] = useState<Array<{ id: number; label: string }>>([])

  const viType = (t?: string) => {
    switch (String(t || '').toUpperCase()) {
      case 'DISCOUNT_PERCENT': return 'Giảm theo %'
      case 'DISCOUNT_AMOUNT': return 'Giảm tiền'
      case 'BUY_X_GET_Y': return 'Mua X tặng Y'
      default: return t || '-'
    }
  }
  const viTarget = (t?: string) => {
    switch (String(t || '').toUpperCase()) {
      case 'PRODUCT': return 'Sản phẩm'
      case 'CATEGORY': return 'Danh mục'
      case 'CUSTOMER': return 'Khách hàng'
      default: return t || '-'
    }
  }

  const addDetail = () => onChange([...(details || []), { id: 0, promotionLineId: line.id, discountPercent: '', discountAmount: '', minAmount: '', maxDiscount: '', conditionQuantity: '', freeQuantity: '', giftProductUnitId: '', conditionProductUnitId: '', active: true }])
  const removeDetail = (idx: number) => onChange(details.filter((_, i) => i !== idx))

  const save = async () => {
    setSaving(true)
    try {
      for (const d of details) {
        const t = String(line?.type || '').toUpperCase()
        const body: any = { promotionLineId: line.id, active: d.active !== false }
        if (t === 'DISCOUNT_PERCENT') {
          body.discountPercent = d.discountPercent ? Number(d.discountPercent) : undefined
          body.minAmount = d.minAmount ? Number(d.minAmount) : undefined
          body.maxDiscount = d.maxDiscount ? Number(d.maxDiscount) : undefined
        } else if (t === 'DISCOUNT_AMOUNT') {
          body.discountAmount = d.discountAmount ? Number(d.discountAmount) : undefined
          body.minAmount = d.minAmount ? Number(d.minAmount) : undefined
          body.maxDiscount = d.maxDiscount ? Number(d.maxDiscount) : undefined
        } else if (t === 'BUY_X_GET_Y') {
          body.conditionQuantity = d.conditionQuantity ? Number(d.conditionQuantity) : undefined
          body.freeQuantity = d.freeQuantity ? Number(d.freeQuantity) : undefined
          body.giftProductUnitId = d.giftProductUnitId ? Number(d.giftProductUnitId) : undefined
          body.conditionProductUnitId = d.conditionProductUnitId ? Number(d.conditionProductUnitId) : undefined
        }
        if (d.id && d.id !== 0) await PromotionServiceApi.updateDetail(d.id, body)
        else await PromotionServiceApi.createDetail(body)
      }
      onClose()
    } finally { setSaving(false) }
  }

  const resolveGiftName = async (unitId?: number | string) => {
    const idNum = Number(unitId)
    if (!idNum || isNaN(idNum)) return
    if (giftNameByUnitId[idNum]) return
    try {
      const info = await ProductService.getProductUnitById(idNum)
      const name = info?.productName || ''
      setGiftNameByUnitId(prev => ({ ...prev, [idNum]: name }))
    } catch {}
  }

  // Load selectable gift and condition product units
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await ProductService.getProducts(1, 1000)
        if (cancelled) return
        const opts: Array<{ id: number; label: string }> = []
        ;(list?.products || []).forEach((p: any) => {
          (p.productUnits || []).forEach((u: any) => {
            const label = `${p.name}${u.unitName ? ' • ' + u.unitName : ''}`
            if (u.id) opts.push({ id: Number(u.id), label })
          })
        })
        setGiftUnitOptions(opts)
        setConditionUnitOptions(opts)
      } catch {
        setGiftUnitOptions([])
        setConditionUnitOptions([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Resolve names for existing details (when modal opens)
  useEffect(() => {
    ;(async () => {
      for (const d of details) {
        if (d && d.giftProductUnitId) {
          await resolveGiftName(d.giftProductUnitId)
        }
      }
    })()
  }, [details])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 style: !mt-0">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Sửa chi tiết khuyến mãi</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg text-gray-800 font-medium">{viType(line?.type)}</div>
          <button className="px-4 py-2 text-xs rounded-md text-white bg-green-600 hover:bg-green-700" onClick={addDetail}>+ Thêm chi tiết</button>
        </div>
        <div className="space-y-4">
          {(details || []).map((d, idx) => {
            const t = String(line?.type || '').toUpperCase()
            return (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                {t === 'DISCOUNT_PERCENT' && (
                  <div className="col-span-12 md:col-span-3">
                    <div className="text-sm text-gray-700 mb-1">% giảm</div>
                    <input placeholder="% giảm" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.discountPercent || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, discountPercent:e.target.value}:x))} />
                  </div>
                )}
                {t === 'DISCOUNT_AMOUNT' && (
                  <div className="col-span-12 md:col-span-4">
                    <div className="text-sm text-gray-700 mb-1">Giảm tiền</div>
                    <input placeholder="Giảm tiền" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.discountAmount || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, discountAmount:e.target.value}:x))} />
                  </div>
                )}
                {(t === 'DISCOUNT_PERCENT' || t === 'DISCOUNT_AMOUNT') && (
                  <>
                    <div className={t === 'DISCOUNT_AMOUNT' ? "col-span-12 md:col-span-7" : "col-span-12 md:col-span-4"}>
                      <div className="text-sm text-gray-700 mb-1">Đơn tối thiểu</div>
                      <input placeholder="Nhập giá trị tối thiểu" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.minAmount || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, minAmount:e.target.value}:x))} />
                    </div>
                    {t === 'DISCOUNT_PERCENT' && (
                      <div className="col-span-12 md:col-span-4">
                        <div className="text-sm text-gray-700 mb-1">Giảm tối đa</div>
                        <input placeholder="Nhập mức giảm tối đa" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.maxDiscount || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, maxDiscount:e.target.value}:x))} />
                      </div>
                    )}
                  </>
                )}
                {t === 'BUY_X_GET_Y' && (
                  <>
                    <div className="col-span-12 md:col-span-3 relative">
                      <div className="text-sm text-gray-700 mb-1">Sản phẩm điều kiện (Mua X)</div>
                      <input
                        placeholder="Nhập tên sản phẩm điều kiện..."
                        className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(d.conditionQuery ?? '')}
                        onChange={(e)=>{
                          const q = e.target.value
                          onChange(details.map((x,i)=> i===idx?{...x, conditionQuery:q, showSuggestCondition:true}:x))
                        }}
                      />
                      {((d.conditionQuery || '').trim().length > 0) && d.showSuggestCondition && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
                          {conditionUnitOptions.filter(o => o.label.toLowerCase().includes(String(d.conditionQuery).toLowerCase())).slice(0,8).map(opt => (
                            <div key={opt.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={()=>{
                              onChange(details.map((x,i)=> i===idx?{...x, conditionProductUnitId: opt.id, conditionQuery: opt.label, showSuggestCondition:false}:x))
                            }}>{opt.label}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <div className="text-sm text-gray-700 mb-1">Số lượng mua (X)</div>
                      <input placeholder="SL X" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.conditionQuantity || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, conditionQuantity:e.target.value}:x))} />
                    </div>
                    <div className="col-span-12 md:col-span-4 relative">
                      <div className="text-sm text-gray-700 mb-1">Đơn vị quà tặng</div>
                      <input
                        placeholder="Nhập tên sản phẩm để tìm..."
                        className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(d.giftQuery ?? (giftNameByUnitId[Number(d.giftProductUnitId)] || ''))}
                        onChange={(e)=>{
                          const q = e.target.value
                          onChange(details.map((x,i)=> i===idx?{...x, giftQuery:q, showSuggest:true}:x))
                        }}
                      />
                      {((d.giftQuery || '').trim().length > 0) && d.showSuggest && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
                          {giftUnitOptions.filter(o => o.label.toLowerCase().includes(String(d.giftQuery).toLowerCase())).slice(0,8).map(opt => (
                            <div key={opt.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={async ()=>{
                              onChange(details.map((x,i)=> i===idx?{...x, giftProductUnitId: opt.id, giftQuery: opt.label, showSuggest:false}:x))
                              await resolveGiftName(opt.id)
                            }}>{opt.label}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-2">
                      <div className="text-sm text-gray-700 mb-1">Số lượng tặng (Y)</div>
                      <input placeholder="SL Y" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.freeQuantity || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, freeQuantity:e.target.value}:x))} />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end justify-end">
                      <button className="px-3 py-2 text-xs text-red-600 hover:text-red-700" onClick={()=>removeDetail(idx)}>Xóa</button>
                    </div>
                  </>
                )}
                {t !== 'BUY_X_GET_Y' && t !== 'DISCOUNT_PERCENT' && t !== 'DISCOUNT_AMOUNT' && (
                  <div className="text-xs text-gray-500">Loại khuyến mãi chưa xác định.</div>
                )}
                {t !== 'BUY_X_GET_Y' && (
                  <div className="col-span-12 md:col-span-1">
                    <button className="text-xs text-red-600 hover:text-red-700" onClick={()=>removeDetail(idx)}>Xóa</button>
                  </div>
                )}
              </div>
            )
          })}
          {(details || []).length === 0 && (<div className="text-sm text-gray-500">Chưa có chi tiết</div>)}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 rounded-md border" onClick={onClose}>Hủy</button>
          <button disabled={saving} className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" onClick={save}>Lưu</button>
        </div>
      </div>
    </div>
  )
}

export default PromotionDetail
