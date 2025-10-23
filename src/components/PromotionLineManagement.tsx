import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { PromotionServiceApi, PromotionMutations } from '@/services/promotionService'

const PromotionLineManagement: React.FC = () => {
  const [lines, setLines] = useState<any[]>([])
  const [headers, setHeaders] = useState<any[]>([])
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | ''>('')
  const [filterText, setFilterText] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y'>('all')
  const [filterTargetType, setFilterTargetType] = useState<'all' | 'PRODUCT' | 'CATEGORY'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    promotion_header_id: 1,
    target_id: 1,
    target_type: 'PRODUCT' as 'PRODUCT' | 'CATEGORY',
    type: 'DISCOUNT_PERCENT' as 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y',
    start_date: '',
    end_date: '',
    active: 1
  })
  const [dateError, setDateError] = useState('')

  const validateDates = (startDate: string, endDate: string) => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        setDateError('Ngày kết thúc phải sau ngày bắt đầu')
        return false
      }
    }
    setDateError('')
    return true
  }

  const loadHeadersAndLines = async () => {
    try {
      const hs = await PromotionServiceApi.getHeaders()
      const mappedHeaders = hs.map((h: any) => ({ id: h.id, name: h.name }))
      setHeaders(mappedHeaders)
      if (mappedHeaders.length) {
        const initialHeaderId = (selectedHeaderId || mappedHeaders[0].id) as number
        setSelectedHeaderId(initialHeaderId)
        await loadLines(initialHeaderId)
      } else {
        setLines([])
      }
    } catch {
      setHeaders([])
      setLines([])
    }
  }

  useEffect(() => { loadHeadersAndLines() }, [])

  const loadLines = async (headerId: number) => {
    const ls = await PromotionServiceApi.getLinesAll(headerId)
    const mappedLines = ls.map((l: any) => ({
      id: l.id,
      promotion_header_id: l.promotionHeaderId,
      target_id: l.targetId,
      target_type: l.targetType,
      type: l.type || l.promotionType,
      start_date: l.startDate,
      end_date: l.endDate,
      active: l.active ? 1 : 0,
    }))
    setLines(mappedLines)
    setFormData(prev => ({ ...prev, promotion_header_id: headerId }))
  }

  const handleHeaderChange = async (headerId: number) => {
    setSelectedHeaderId(headerId)
    await loadLines(headerId)
  }

  const handleAddNew = () => {
    setEditingLine(null)
    setFormData({
      promotion_header_id: (selectedHeaderId || headers[0]?.id || 1) as number,
      target_id: 1,
      target_type: 'PRODUCT',
      type: 'DISCOUNT_PERCENT',
      start_date: '',
      end_date: '',
      active: 1
    })
    setIsModalOpen(true)
  }

  const handleEdit = (line: any) => {
    setEditingLine(line)
    setFormData({
      promotion_header_id: line.promotion_header_id,
      target_id: line.target_id,
      target_type: line.target_type,
      type: line.type,
      start_date: line.start_date,
      end_date: line.end_date,
      active: line.active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      targetType: formData.target_type as any,
      targetId: formData.target_id,
      startDate: formData.start_date,
      endDate: formData.end_date,
      active: formData.active === 1,
      type: formData.type as any,
    }
    if (editingLine) {
      await PromotionMutations.updateLine(editingLine.id, payload)
    } else {
      await PromotionMutations.createLine(formData.promotion_header_id, payload)
    }
    if (selectedHeaderId) {
      await loadLines(selectedHeaderId as number)
    } else {
      await loadHeadersAndLines()
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dòng khuyến mãi này?')) return
    await PromotionMutations.deleteLine(id)
    if (selectedHeaderId) {
      await loadLines(selectedHeaderId as number)
    } else {
      await loadHeadersAndLines()
    }
  }

  const handleToggleActive = async (id: number) => {
    const current = lines.find(l => l.id === id)
    if (!current) return
    await PromotionMutations.updateLine(id, { active: !(current.active === 1) })
    if (selectedHeaderId) {
      await loadLines(selectedHeaderId as number)
    } else {
      await loadHeadersAndLines()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getStatusColor = (active: number) => {
    return active === 1
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getStatusLabel = (active: number) => {
    return active === 1 ? 'Kích hoạt' : 'Tạm dừng'
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DISCOUNT_PERCENT': return 'Giảm %'
      case 'DISCOUNT_AMOUNT': return 'Giảm tiền'
      case 'BUY_X_GET_Y': return 'Mua X tặng Y'
      default: return type
    }
  }

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'PRODUCT': return 'Sản phẩm'
      case 'CATEGORY': return 'Danh mục'
      default: return targetType
    }
  }

  const getHeaderName = (headerId: number) => {
    const header = headers.find(h => h.id === headerId)
    return header ? header.name : `Header #${headerId}`
  }

  const filteredLines = lines.filter(l => {
    const matchText = filterText.trim()
      ? (`${l.target_id}`.includes(filterText) || `${l.id}`.includes(filterText))
      : true
    const matchType = filterType === 'all' ? true : l.type === filterType
    const matchTargetType = filterTargetType === 'all' ? true : l.target_type === filterTargetType
    const matchStatus = filterStatus === 'all' ? true : (filterStatus === 'active' ? l.active === 1 : l.active === 0)
    const matchStart = filterStart ? new Date(l.start_date) >= new Date(filterStart) : true
    const matchEnd = filterEnd ? new Date(l.end_date) <= new Date(filterEnd) : true
    return matchText && matchType && matchTargetType && matchStatus && matchStart && matchEnd
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📝</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng dòng</dt>
                  <dd className="text-lg font-medium text-gray-900">{lines.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đang hoạt động</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lines.filter(l => l.active === 1).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Giảm %</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lines.filter(l => l.type === 'DISCOUNT_PERCENT').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">🎁</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mua tặng</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lines.filter(l => l.type === 'BUY_X_GET_Y').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="ID line hoặc target..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại KM</label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="DISCOUNT_PERCENT">Giảm %</option>
                  <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                  <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại Target</label>
              <div className="relative">
                <select
                  value={filterTargetType}
                  onChange={(e) => setFilterTargetType(e.target.value as any)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="CATEGORY">Danh mục</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Kích hoạt</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg leading-6 font-semibold text-gray-900">Danh sách Dòng Khuyến mãi</h3>
              <div className="relative">
                <select
                  value={selectedHeaderId || ''}
                  onChange={(e) => handleHeaderChange(parseInt(e.target.value))}
                  className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {headers.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-2">+</span>
              Thêm dòng mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Header
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại KM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày kết thúc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLines.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {line.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getHeaderName(line.promotion_header_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {line.target_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTargetTypeLabel(line.target_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(line.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(line.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(line.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(line.active)}`}>
                        {getStatusLabel(line.active)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleActive(line.id)}
                          className={`${line.active === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {line.active === 1 ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDelete(line.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLine ? 'Sửa Dòng Khuyến mãi' : 'Thêm Dòng Khuyến mãi mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Header Khuyến mãi *
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.promotion_header_id}
                onChange={(e) => setFormData({ ...formData, promotion_header_id: parseInt(e.target.value) })}
                className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {headers.map(header => (
                  <option key={header.id} value={header.id}>
                    {header.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target ID *
              </label>
              <input
                type="number"
                required
                value={formData.target_id}
                onChange={(e) => setFormData({ ...formData, target_id: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ID sản phẩm/danh mục"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Loại Target *
              </label>
              <div className="relative mt-1">
                <select
                  required
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as 'PRODUCT' | 'CATEGORY' })}
                  className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PRODUCT">Sản phẩm</option>
                  <option value="CATEGORY">Danh mục</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Loại Khuyến mãi *
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="DISCOUNT_PERCENT">Giảm %</option>
                <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                <option value="BUY_X_GET_Y">Mua X tặng Y</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày bắt đầu *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  setFormData({ ...formData, start_date: newStartDate })
                  // Kiểm tra validation khi cả 2 ngày đã được chọn
                  if (newStartDate && formData.end_date) {
                    validateDates(newStartDate, formData.end_date)
                  }
                }}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${dateError ? 'border-red-500' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ngày kết thúc *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => {
                  const newEndDate = e.target.value
                  setFormData({ ...formData, end_date: newEndDate })
                  // Kiểm tra validation khi cả 2 ngày đã được chọn
                  if (formData.start_date && newEndDate) {
                    validateDates(formData.start_date, newEndDate)
                  }
                }}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${dateError ? 'border-red-500' : ''}`}
              />
              {dateError && (
                <p className="mt-1 text-sm text-red-600">{dateError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <select
              value={formData.active}
              onChange={(e) => setFormData({ ...formData, active: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={1}>Kích hoạt</option>
              <option value={0}>Tạm dừng</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!!dateError}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                dateError
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingLine ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PromotionLineManagement
