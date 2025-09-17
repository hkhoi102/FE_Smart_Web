import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { PromotionServiceApi, PromotionMutations } from '@/services/promotionService'

const PromotionHeaderManagement: React.FC = () => {
  const [headers, setHeaders] = useState<any[]>([])
  const [filterText, setFilterText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHeader, setEditingHeader] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    active: 1
  })

  const loadHeaders = async () => {
    try {
      const data = await PromotionServiceApi.getHeaders()
      // Map BE to UI model
      const mapped = data.map((h: any) => ({
        id: h.id,
        name: h.name,
        start_date: h.startDate,
        end_date: h.endDate,
        active: h.active ? 1 : 0,
        created_at: h.createdAt || h.created_at || new Date().toISOString(),
      }))
      setHeaders(mapped)
    } catch {
      setHeaders([])
    }
  }

  useEffect(() => { loadHeaders() }, [])

  const handleAddNew = () => {
    setEditingHeader(null)
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      active: 1
    })
    setIsModalOpen(true)
  }

  const handleEdit = (header: any) => {
    setEditingHeader(header)
    setFormData({
      name: header.name,
      start_date: header.start_date,
      end_date: header.end_date,
      active: header.active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      startDate: formData.start_date,
      endDate: formData.end_date,
      active: formData.active === 1,
    }
    if (editingHeader) {
      await PromotionMutations.updateHeader(editingHeader.id, payload)
    } else {
      await PromotionMutations.createHeader(payload)
    }
    await loadHeaders()
    setIsModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa header khuyến mãi này?')) return
    await PromotionMutations.deleteHeader(id)
    await loadHeaders()
  }

  const handleToggleActive = async (id: number) => {
    const current = headers.find(h => h.id === id)
    if (!current) return
    await PromotionMutations.updateHeader(id, { active: !(current.active === 1) })
    await loadHeaders()
  }

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewHeader, setViewHeader] = useState<any | null>(null)
  const [viewLines, setViewLines] = useState<any[]>([])
  const [viewDetailsByLine, setViewDetailsByLine] = useState<Record<number, any[]>>({})
  const [viewLoading, setViewLoading] = useState(false)

  const handleView = async (id: number) => {
    try {
      setViewLoading(true)
      setViewModalOpen(true)
      const h = await PromotionServiceApi.getHeaderById(id)
      setViewHeader({
        id: h.id,
        name: h.name,
        start_date: (h as any).startDate || '',
        end_date: (h as any).endDate || '',
        active: h.active ? 1 : 0,
      })
      const lines = await PromotionServiceApi.getLinesAll(id)
      const mappedLines = lines.map((l: any) => ({
        id: l.id,
        promotion_header_id: l.promotionHeaderId,
        target_id: l.targetId,
        target_type: l.targetType,
        type: l.type || l.promotionType,
        start_date: l.startDate,
        end_date: l.endDate,
        active: l.active ? 1 : 0,
      }))
      setViewLines(mappedLines)
      const detailsEntries = await Promise.all(mappedLines.map(async (ln: any) => {
        try {
          const ds = await PromotionServiceApi.getDetailsAll(ln.id)
          const mapped = (Array.isArray(ds) ? ds : []).map((d: any) => ({
            id: d.id,
            discount_percent: d.discountPercent,
            discount_amount: d.discountAmount,
            min_amount: d.minAmount,
            max_discount: d.maxDiscount,
            condition_quantity: d.conditionQuantity,
            free_quantity: d.freeQuantity,
            active: d.active ? 1 : 0,
          }))
          return [ln.id, mapped] as [number, any[]]
        } catch {
          return [ln.id, []] as [number, any[]]
        }
      }))
      const asRecord: Record<number, any[]> = {}
      detailsEntries.forEach(([lineId, arr]) => { asRecord[lineId] = arr })
      setViewDetailsByLine(asRecord)
    } catch (e) {
      // noop
    } finally {
      setViewLoading(false)
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

  const filteredHeaders = headers.filter(h => {
    const matchText = filterText.trim()
      ? (h.name?.toLowerCase().includes(filterText.toLowerCase()))
      : true
    const matchStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'active' ? h.active === 1 : h.active === 0
    const matchStart = filterStart ? new Date(h.start_date) >= new Date(filterStart) : true
    const matchEnd = filterEnd ? new Date(h.end_date) <= new Date(filterEnd) : true
    return matchText && matchStatus && matchStart && matchEnd
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
                  <span className="text-white text-sm font-medium">📋</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng Header</dt>
                  <dd className="text-lg font-medium text-gray-900">{headers.length}</dd>
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
                    {headers.filter(h => h.active === 1).length}
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
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⏸️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tạm dừng</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {headers.filter(h => h.active === 0).length}
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
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">📅</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sắp hết hạn</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {headers.filter(h => {
                      const endDate = new Date(h.end_date)
                      const today = new Date()
                      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
                      return diffDays <= 7 && diffDays > 0
                    }).length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Nhập tên khuyến mãi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
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
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách Header Khuyến mãi</h3>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="mr-2">+</span>
              Thêm Header mới
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
                    Tên khuyến mãi
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
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHeaders.map((header) => (
                  <tr key={header.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {header.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {header.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(header.start_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(header.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(header.active)}`}>
                        {getStatusLabel(header.active)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(header.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(header.id)}
                          className="text-gray-700 hover:text-gray-900"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => handleEdit(header)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleActive(header.id)}
                          className={`${header.active === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {header.active === 1 ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDelete(header.id)}
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
        title={editingHeader ? 'Sửa Header Khuyến mãi' : 'Thêm Header Khuyến mãi mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên khuyến mãi *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Nhập tên khuyến mãi"
            />
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
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Trạng thái
            </label>
            <div className="relative mt-1">
              <select
                value={formData.active}
                onChange={(e) => setFormData({ ...formData, active: parseInt(e.target.value) })}
                className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value={1}>Kích hoạt</option>
                <option value={0}>Tạm dừng</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingHeader ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={viewHeader ? `Chi tiết: ${viewHeader.name}` : 'Chi tiết khuyến mãi'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">ID</div>
              <div className="text-sm font-medium text-gray-900">{viewHeader?.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewHeader?.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {viewHeader?.active === 1 ? 'Kích hoạt' : 'Tạm dừng'}
                </span>
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Tên</div>
              <div className="text-sm font-medium text-gray-900">{viewHeader?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày bắt đầu</div>
              <div className="text-sm font-medium text-gray-900">{viewHeader?.start_date ? new Date(viewHeader.start_date).toLocaleDateString('vi-VN') : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Ngày kết thúc</div>
              <div className="text-sm font-medium text-gray-900">{viewHeader?.end_date ? new Date(viewHeader.end_date).toLocaleDateString('vi-VN') : '-'}</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-sm font-semibold text-gray-900 mb-2">Các dòng khuyến mãi</div>
            {viewLoading ? (
              <div className="text-sm text-gray-500">Đang tải...</div>
            ) : (
              <div className="space-y-4">
                {viewLines.map((ln) => (
                  <div key={ln.id} className="border rounded-md">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        Line #{ln.id} • {ln.type} • {ln.target_type} #{ln.target_id}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ln.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {ln.active === 1 ? 'Kích hoạt' : 'Tạm dừng'}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-xs text-gray-500 mb-2">Chi tiết</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Giảm %</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Giảm tiền</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Tối thiểu</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Giảm tối đa</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SL điều kiện</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">SL tặng</th>
                              <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(viewDetailsByLine[ln.id] || []).map((d) => (
                              <tr key={d.id}>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.discount_percent ?? '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.discount_amount?.toLocaleString('vi-VN') ?? '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.min_amount?.toLocaleString('vi-VN') ?? '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.max_discount?.toLocaleString('vi-VN') ?? '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.condition_quantity ?? '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-700">{d.free_quantity ?? '-'}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${d.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {d.active === 1 ? 'Kích hoạt' : 'Tạm dừng'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!viewDetailsByLine[ln.id] || viewDetailsByLine[ln.id].length === 0) && (
                              <tr>
                                <td className="px-3 py-2 text-sm text-gray-500" colSpan={7}>Chưa có chi tiết</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
                {viewLines.length === 0 && (
                  <div className="text-sm text-gray-500">Chưa có dòng khuyến mãi</div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setViewModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-gray-800 text-white hover:bg-gray-900"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PromotionHeaderManagement
