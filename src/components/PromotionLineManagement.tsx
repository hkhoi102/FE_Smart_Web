import React, { useState } from 'react'
import { PromotionLine, PromotionHeader } from './PromotionManagement'
import Modal from './Modal'

const PromotionLineManagement: React.FC = () => {
  const [lines, setLines] = useState<PromotionLine[]>([
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

  const [headers] = useState<PromotionHeader[]>([
    {
      id: 1,
      name: 'KM Thang 9',
      start_date: '2025-09-01',
      end_date: '2025-12-31',
      active: 1,
      created_at: '2025-09-08 12:46:32.333914'
    }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<PromotionLine | null>(null)
  const [formData, setFormData] = useState({
    promotion_header_id: 1,
    target_id: 1,
    target_type: 'PRODUCT' as 'PRODUCT' | 'CATEGORY',
    type: 'DISCOUNT_PERCENT' as 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BUY_X_GET_Y',
    start_date: '',
    end_date: '',
    active: 1
  })

  const handleAddNew = () => {
    setEditingLine(null)
    setFormData({
      promotion_header_id: 1,
      target_id: 1,
      target_type: 'PRODUCT',
      type: 'DISCOUNT_PERCENT',
      start_date: '',
      end_date: '',
      active: 1
    })
    setIsModalOpen(true)
  }

  const handleEdit = (line: PromotionLine) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingLine) {
      // Update existing line
      setLines(lines.map(l => 
        l.id === editingLine.id 
          ? { ...l, ...formData }
          : l
      ))
    } else {
      // Add new line
      const newLine: PromotionLine = {
        id: Math.max(...lines.map(l => l.id)) + 1,
        ...formData
      }
      setLines([...lines, newLine])
    }
    
    setIsModalOpen(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dòng khuyến mãi này?')) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  const handleToggleActive = (id: number) => {
    setLines(lines.map(l => 
      l.id === id ? { ...l, active: l.active === 1 ? 0 : 1 } : l
    ))
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

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách Dòng Khuyến mãi</h3>
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
                {lines.map((line) => (
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
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Header Khuyến mãi *
            </label>
            <select
              required
              value={formData.promotion_header_id}
              onChange={(e) => setFormData({ ...formData, promotion_header_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {headers.map(header => (
                <option key={header.id} value={header.id}>
                  {header.name}
                </option>
              ))}
            </select>
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
              <select
                required
                value={formData.target_type}
                onChange={(e) => setFormData({ ...formData, target_type: e.target.value as 'PRODUCT' | 'CATEGORY' })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="PRODUCT">Sản phẩm</option>
                <option value="CATEGORY">Danh mục</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Loại Khuyến mãi *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="DISCOUNT_PERCENT">Giảm %</option>
              <option value="DISCOUNT_AMOUNT">Giảm tiền</option>
              <option value="BUY_X_GET_Y">Mua X tặng Y</option>
            </select>
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
              {editingLine ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PromotionLineManagement
