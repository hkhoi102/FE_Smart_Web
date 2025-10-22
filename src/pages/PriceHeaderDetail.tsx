import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/productService'

type Item = { productCode: string; productName: string; unitId: number; unitName: string; price: number }

const PriceHeaderDetail = () => {
  const { headerId } = useParams<{ headerId: string }>()
  const navigate = useNavigate()
  const [header, setHeader] = useState<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string } | null>(null)
  const [maSP, setMaSP] = useState('')
  const [unitOptions, setUnitOptions] = useState<Array<{ id: number; name: string; code?: string; conversionFactor?: number; isDefault?: boolean }>>([])
  const [foundProductName, setFoundProductName] = useState<string>('')
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('')
  const [price, setPrice] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [priceError, setPriceError] = useState(false)
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; code?: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchDebounceRef = useRef<number | undefined>(undefined)
  const [existingProducts, setExistingProducts] = useState<Array<{
    productCode: string | null;
    productId: number;
    productName: string;
    units: Array<{
      productUnitId: number;
      unitName: string;
      price: number;
      createdAt: string;
    }>;
    totalUnits: number;
  }>>([])
  const [showExistingProducts, setShowExistingProducts] = useState(false)

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

  // Load existing products in header
  const loadExistingProducts = async () => {
    if (!headerId) return
    try {
      const data = await ProductService.checkProductsInHeader(Number(headerId))
      setExistingProducts(data.productsInHeader)
    } catch (error) {
      console.error('Error loading existing products:', error)
      setExistingProducts([])
    }
  }

  useEffect(() => {
    loadExistingProducts()
  }, [headerId])

  const loadUnitsByCode = async (code: string) => {
    try {
      setUnitOptions([])
      setSelectedUnitId('')
      setFoundProductName('')

      // Tìm sản phẩm theo mã chung (mã sản phẩm)
      const prod = await ProductService.getProductByProductCode(code)

      if (prod && Array.isArray(prod.productUnits)) {
        setFoundProductName(prod.name || '')
        const opts = prod.productUnits.map((u: any) => ({
          id: u.id,
          name: u.unitName,
          code: (u as any).code,
          conversionFactor: u.conversionFactor || 1,
          isDefault: u.isDefault || false
        }))
        setUnitOptions(opts)

        // Chọn đơn vị mặc định nếu có, nếu không thì chọn đơn vị đầu tiên
        const defaultUnit = opts.find(u => u.isDefault) || opts[0]
        setSelectedUnitId(defaultUnit?.id || '')

        setMessage('')
      } else {
        setFoundProductName('')
        setMessage('Không tìm thấy sản phẩm theo mã')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error loading product by code:', error)
      setUnitOptions([])
      setFoundProductName('')
      setMessage('Lỗi khi tìm kiếm sản phẩm')
      setTimeout(() => setMessage(''), 3000)
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
        // Tìm kiếm sản phẩm theo mã hoặc tên để gợi ý
        const res = await ProductService.getProducts(1, 8, term)
        const items = (res?.products || [])
          .filter(p => p.code && p.code.toLowerCase().includes(term.toLowerCase()))
          .map(p => ({ id: p.id, name: p.name, code: p.code }))
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

  const addItem = async () => {
    if (!maSP.trim() || !selectedUnitId || !price) {
      if (!price.trim()) {
        setPriceError(true)
      }
      setMessage('Vui lòng điền đầy đủ thông tin sản phẩm, đơn vị và giá')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const p = parseFloat(String(price).replace(/\./g, ''))
    if (isNaN(p) || p <= 0) {
      setPriceError(true)
      setMessage('Giá phải là số dương')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const productUnitId = Number(selectedUnitId)
    const unitName = unitOptions.find(u => u.id === productUnitId)?.name || `Unit #${selectedUnitId}`

    // Kiểm tra xem sản phẩm đã có trong header chưa
    const productExists = existingProducts.find(ep =>
      ep.productCode === maSP.trim() ||
      ep.units.some(unit => unit.productUnitId === productUnitId)
    )

    if (productExists) {
      setMessage('Sản phẩm này đã có giá trong bảng giá. Vui lòng chọn sản phẩm khác.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    // Kiểm tra xem đã có trong danh sách chờ thêm chưa
    const alreadyInItems = items.some(item => item.unitId === productUnitId)

    if (alreadyInItems) {
      setMessage('Sản phẩm này đã có trong danh sách chờ thêm.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    // Kiểm tra xung đột thời gian với các header giá khác
    try {
      setLoading(true)
      const timeConflictResult = await ProductService.checkTimeConflict(productUnitId, Number(headerId))

      if (timeConflictResult.hasConflict) {
        // Sử dụng thông báo chi tiết từ API và chuẩn hóa thời gian
        let conflictMessage = timeConflictResult.message || 'Sản phẩm này có xung đột thời gian với các bảng giá khác'

        // Chuẩn hóa thời gian và dịch "header" thành "bảng giá"
        conflictMessage = conflictMessage
          .replace(/header/gi, 'bảng giá')
          .replace(/Header/gi, 'Bảng giá')
          .replace(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}):\d{2}/g, (match) => {
            // Chuyển đổi từ ISO format sang format Việt Nam (chỉ ngày)
            const dateObj = new Date(match)
            const day = dateObj.getDate().toString().padStart(2, '0')
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
            const year = dateObj.getFullYear()
            return `${day}/${month}/${year}`
          })

        setMessage(conflictMessage)
        setTimeout(() => setMessage(''), 5000)
        return
      }
    } catch (error) {
      console.error('Error checking time conflict:', error)
      setMessage('Không thể kiểm tra xung đột thời gian. Vui lòng thử lại.')
      setTimeout(() => setMessage(''), 3000)
      return
    } finally {
      setLoading(false)
    }

    setItems(prev => [...prev, { productCode: maSP.trim(), productName: foundProductName || maSP.trim(), unitId: productUnitId, unitName, price: p }])
    setPrice('')
    setPriceError(false) // Reset lỗi giá khi thành công
    setMessage('') // Clear any previous error message
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

      // Reload existing products để cập nhật danh sách
      await loadExistingProducts()
    } catch (e: any) {
      console.error('Error adding prices:', e)

      // Xử lý lỗi 400 - sản phẩm đã có giá trong header
      if (e?.status === 400) {
        let errorMessage = 'Không thể thêm giá'

        if (e?.message) {
          const message = e.message.toLowerCase()
          console.log('🔍 Bulk add prices error message from backend:', e.message)

          // Kiểm tra lỗi sản phẩm đã có giá
          if (message.includes('already exists') || message.includes('đã tồn tại') ||
              message.includes('duplicate') || message.includes('trùng') ||
              message.includes('already have price') || message.includes('đã có giá')) {
            errorMessage = 'Một số sản phẩm đã có giá trong bảng giá này. Vui lòng kiểm tra lại.'
          }
          // Nếu có thông báo cụ thể từ backend, sử dụng nó
          else if (e.message && e.message !== 'Failed to bulk add prices: 400 Bad Request') {
            errorMessage = e.message
          }
        }

        setMessage(errorMessage)
      } else {
        setMessage(e?.message || 'Không thể thêm giá')
      }

      setTimeout(() => setMessage(''), 5000) // Hiển thị lâu hơn cho lỗi quan trọng
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
          onClick={() => navigate('/admin/prices')}
          className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
        >← Quay về Giá</button>

      </div>
      {header?.description && <p className="text-gray-600 mt-1">{header.description}</p>}

      {/* Hiển thị thông tin sản phẩm đã có trong header */}
      {existingProducts.length > 0 && (
        <div className="mb-4 px-4 py-2 rounded border bg-blue-50 text-blue-800 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Đã có {existingProducts.length} sản phẩm trong bảng giá này
            </span>
            <button
              onClick={() => setShowExistingProducts(!showExistingProducts)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              {showExistingProducts ? 'Ẩn danh sách' : 'Xem danh sách'}
            </button>
          </div>
        </div>
      )}

      {/* Danh sách sản phẩm đã có trong header */}
      {showExistingProducts && existingProducts.length > 0 && (
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Sản phẩm đã có trong bảng giá</h3>
          <div className="space-y-4">
            {existingProducts.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{product.productName}</h4>
                    {product.productCode && (
                      <p className="text-xs text-gray-500">Mã: {product.productCode}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{product.totalUnits} đơn vị</span>
                </div>
                <div className="space-y-1">
                  {product.units.map((unit, unitIndex) => (
                    <div key={unitIndex} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">{unit.unitName}</span>
                      <span className="text-gray-900 font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(unit.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 px-4 py-2 rounded border ${
          message.includes('Đã thêm giá')
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message}
        </div>
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
                          setMessage('Sản phẩm chưa có mã. Vui lòng chọn sản phẩm có mã.')
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
            {/* Hiển thị tên sản phẩm đã tìm thấy */}
            {foundProductName && (
              <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm text-green-800">
                  <span className="font-medium">Sản phẩm:</span> {foundProductName}
                </div>
              </div>
            )}
          </div>
          {unitOptions.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị tính</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {unitOptions.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} {unit.isDefault ? '' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VND)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value)
                        setPriceError(false) // Reset lỗi khi người dùng thay đổi giá
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-green-500 ${
                        priceError
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="Nhập giá"
                      required
                    />
                    {priceError && (
                      <p className="mt-1 text-xs text-red-600">
                        ⚠️ Vui lòng nhập giá sản phẩm
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={loading}
                    className={`px-3 py-2 rounded-md text-white ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Đang kiểm tra...' : 'Thêm'}
                  </button>
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


