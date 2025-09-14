import React, { useState } from 'react'
import { OrderDetail } from './OrderManagement'
import Modal from './Modal'

const OrderDetailManagement: React.FC = () => {
  const [details, setDetails] = useState<OrderDetail[]>([
    { id: 6, order_id: 2, product_unit_id: 3, quantity: 0, subtotal: 0, unit_price: 15000 },
    { id: 7, order_id: 3, product_unit_id: 4, quantity: 2, subtotal: 0, unit_price: 0 },
    { id: 8, order_id: 4, product_unit_id: 1, quantity: 1, subtotal: 100000, unit_price: 100000 },
    { id: 9, order_id: 5, product_unit_id: 2, quantity: 4, subtotal: 300000, unit_price: 200000 },
    { id: 10, order_id: 6, product_unit_id: 3, quantity: 2, subtotal: 400000, unit_price: 300000 },
    { id: 11, order_id: 7, product_unit_id: 4, quantity: 2, subtotal: 600000, unit_price: 300000 },
    { id: 12, order_id: 8, product_unit_id: 1, quantity: 1, subtotal: 30000, unit_price: 1000 },
    { id: 13, order_id: 9, product_unit_id: 2, quantity: 1, subtotal: 3000, unit_price: 1000 },
    { id: 14, order_id: 10, product_unit_id: 3, quantity: 1, subtotal: 100000, unit_price: 100000 },
    { id: 15, order_id: 11, product_unit_id: 4, quantity: 1, subtotal: 200000, unit_price: 200000 },
    { id: 16, order_id: 12, product_unit_id: 1, quantity: 1, subtotal: 150000, unit_price: 150000 },
    { id: 17, order_id: 13, product_unit_id: 2, quantity: 1, subtotal: 250000, unit_price: 250000 },
    { id: 18, order_id: 14, product_unit_id: 3, quantity: 1, subtotal: 300000, unit_price: 300000 },
    { id: 19, order_id: 15, product_unit_id: 4, quantity: 1, subtotal: 200000, unit_price: 200000 },
    { id: 20, order_id: 16, product_unit_id: 1, quantity: 1, subtotal: 180000, unit_price: 180000 },
    { id: 21, order_id: 17, product_unit_id: 2, quantity: 1, subtotal: 320000, unit_price: 320000 },
    { id: 22, order_id: 18, product_unit_id: 3, quantity: 1, subtotal: 400000, unit_price: 400000 },
    { id: 23, order_id: 19, product_unit_id: 4, quantity: 1, subtotal: 280000, unit_price: 280000 }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<OrderDetail | null>(null)
  const [formData, setFormData] = useState({
    order_id: 0,
    product_unit_id: 0,
    quantity: 0,
    subtotal: 0,
    unit_price: 0
  })

  const handleAddNew = () => {
    setEditingDetail(null)
    setFormData({
      order_id: 0,
      product_unit_id: 0,
      quantity: 0,
      subtotal: 0,
      unit_price: 0
    })
    setIsModalOpen(true)
  }

  const handleEdit = (detail: OrderDetail) => {
    setEditingDetail(detail)
    setFormData({
      order_id: detail.order_id,
      product_unit_id: detail.product_unit_id,
      quantity: detail.quantity,
      subtotal: detail.subtotal,
      unit_price: detail.unit_price
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingDetail) {
      setDetails(details.map(d => 
        d.id === editingDetail.id 
          ? { ...d, ...formData }
          : d
      ))
    } else {
      const newDetail: OrderDetail = {
        id: Math.max(...details.map(d => d.id)) + 1,
        ...formData
      }
      setDetails([...details, newDetail])
    }
    
    setIsModalOpen(false)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết đơn hàng này?')) {
      setDetails(details.filter(d => d.id !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Stats
  const totalDetails = details.length
  const totalQuantity = details.reduce((sum, d) => sum + d.quantity, 0)
  const totalSubtotal = details.reduce((sum, d) => sum + d.subtotal, 0)
  const averageUnitPrice = details.length > 0 ? totalSubtotal / totalQuantity : 0

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
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng chi tiết</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalDetails}</dd>
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
                  <span className="text-white text-sm font-medium">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng số lượng</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalQuantity}</dd>
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
                  <span className="text-white text-sm font-medium">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng thành tiền</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(totalSubtotal)}</dd>
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
                  <span className="text-white text-sm font-medium">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Giá TB/đơn vị</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(averageUnitPrice)}</dd>
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
            <h3 className="text-lg leading-6 font-medium text-gray-900">Chi tiết Đơn hàng</h3>
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
                    ID Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thành tiền
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
                      {detail.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.product_unit_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detail.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(detail.unit_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(detail.subtotal)}
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
        title={editingDetail ? 'Sửa chi tiết đơn hàng' : 'Thêm chi tiết đơn hàng mới'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID Đơn hàng *
              </label>
              <input
                type="number"
                required
                value={formData.order_id}
                onChange={(e) => setFormData({ ...formData, order_id: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập ID đơn hàng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID Sản phẩm *
              </label>
              <input
                type="number"
                required
                value={formData.product_unit_id}
                onChange={(e) => setFormData({ ...formData, product_unit_id: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập ID sản phẩm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số lượng *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập số lượng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Đơn giá *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập đơn giá"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thành tiền *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={formData.subtotal}
              onChange={(e) => setFormData({ ...formData, subtotal: parseInt(e.target.value) })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Nhập thành tiền"
            />
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

export default OrderDetailManagement
