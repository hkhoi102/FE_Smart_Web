import React, { useState } from 'react'
import { PromotionDetail, PromotionLine } from './PromotionManagement'
import Modal from './Modal'

const PromotionDetailManagement: React.FC = () => {
  const [details, setDetails] = useState<PromotionDetail[]>([
    {
      id: 1,
      promotion_line_id: 1,
      discount_percent: 20,
      min_amount: 200000,
      max_discount: 100000,
      active: 1
    },
    {
      id: 2,
      promotion_line_id: 3,
      discount_amount: 50000,
      min_amount: 200000,
      max_discount: 2000000,
      active: 1
    },
    {
      id: 3,
      promotion_line_id: 2,
      condition_quantity: 3,
      free_quantity: 1,
      max_discount: 100000,
      active: 1
    }
  ])

  const [lines] = useState<PromotionLine[]>([
    {
      id: 1,
      promotion_header_id: 1,
      target_id: 1,
      target_type: 'PRODUCT',
      type: 'DISCOUNT_PERCENT',
      start_date: '2025-09-01',
      end_date: '2025-12-31',
      active: 1
    },
    {
      id: 2,
      promotion_header_id: 1,
      target_id: 2,
      target_type: 'PRODUCT',
      type: 'BUY_X_GET_Y',
      start_date: '2025-09-01',
      end_date: '2025-12-31',
      active: 1
    },
    {
      id: 3,
      promotion_header_id: 1,
      target_id: 1,
      target_type: 'PRODUCT',
      type: 'DISCOUNT_AMOUNT',
      start_date: '2025-09-01',
      end_date: '2025-12-31',
      active: 1
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<PromotionDetail | null>(null)
  const [formData, setFormData] = useState({
    promotion_line_id: 1,
    discount_percent: '',
    discount_amount: '',
    min_amount: '',
    max_discount: '',
    condition_quantity: '',
    free_quantity: '',
    active: 1
  })

  const handleAddNew = () => {
    setEditingDetail(null)
    setFormData({
      promotion_line_id: 1,
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

  const handleEdit = (detail: PromotionDetail) => {
    setEditingDetail(detail)
    setFormData({
      promotion_line_id: detail.promotion_line_id,
      discount_percent: detail.discount_percent?.toString() || '',
      discount_amount: detail.discount_amount?.toString() || '',
      min_amount: detail.min_amount?.toString() || '',
      max_discount: detail.max_discount?.toString() || '',
      condition_quantity: detail.condition_quantity?.toString() || '',
      free_quantity: detail.free_quantity?.toString() || '',
      active: detail.active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      promotion_line_id: formData.promotion_line_id,
      discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : undefined,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : undefined,
      min_amount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : undefined,
      condition_quantity: formData.condition_quantity ? parseInt(formData.condition_quantity) : undefined,
      free_quantity: formData.free_quantity ? parseInt(formData.free_quantity) : undefined,
      active: formData.active
    }
    
    if (editingDetail) {
      // Update existing detail
      setDetails(details.map(d => 
        d.id === editingDetail.id 
          ? { ...d, ...submitData }
          : d
      ))
    } else {
      // Add new detail
      const newDetail: PromotionDetail = {
        id: Math.max(...details.map(d => d.id)) + 1,
        ...submitData
      }
      setDetails([...details, newDetail])
    }
    
    setIsModalOpen(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết khuyến mãi này?')) {
      setDetails(details.filter(d => d.id !== id))
    }
  }

  const handleToggleActive = (id: number) => {
    setDetails(details.map(d => 
      d.id === id ? { ...d, active: d.active === 1 ? 0 : 1 } : d
    ))
  }

  const getStatusColor = (active: number) => {
    return active === 1 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  const getStatusLabel = (active: number) => {
    return active === 1 ? 'Kích hoạt' : 'Tạm dừng'
  }

  const getLineInfo = (lineId: number) => {
    const line = lines.find(l => l.id === lineId)
    return line ? `Line #${lineId} (${line.type})` : `Line #${lineId}`
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
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
                  <span className="text-white text-sm font-medium">⚙️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng chi tiết</dt>
                  <dd className="text-lg font-medium text-gray-900">{details.length}</dd>
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
                    {details.filter(d => d.active === 1).length}
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
                    {details.filter(d => d.discount_percent).length}
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
                    {details.filter(d => d.free_quantity).length}
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách Chi tiết Khuyến mãi</h3>
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
                      {getLineInfo(detail.promotion_line_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.discount_percent ? `${detail.discount_percent}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.discount_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.min_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(detail.max_discount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.condition_quantity || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.free_quantity || '-'}
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
                          onClick={() => handleToggleActive(detail.id)}
                          className={`${detail.active === 1 ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {detail.active === 1 ? 'Tạm dừng' : 'Kích hoạt'}
                        </button>
                        <button
                          onClick={() => handleDelete(detail.id)}
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
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Promotion Line *
            </label>
            <select
              required
              value={formData.promotion_line_id}
              onChange={(e) => setFormData({ ...formData, promotion_line_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {lines.map(line => (
                <option key={line.id} value={line.id}>
                  Line #{line.id} - {line.type}
                </option>
              ))}
            </select>
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
              <label className="block text-sm font-medium text-gray-700">
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
