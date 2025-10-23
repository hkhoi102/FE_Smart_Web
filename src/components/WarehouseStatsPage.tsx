import { useEffect, useMemo, useState } from 'react'
import { warehouseStatsService, StockSummaryItem, LowStockAlertItem } from '@/services/warehouseStatsService'

const WarehouseStatsPage = () => {
  const [stockSummary, setStockSummary] = useState<StockSummaryItem[]>([])
  const [lowStock, setLowStock] = useState<LowStockAlertItem[]>([])
  const [threshold, setThreshold] = useState<number>(5)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const totalSkus = useMemo(() => stockSummary.length, [stockSummary])
  const totalQty = useMemo(() => stockSummary.reduce((sum, i) => sum + (i.totalQuantity || 0), 0), [stockSummary])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [summary, low] = await Promise.all([
        warehouseStatsService.getStockSummary(),
        warehouseStatsService.getLowStockAlerts(threshold)
      ])
      setStockSummary(summary)
      setLowStock(low)
    } catch (e) {
      setError('Không thể tải dữ liệu thống kê kho')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Thống kê kho</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Ngưỡng cảnh báo:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={String(threshold)}
              onChange={(e) => {
                // Chỉ giữ chữ số, loại bỏ ký tự khác
                const digitsOnly = e.target.value.replace(/\D+/g, '')
                // Loại bỏ số 0 ở đầu
                const normalized = digitsOnly.replace(/^0+/, '')
                setThreshold(normalized === '' ? 0 : parseInt(normalized, 10))
              }}
              onBlur={(e) => {
                const digitsOnly = e.target.value.replace(/\D+/g, '')
                const normalized = digitsOnly.replace(/^0+/, '')
                setThreshold(normalized === '' ? 0 : parseInt(normalized, 10))
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng mã hàng</p>
          <p className="text-2xl font-bold text-gray-900">{totalSkus.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng số lượng tồn</p>
          <p className="text-2xl font-bold text-gray-900">{totalQty.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Tổng giá trị tồn kho</p>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              stockSummary.reduce((sum, item) => sum + (item.unitPrice * item.totalQuantity), 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Số SP dưới ngưỡng</p>
          <p className="text-2xl font-bold text-gray-900">{lowStock.length.toLocaleString()}</p>
        </div>
      </div>

      {/* Cảnh báo sắp hết hàng - Biểu đồ cột */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cảnh báo sắp hết hàng</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : lowStock.length === 0 ? (
            <div className="text-center text-gray-600 py-8">Không có sản phẩm nào dưới ngưỡng</div>
          ) : (
            <div className="space-y-4">
              {lowStock.map((row) => {
                const maxQuantity = Math.max(...lowStock.map(item => item.totalQuantity))
                const height = (row.totalQuantity / maxQuantity) * 200
                return (
                  <div key={row.productUnitId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {row.productName || `ID: ${row.productUnitId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.unitName || '-'} • {row.unitPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.unitPrice) : 'Chưa có giá'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${(row.totalQuantity / maxQuantity) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{(row.totalQuantity ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">tồn</p>
                        <p className="text-xs font-medium text-green-600">
                          {row.unitPrice && row.totalQuantity ?
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.unitPrice * row.totalQuantity) :
                            '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tồn kho theo sản phẩm - Biểu đồ cột */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tồn kho theo sản phẩm</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : stockSummary.length === 0 ? (
            <div className="text-center text-gray-600 py-8">Không có dữ liệu tồn kho</div>
          ) : (
            <div className="space-y-4">
              {stockSummary.map((row) => {
                const maxQuantity = Math.max(...stockSummary.map(item => item.totalQuantity))
                return (
                  <div key={row.productUnitId} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {row.productName || `ID: ${row.productUnitId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.unitName || '-'} • {row.unitPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.unitPrice) : 'Chưa có giá'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${(row.totalQuantity / maxQuantity) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{(row.totalQuantity ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">tồn</p>
                        <p className="text-xs font-medium text-green-600">
                          {row.unitPrice && row.totalQuantity ?
                            new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(row.unitPrice * row.totalQuantity) :
                            '-'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WarehouseStatsPage


