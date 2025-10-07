import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ProductService } from '@/services/productService'

type Item = { productCode: string; productName: string; unitId: number; unitName: string; price: number }

const PriceHeaderDetail = () => {
  const { headerId } = useParams<{ headerId: string }>()
  const navigate = useNavigate()
  const [header, setHeader] = useState<{ id: number; name: string; description?: string; timeStart?: string; timeEnd?: string } | null>(null)
  const [maSP, setMaSP] = useState('')
  const [unitOptions, setUnitOptions] = useState<Array<{ id: number; name: string }>>([])
  const [foundProductName, setFoundProductName] = useState<string>('')
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('')
  const [price, setPrice] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

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
      const prod = await ProductService.getProductByProductCode(code)
      if (prod && Array.isArray(prod.productUnits)) {
        setFoundProductName(prod.name || '')
        setUnitOptions(prod.productUnits.map((u: any) => ({ id: u.id, name: u.unitName })))
      } else {
        setFoundProductName('')
        setMessage('Không tìm thấy sản phẩm theo mã')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setUnitOptions([])
    }
  }

  const addItem = () => {
    if (!maSP.trim() || !selectedUnitId || !price) return
    const p = parseFloat(price)
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
        : [{ productUnitId: Number(selectedUnitId), price: Number(price), productCode: maSP.trim() }]
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
            <div className="flex gap-2">
              <input
                type="text"
                value={maSP}
                onChange={(e) => setMaSP(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="VD: SP-0001"
              />
              <button
                type="button"
                onClick={() => maSP.trim() && loadUnitsByCode(maSP.trim())}
                className="px-3 py-2 rounded-md text-white bg-gray-700 hover:bg-gray-800"
              >Tìm</button>
            </div>
            {foundProductName && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-green-200 bg-green-50 text-green-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                <span className="text-sm">Sản phẩm:</span>
                <span className="font-semibold text-base">{foundProductName}</span>

              </div>
            )}
          </div>
          {unitOptions.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị</label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {unitOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
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


