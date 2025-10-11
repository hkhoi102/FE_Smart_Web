import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { PromotionServiceApi, PromotionMutations } from '@/services/promotionService'
import { ProductService } from '@/services/productService'

const PromotionHeaderManagement: React.FC = () => {
  const navigate = useNavigate()
  const [headers, setHeaders] = useState<any[]>([])
  const [filterText, setFilterText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  // const [editingHeader, setEditingHeader] = useState<any | null>(null)
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

  // Ẩn chức năng thêm header mới theo yêu cầu

  const [inlineEditOpen, setInlineEditOpen] = useState(false)
  const [inlineHeader, setInlineHeader] = useState<any | null>(null)

  const handleEdit = async (header: any) => {
    // Mở modal chỉnh sửa Heder + Lines + Details trong một nơi
    setInlineHeader(header)
    setInlineEditOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: formData.name,
      startDate: formData.start_date,
      endDate: formData.end_date,
      active: formData.active === 1,
    }
    // Form thêm/sửa header đã ẩn; giữ nguyên để tương thích nếu tái dùng
    await PromotionMutations.createHeader(payload)
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

  const [lineEditOpen, setLineEditOpen] = useState(false)
  const [lineEditing, setLineEditing] = useState<any | null>(null)
  const [lineDetails, setLineDetails] = useState<any[]>([])
  const openLineEditor = async (line: any) => {
    setLineEditing(line)
    try {
      const ds = await PromotionServiceApi.getDetailsAll(line.id)
      setLineDetails(Array.isArray(ds) ? ds : [])
    } catch { setLineDetails([]) }
    setLineEditOpen(true)
  }

  const handlePromotionNameClick = (header: any) => {
    navigate(`/admin/promotion/${header.id}`)
  }

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
                      <button
                        onClick={() => handlePromotionNameClick(header)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {header.name}
                      </button>
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
                        {/* <button
                          onClick={() => handleDelete(header.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Xóa
                        </button> */}
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
        title={'Thêm Header Khuyến mãi mới'}
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
              Thêm mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Inline Edit All-in-one (Header + Lines + Details) */}
      {inlineEditOpen && (
        <InlinePromotionEditor
          header={inlineHeader}
          onClose={async (changed) => {
            setInlineEditOpen(false)
            setInlineHeader(null)
            if (changed) await loadHeaders()
          }}
        />
      )}

      {/* View Detail Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={viewHeader ? `Chi tiết: ${viewHeader.name}` : 'Chi tiết khuyến mãi'}
        size="full"
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
                  {viewLines.map((ln, idx) => (
                  <div key={ln.id} className="border rounded-md">
                    <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">
                        Khuyến mãi {idx + 1} • {viType(ln.type)} • {viTarget(ln.target_type)} #{ln.target_id}
                        {ln.start_date || ln.end_date ? (
                          <span className="ml-2 text-xs text-gray-600">(
                            {ln.start_date ? formatDate(ln.start_date) : '-'}
                            {' '}–{' '}
                            {ln.end_date ? formatDate(ln.end_date) : '-'}
                          )</span>
                        ) : null}
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

export default PromotionHeaderManagement

// Editor component to update header + lines + details together
const InlinePromotionEditor: React.FC<{ header: any; onClose: (changed: boolean) => void }> = ({ header, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hdr, setHdr] = useState<any>({ id: header.id, name: header.name, startDate: header.start_date, endDate: header.end_date, active: header.active === 1 })
  const [lines, setLines] = useState<any[]>([])
  const [productOptions, setProductOptions] = useState<Array<{ id: number; name: string }>>([])
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: number; name: string }>>([])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const lns = await PromotionServiceApi.getLinesAll(header.id)
        if (cancelled) return
        setLines(lns)
        if (!cancelled) setLines(lns)
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [header?.id])

  // Load selectable targets (products/categories)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const prods = await ProductService.getProducts(1, 1000)
        if (!cancelled) setProductOptions(prods.products.map((p: any) => ({ id: p.id, name: p.name })))
      } catch { if (!cancelled) setProductOptions([]) }
      try {
        const cats = await ProductService.getCategories()
        if (!cancelled) setCategoryOptions(cats.map((c: any) => ({ id: c.id, name: c.name })))
      } catch { if (!cancelled) setCategoryOptions([]) }
    })()
    return () => { cancelled = true }
  }, [])

  const addLine = () => setLines(prev => [...prev, { id: 0, promotionHeaderId: header.id, targetType: 'PRODUCT', targetId: 0, type: 'DISCOUNT_PERCENT', active: true }])

  // Detail editing removed in large modal

  const saveAll = async () => {
    setSaving(true)
    try {
      await PromotionMutations.updateHeader(hdr.id, { name: hdr.name, startDate: hdr.startDate, endDate: hdr.endDate, active: !!hdr.active })
      // Upsert lines
      for (const ln of lines) {
        if (ln.id && ln.id !== 0) {
          await PromotionMutations.updateLine(ln.id, { targetType: ln.targetType, targetId: Number(ln.targetId), startDate: ln.startDate, endDate: ln.endDate, active: !!ln.active, type: ln.type })
        } else {
          const created = await PromotionMutations.createLine(header.id, { targetType: ln.targetType, targetId: Number(ln.targetId), startDate: ln.startDate, endDate: ln.endDate, active: !!ln.active, type: ln.type })
          ln.id = created.id
        }
        // Details are managed in line-level editor, skip here
      }
      onClose(true)
    } catch { onClose(false) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] p-6 max-h-[100vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sửa khuyến mãi</h3>
          <button onClick={() => onClose(false)} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>
        {loading ? (
          <div className="text-sm text-gray-500">Đang tải...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border p-4">
              <div className="font-medium mb-3">Header</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="px-3 py-2 border rounded" value={hdr.name} onChange={e=>setHdr({...hdr, name:e.target.value})} />
                <input type="date" className="px-3 py-2 border rounded" value={hdr.startDate || ''} onChange={e=>setHdr({...hdr, startDate:e.target.value})} />
                <input type="date" className="px-3 py-2 border rounded" value={hdr.endDate || ''} onChange={e=>setHdr({...hdr, endDate:e.target.value})} />
              </div>
            </div>
            <div className="rounded border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Dòng khuyến mãi</div>
                <button className="px-3 py-1 rounded text-white bg-blue-600 hover:bg-blue-700" onClick={addLine}>+ Thêm dòng</button>
              </div>
              <div className="space-y-3">
                {lines.map((ln, idx) => (
                  <div key={idx} className="border rounded p-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <select className="px-2 py-2 border rounded" value={ln.targetType} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetType:e.target.value}:l))}>
                        <option value="PRODUCT">Sản phẩm</option>
                        <option value="CATEGORY">Danh mục</option>

                      </select>
                      {ln.targetType === 'PRODUCT' && (
                        <div className="relative">
                          <input
                            className="px-2 py-2 border rounded w-full"
                            placeholder="Tìm sản phẩm..."
                            value={ln.targetNameQuery || ''}
                            onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetNameQuery:e.target.value, showSuggest:true}:l))}
                          />
                          {((ln.targetNameQuery || '').trim().length > 0) && ln.showSuggest && (
                            <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-auto">
                              {productOptions.filter(p=>p.name.toLowerCase().includes(String(ln.targetNameQuery).toLowerCase())).slice(0,8).map(p=> (
                                <div key={p.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={()=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetId:p.id, targetNameQuery:p.name, showSuggest:false}:l))}>{p.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {ln.targetType === 'CATEGORY' && (
                        <div className="relative">
                          <input className="px-2 py-2 border rounded w-full" placeholder="Tìm danh mục..." value={ln.targetNameQuery || ''} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetNameQuery:e.target.value, showSuggest:true}:l))} />
                          {((ln.targetNameQuery || '').trim().length > 0) && ln.showSuggest && (
                            <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-auto">
                              {categoryOptions.filter(c=>c.name.toLowerCase().includes(String(ln.targetNameQuery).toLowerCase())).slice(0,8).map(c=> (
                                <div key={c.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onMouseDown={()=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetId:c.id, targetNameQuery:c.name, showSuggest:false}:l))}>{c.name}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {ln.targetType === 'CUSTOMER' && (
                        <input className="px-2 py-2 border rounded" type="number" value={ln.targetId || 0} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, targetId:Number(e.target.value)}:l))} />
                      )}
                      <select className="px-2 py-2 border rounded" value={ln.type || 'DISCOUNT_PERCENT'} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, type:e.target.value}:l))}>
                        <option value="DISCOUNT_PERCENT">Giảm theo %</option>
                        <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
                        <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input type="date" className="px-2 py-2 border rounded" value={ln.startDate || ''} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, startDate:e.target.value}:l))} />
                        <input type="date" className="px-2 py-2 border rounded" value={ln.endDate || ''} onChange={(e)=>setLines(prev=>prev.map((l,i)=> i===idx?{...l, endDate:e.target.value}:l))} />
                      </div>
                    </div>
                    {/* Detail editing removed in this modal */}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-gray-600">Trạng thái:</span>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded ${ln.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                        onClick={async () => {
                          try {
                            if (ln.id) { await PromotionServiceApi.activateLine(ln.id) }
                            setLines(prev => prev.map((l,i)=> i===idx?{...l, active: true}:l))
                          } catch {}
                        }}
                      >Kích hoạt</button>
                      <button
                        type="button"
                        className={`px-2 py-1 text-xs rounded ${!ln.active ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                        onClick={async () => {
                          try {
                            if (ln.id) { await PromotionServiceApi.deactivateLine(ln.id) }
                            setLines(prev => prev.map((l,i)=> i===idx?{...l, active: false}:l))
                          } catch {}
                        }}
                      >Tạm ngưng</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={()=>onClose(false)}>Hủy</button>
              <button disabled={saving} className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50" onClick={saveAll}>Lưu</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal: Edit details for a single line
const LineDetailEditor: React.FC<{ line: any; details: any[]; onChange: (arr: any[]) => void; onClose: () => void }> = ({ line, details, onChange, onClose }) => {
  const [saving, setSaving] = useState(false)
  const [giftNameByUnitId, setGiftNameByUnitId] = useState<Record<number, string>>({})
  const [giftUnitOptions, setGiftUnitOptions] = useState<Array<{ id: number; label: string }>>([])

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

  const addDetail = () => onChange([...(details || []), { id: 0, promotionLineId: line.id, discountPercent: '', discountAmount: '', minAmount: '', maxDiscount: '', conditionQuantity: '', freeQuantity: '', giftProductUnitId: '', active: true }])
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

  // Load selectable gift product units
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
      } catch {
        setGiftUnitOptions([])
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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Sửa chi tiết khuyến mãi</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✖</button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg text-gray-800 font-medium">{viType(line?.type)} • {viTarget(line?.targetType)} #{line?.targetId}</div>
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
                    <div className="col-span-12 md:col-span-4">
                      <div className="text-sm text-gray-700 mb-1">Đơn tối thiểu</div>
                      <input placeholder="Nhập giá trị tối thiểu" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.minAmount || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, minAmount:e.target.value}:x))} />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div className="text-sm text-gray-700 mb-1">Giảm tối đa</div>
                      <input placeholder="Nhập mức giảm tối đa" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.maxDiscount || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, maxDiscount:e.target.value}:x))} />
                    </div>
                  </>
                )}
                {t === 'BUY_X_GET_Y' && (
                  <>
                    <div className="col-span-12 md:col-span-3">
                      <div className="text-sm text-gray-700 mb-1">Số lượng mua (X)</div>
                      <input placeholder="SL X" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.conditionQuantity || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, conditionQuantity:e.target.value}:x))} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <div className="text-sm text-gray-700 mb-1">Số lượng tặng (Y)</div>
                      <input placeholder="SL Y" className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={d.freeQuantity || ''} onChange={(e)=>onChange(details.map((x,i)=> i===idx?{...x, freeQuantity:e.target.value}:x))} />
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
                      {/* no extra name display below */}
                    </div>
                    <div className="col-span-12 md:col-span-2 flex items-end">
                      <button className="ml-auto px-3 py-2 text-xs text-red-600 hover:text-red-700" onClick={()=>removeDetail(idx)}>Xóa</button>
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
