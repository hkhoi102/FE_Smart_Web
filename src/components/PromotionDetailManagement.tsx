import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { PromotionServiceApi, PromotionDetailDto } from '@/services/promotionService'

const PromotionDetailManagement: React.FC = () => {
  const [details, setDetails] = useState<PromotionDetailDto[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [headers, setHeaders] = useState<any[]>([])
  const [selectedHeaderId, setSelectedHeaderId] = useState<number | ''>('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<PromotionDetailDto | null>(null)
  const [formData, setFormData] = useState({
    promotion_line_id: 0,
    discount_percent: '',
    discount_amount: '',
    min_amount: '',
    max_discount: '',
    condition_quantity: '',
    free_quantity: '',
    active: 1
  })

  const mapLine = (l: any) => ({ id: l.id, type: l.type || l.promotionType, targetType: l.targetType })
  const mapDetailToDto = (d: any): PromotionDetailDto => ({
    id: d.id,
    promotionLineId: d.promotionLineId,
    discountPercent: d.discountPercent,
    discountAmount: d.discountAmount,
    minAmount: d.minAmount,
    maxDiscount: d.maxDiscount,
    conditionQuantity: d.conditionQuantity,
    freeQuantity: d.freeQuantity,
    active: Boolean(d.active),
  })

  const loadHeaders = async () => {
    const hs = await PromotionServiceApi.getHeaders()
    setHeaders(hs)
    if (hs.length) {
      setSelectedHeaderId(hs[0].id)
      const ls = await PromotionServiceApi.getLinesAll(hs[0].id)
      const mappedLines = ls.map(mapLine)
      setLines(mappedLines)
      if (mappedLines.length) {
        setFormData(prev => ({ ...prev, promotion_line_id: mappedLines[0].id }))
        const ds = await PromotionServiceApi.getDetailsAll(mappedLines[0].id)
        setDetails(ds.map(mapDetailToDto))
      }
    }
  }

  useEffect(() => { loadHeaders() }, [])

  const handleHeaderChange = async (headerId: number) => {
    setSelectedHeaderId(headerId)
    const ls = await PromotionServiceApi.getLinesAll(headerId)
    const mappedLines = ls.map(mapLine)
    setLines(mappedLines)
    if (mappedLines.length) {
      setFormData(prev => ({ ...prev, promotion_line_id: mappedLines[0].id }))
      const ds = await PromotionServiceApi.getDetailsAll(mappedLines[0].id)
      setDetails(ds.map(mapDetailToDto))
    } else {
      setDetails([])
    }
  }

  const handleLineChange = async (lineId: number) => {
    setFormData(prev => ({ ...prev, promotion_line_id: lineId }))
    const ds = await PromotionServiceApi.getDetailsAll(lineId)
    setDetails(ds.map(mapDetailToDto))
  }

  const handleAddNew = () => {
    setEditingDetail(null)
    setFormData({
      promotion_line_id: lines[0]?.id || 0,
      discount_percent: '',
      discount_amount: '',
      min_amount: '',
      max_discount: '',
      condition_quantity: '',
      free_quantity: '',
      active: 1
    })
    setIsModalOpen(true)
  }

  const handleEdit = (detail: PromotionDetailDto) => {
    setEditingDetail(detail)
    setFormData({
      promotion_line_id: detail.promotionLineId,
      discount_percent: detail.discountPercent?.toString() || '',
      discount_amount: detail.discountAmount?.toString() || '',
      min_amount: detail.minAmount?.toString() || '',
      max_discount: detail.maxDiscount?.toString() || '',
      condition_quantity: detail.conditionQuantity?.toString() || '',
      free_quantity: detail.freeQuantity?.toString() || '',
      active: detail.active ? 1 : 0,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const submitData: any = {
      promotionLineId: formData.promotion_line_id,
      discountPercent: formData.discount_percent ? parseFloat(formData.discount_percent) : undefined,
      discountAmount: formData.discount_amount ? parseFloat(formData.discount_amount) : undefined,
      minAmount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
      maxDiscount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
      conditionQuantity: formData.condition_quantity ? parseInt(formData.condition_quantity) : undefined,
      freeQuantity: formData.free_quantity ? parseInt(formData.free_quantity) : undefined,
      active: formData.active === 1
    }

    await PromotionServiceApi.createDetail(submitData)
    const ds = await PromotionServiceApi.getDetailsAll(formData.promotion_line_id)
    setDetails(ds.map(mapDetailToDto))

    setIsModalOpen(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết khuyến mãi này?')) {
      setDetails(details.filter(d => d.id !== id))
    }
  }

  const handleToggleActive = (id: number) => {
    setDetails(details.map(d =>
      d.id === id ? { ...d, active: !d.active } : d
    ))
  }

  const getStatusColor = (active: boolean) => {
    return active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusLabel = (active: boolean) => {
    return active ? 'Kích hoạt' : 'Tạm dừng'
  }

  const getLineInfo = (lineId: number) => {
    const line = lines.find(l => l.id === lineId)
    return line ? `Line #${lineId} (${line.type})` : `Line #${lineId}`
  }

  const formatCurrency = (amount?: number) => {
    if (!amount && amount !== 0) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg text-sm">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">⚙️</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Tổng chi tiết</dt>
                  <dd className="text-base font-medium text-gray-900">{details.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg text-sm">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-xs font-medium">✅</span>
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-gray-500 truncate">Đang hoạt động</dt>
                  <dd className="text-base font-medium text-gray-900">
                    {details.filter(d => d.active).length}
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
                    {details.filter(d => typeof d.discountPercent === 'number').length}
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
                    {details.filter(d => d.freeQuantity).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách Chi tiết Khuyến mãi</h3>
              <div className="relative">
                <select
                  value={selectedHeaderId || ''}
                  onChange={(e) => handleHeaderChange(Number(e.target.value))}
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
              <div className="relative">
                <select
                  value={formData.promotion_line_id || 0}
                  onChange={(e) => handleLineChange(Number(e.target.value))}
                  className="appearance-none pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {lines.map(l => (
                    <option key={l.id} value={l.id}>Line #{l.id} - {l.targetType}</option>
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
              Thêm chi tiết mới
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
                    Promotion Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền tối thiểu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm tối đa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng điều kiện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng tặng
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
                {details.map((detail) => (
                  <tr key={detail.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {detail.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getLineInfo(detail.promotionLineId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof detail.discountPercent === 'number' ? `${detail.discountPercent}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.discountAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.minAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.maxDiscount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.conditionQuantity || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.freeQuantity || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detail.active)}`}>
                        {getStatusLabel(detail.active)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(detail)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleActive(Number(detail.id))}
                          className={`${detail.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {detail.active ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDelete(Number(detail.id))}
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
        title={editingDetail ? 'Sửa Chi tiết Khuyến mãi' : 'Thêm Chi tiết Khuyến mãi mới'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Promotion Line *
            </label>
            <div className="relative mt-1">
              <select
                required
                value={formData.promotion_line_id}
                onChange={(e) => setFormData({ ...formData, promotion_line_id: Number(e.target.value) })}
                className="appearance-none w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {lines.map(line => (
                  <option key={line.id} value={line.id}>
                    Line #{line.id} - {line.type}
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
                Giảm % (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giảm tiền (VNĐ)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 50000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text sm font-medium text-gray-700">
                Số tiền tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={formData.min_amount}
                onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 200000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Giảm tối đa (VNĐ)
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={formData.max_discount}
                onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 100000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng điều kiện
              </label>
              <input
                type="number"
                min="1"
                value={formData.condition_quantity}
                onChange={(e) => setFormData({ ...formData, condition_quantity: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng tặng
              </label>
              <input
                type="number"
                min="1"
                value={formData.free_quantity}
                onChange={(e) => setFormData({ ...formData, free_quantity: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Ví dụ: 1"
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
                onChange={(e) => setFormData({ ...formData, active: Number(e.target.value) })}
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
              {editingDetail ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PromotionDetailManagement
