import { useState, useEffect } from 'react'
import { revenueService, RevenueData, RevenueSummary } from '@/services/revenueService'

const RevenuePage = () => {
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  // Khởi tạo ngày mặc định (30 ngày gần nhất)
  useEffect(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    setEndDate(today.toISOString().split('T')[0])
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0])
  }, [])

  // Load dữ liệu khi component mount hoặc thay đổi tham số
  useEffect(() => {
    loadRevenueData()
  }, [startDate, endDate, groupBy])

  const loadRevenueData = async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      // Load tổng doanh thu
      const summary = await revenueService.getRevenueSummary()
      setRevenueSummary(summary)

      // Load dữ liệu thống kê theo groupBy
      let data: RevenueData[] = []
      switch (groupBy) {
        case 'day':
          data = await revenueService.getRevenueByDay(startDate, endDate)
          break
        case 'week':
          data = await revenueService.getRevenueByWeek(startDate, endDate)
          break
        case 'month':
          data = await revenueService.getRevenueByMonth(startDate, endDate)
          break
        case 'year':
          data = await revenueService.getRevenueByYear(startDate, endDate)
          break
      }
      setRevenueData(data)
    } catch (err) {
      setError('Không thể tải dữ liệu thống kê')
      console.error('Error loading revenue data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    switch (groupBy) {
      case 'day':
        return date.toLocaleDateString('vi-VN')
      case 'week':
        // Tính tuần trong tháng
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const pastDaysOfMonth = (date.getTime() - firstDayOfMonth.getTime()) / 86400000
        const weekNumber = Math.ceil((pastDaysOfMonth + firstDayOfMonth.getDay() + 1) / 7)
        const month = date.toLocaleDateString('vi-VN', { month: 'long' })
        return `Tuần ${weekNumber} - ${month} - ${date.getFullYear()}`
      case 'month':
        return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
      case 'year':
        return date.getFullYear().toString()
      default:
        return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Thống kê doanh thu</h1>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Nhóm theo:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month' | 'year')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tổng doanh thu */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueSummary.totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{revenueSummary.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Giá trị đơn hàng TB</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(revenueSummary.averageOrderValue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biểu đồ và bảng thống kê */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Biểu đồ doanh thu theo {groupBy === 'day' ? 'ngày' : groupBy === 'week' ? 'tuần' : groupBy === 'month' ? 'tháng' : 'năm'}
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              <p>{error}</p>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Không có dữ liệu trong khoảng thời gian đã chọn</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Biểu đồ đơn giản */}
              <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-end justify-between">
                {revenueData.map((item, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
                  const height = (item.revenue / maxRevenue) * 200
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-green-500 rounded-t w-8 mb-2"
                        style={{ height: `${height}px` }}
                        title={`${formatDate(item.date)}: ${formatCurrency(item.revenue)}`}
                      ></div>
                      <span className="text-xs text-gray-600 transform -rotate-45 origin-left">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Bảng dữ liệu */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {groupBy === 'day' ? 'Ngày' : groupBy === 'week' ? 'Tuần' : groupBy === 'month' ? 'Tháng' : 'Năm'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RevenuePage
