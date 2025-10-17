import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/productService'

type Item = { productCode: string; productName: string; unitId: number; unitName: string; price: number }

const PriceHeaderDetail = () => {
  const { headerId } = useParams<{ headerId: string }>()
  const navigate = useNavigate()
  const [header, setHeader] = useState<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string } | null>(null)
  const [maSP, setMaSP] = useState('')
  const [unitOptions, setUnitOptions] = useState<Array<{ id: number; name: string; code?: string }>>([])
  const [foundProductName, setFoundProductName] = useState<string>('')
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('')
  const [price, setPrice] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; code?: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchDebounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Load basic header info from list to show name/desc
    (async () => {
      try {
        const list = await ProductService.listPriceHeaders()
        const h = list.find((x: any) => String(x.id) === String(headerId))
        if (h) setHeader({ id: h.id, name: h.name, description: h.description, timeStart: h.timeStart, timeEnd: h.timeEnd })
      } catch {}
    })()
  }, [headerId])

  const loadUnitsByCode = async (code: string) => {
    try {
      setUnitOptions([])
      setSelectedUnitId('')
      // Ưu tiên tìm theo mã ĐƠN VỊ (maSP thuộc đơn vị)
      let prod = await ProductService.getProductByUnitCode(code)
      if (!prod) {
        // fallback: một số mã cũ lưu ở cấp sản phẩm
        prod = await ProductService.getProductByProductCode(code)
      }
      if (prod && Array.isArray(prod.productUnits)) {
        setFoundProductName(prod.name || '')
        const opts = prod.productUnits.map((u: any) => ({ id: u.id, name: u.unitName, code: (u as any).code }))
        setUnitOptions(opts)
        // Auto-chọn đơn vị trùng mã (ưu tiên), nếu không có thì chọn đơn vị đầu tiên
        const matched = opts.find(u => (u.code || '').toLowerCase() === code.toLowerCase())
        setSelectedUnitId(matched ? matched.id : (opts[0]?.id || ''))
      } else {
        setFoundProductName('')
        setMessage('Không tìm thấy sản phẩm theo mã')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setUnitOptions([])
    }
  }

  // Debounced product search for suggestions by name/code
  useEffect(() => {
    // Clear previous timer
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }

    const term = maSP.trim()
    if (!term) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    searchDebounceRef.current = window.setTimeout(async () => {
      try {
        // Chỉ thực hiện fuzzy search để gợi ý; KHÔNG gọi API by-unit-code tại đây
        const res = await ProductService.getProducts(1, 8, term)
        const items = (res?.products || []).map(p => ({ id: p.id, name: p.name, code: p.code }))
        setSuggestions(items)
        setShowSuggestions(items.length > 0)
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [maSP])

  const addItem = () => {
    if (!maSP.trim() || !selectedUnitId || !price) return
    const p = parseFloat(String(price).replace(/\./g, ''))
    if (isNaN(p) || p <= 0) return
    const unitName = unitOptions.find(u => u.id === Number(selectedUnitId))?.name || `Unit #${selectedUnitId}`
    setItems(prev => [...prev, { productCode: maSP.trim(), productName: foundProductName || maSP.trim(), unitId: Number(selectedUnitId), unitName, price: p }])
    setPrice('')
  }

  const submit = async () => {
    if (!headerId) return
    if (items.length === 0 && (!maSP.trim() || !selectedUnitId || !price)) return
    setLoading(true)
    try {
      const payload = (items.length > 0
        ? items.map(it => ({ productUnitId: it.unitId, price: it.price, productCode: it.productCode }))
        : [{ productUnitId: Number(selectedUnitId), price: Number(String(price).replace(/\./g, '')), productCode: maSP.trim() }]
      )
      await ProductService.bulkAddPricesToHeader(Number(headerId), payload)
      setItems([])
      setMaSP('')
      setSelectedUnitId('')
      setPrice('')
      setUnitOptions([])
      setFoundProductName('')
      setMessage('Đã thêm giá vào bảng giá')
      setTimeout(() => setMessage(''), 3000)
    } catch (e: any) {
      setMessage(e?.message || 'Không thể thêm giá')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{header?.name || `#${headerId}`}</h1>
          <div className="mt-2 flex items-center gap-3">
            {header?.timeStart && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Hiệu lực từ: {new Date(header.timeStart).toLocaleDateString('vi-VN')}
              </span>
            )}
            {header?.timeEnd && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                Đến: {new Date(header.timeEnd).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin?tab=prices')}
          className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >← Quay về Giá</button>

      </div>
      {header?.description && <p className="text-gray-600 mt-1">{header.description}</p>}

      {message && (
        <div className="mb-4 px-4 py-2 rounded border bg-yellow-50 text-yellow-800">{message}</div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã sản phẩm (maSP)</label>
            <div className="relative">
              <input
                type="text"
                value={maSP}
                onChange={(e) => { setMaSP(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const code = maSP.trim()
                    if (code) await loadUnitsByCode(code)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="VD: SP-0001"
              />
              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={async () => {
                        setShowSuggestions(false)
                        if (s.code) {
                          setMaSP(s.code)
                          await loadUnitsByCode(s.code)
                        } else {
                          setMessage('Sản phẩm chưa có mã đơn vị. Vui lòng chọn mục có mã.')
                          setTimeout(() => setMessage(''), 2000)
                        }
                      }}
                    >
                      <div className="text-sm text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.code ? `Mã: ${s.code}` : `ID: ${s.id}`}</div>
                    </button>
                  ))}
                </div>
              )}
              {/* Removed explicit search button; selection from suggestions auto-loads units */}
            </div>
            {/* Removed product info chip */}
          </div>
          {unitOptions.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị</label>
                <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-800">
                  {unitOptions.find(u => u.id === Number(selectedUnitId))?.name || '—'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Nhập giá"
                  />
                  <button type="button" onClick={addItem} className="px-3 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700">Thêm</button>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-800 mb-2">Danh sách chờ thêm</div>
            <div className="overflow-hidden rounded-md border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị tính</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-700">{it.productName} <span className="text-gray-500">({it.productCode})</span></td>
                      <td className="px-4 py-2 text-sm text-gray-700">{it.unitName}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.price)}</td>
                      <td className="px-4 py-2 text-right">
                        <button type="button" className="text-red-600 hover:text-red-800 text-sm" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >{loading ? 'Đang lưu...' : 'Lưu vào bảng giá'}</button>
        </div>
      </div>
    </div>
  )
}

export default PriceHeaderDetail


