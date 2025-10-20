import { useState, useEffect } from 'react'
import { InventoryService, StockLocationDto } from '@/services/inventoryService'

interface Warehouse {
  id: number
  name: string
  address: string
  phone: string
  contact_person: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    contact_person: '',
    description: '',
    active: true
  })
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([])
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    zone: '',
    aisle: '',
    rack: '',
    level: '',
    position: '',
    active: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Load warehouses from API
  const loadWarehouses = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading warehouses from API...')
      const warehouses = await InventoryService.getWarehouses()
      console.log('📦 Warehouses loaded:', warehouses)

      // Map API data to local interface
      const mappedWarehouses: Warehouse[] = warehouses.map(w => {
        console.log('📦 Mapping warehouse:', w)
        return {
          id: w.id,
          name: w.name,
          address: w.address || '',
          phone: w.phone || '',
          contact_person: (w as any).manager || (w as any).contactPerson || (w as any).contact_person || null,
          description: (w as any).description || null,
          active: w.active,
          created_at: (w as any).createdAt || '',
          updated_at: (w as any).updatedAt || '',
        }
      })
      console.log('📦 Mapped warehouses:', mappedWarehouses)

      setWarehouses(mappedWarehouses)
    } catch (error) {
      console.error('❌ Error loading warehouses:', error)
      setNotify({ type: 'error', message: 'Không thể tải danh sách kho. Vui lòng thử lại.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWarehouses()
  }, [])

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         warehouse.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && warehouse.active) ||
                         (statusFilter === 'inactive' && !warehouse.active)
    const matchesWarehouse = selectedWarehouse === 'all' || warehouse.id === selectedWarehouse
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  const handleAddWarehouse = () => {
    setEditingWarehouse(null)
    setFormData({
      name: '',
      address: '',
      phone: '',
      contact_person: '',
      description: '',
      active: true
    })
    setStockLocations([])
    setNewLocation({
      name: '',
      description: '',
      zone: '',
      aisle: '',
      rack: '',
      level: '',
      position: '',
      active: true
    })
    setIsModalOpen(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      phone: warehouse.phone,
      contact_person: warehouse.contact_person || '',
      description: warehouse.description || '',
      active: warehouse.active
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingWarehouse(null)
    setFormData({
      name: '',
      address: '',
      phone: '',
      contact_person: '',
      description: '',
      active: true
    })
    setStockLocations([])
    setNewLocation({
      name: '',
      description: '',
      zone: '',
      aisle: '',
      rack: '',
      level: '',
      position: '',
      active: true
    })
  }

  const handleAddLocation = () => {
    if (!newLocation.name.trim()) {
      setNotify({ type: 'error', message: 'Vui lòng nhập tên vị trí' })
      return
    }

    const location: StockLocationDto = {
      id: Date.now(), // Temporary ID for UI
      name: newLocation.name,
      description: newLocation.description,
      warehouseId: 0, // Will be set when warehouse is created
      zone: newLocation.zone,
      aisle: newLocation.aisle,
      rack: newLocation.rack,
      level: newLocation.level,
      position: newLocation.position,
      active: newLocation.active
    }

    setStockLocations(prev => [...prev, location])
    setNewLocation({
      name: '',
      description: '',
      zone: '',
      aisle: '',
      rack: '',
      level: '',
      position: '',
      active: true
    })
  }

  const handleRemoveLocation = (index: number) => {
    setStockLocations(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.phone) {
      setNotify({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
      return
    }

    setIsSubmitting(true)

    try {
      if (editingWarehouse) {
        // Update existing warehouse
        const payload = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          contactPerson: formData.contact_person || undefined,
          manager: formData.contact_person || undefined,
          contact_person: formData.contact_person || undefined,
          description: formData.description || undefined,
          active: formData.active
        }
        console.log('📝 Updating warehouse with payload:', payload)

        const updatedWarehouse = await InventoryService.updateWarehouse(editingWarehouse.id, payload)
        console.log('✅ Warehouse updated:', updatedWarehouse)

        // Refresh the list
        await loadWarehouses()
        setNotify({ type: 'success', message: 'Cập nhật kho thành công' })
      } else {
        // Create new warehouse
        const payload = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          contactPerson: formData.contact_person || undefined,
          manager: formData.contact_person || undefined,
          contact_person: formData.contact_person || undefined,
          description: formData.description || undefined,
          active: formData.active
        }
        console.log('📝 Creating warehouse with payload:', payload)

        const newWarehouse = await InventoryService.createWarehouse(payload)
        console.log('✅ Warehouse created:', newWarehouse)

        // Create stock locations for the warehouse
        if (stockLocations.length > 0) {
          for (const location of stockLocations) {
            await InventoryService.createStockLocation({
              ...location,
              warehouseId: newWarehouse.id
            })
          }
          setNotify({ type: 'success', message: `Thêm kho và ${stockLocations.length} vị trí thành công` })
        } else {
          setNotify({ type: 'success', message: 'Thêm kho thành công' })
        }

        // Refresh the list
        await loadWarehouses()
      }

      handleCloseModal()
    } catch (error) {
      console.error('❌ Error saving warehouse:', error)
      setNotify({ type: 'error', message: 'Không thể lưu kho. Vui lòng thử lại.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWarehouse = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kho này?')) {
      try {
        await InventoryService.deleteWarehouse(id)
        console.log('✅ Warehouse deleted:', id)

        // Refresh the list
        await loadWarehouses()
        setNotify({ type: 'success', message: 'Xóa kho thành công' })
      } catch (error) {
        console.error('❌ Error deleting warehouse:', error)
        setNotify({ type: 'error', message: 'Không thể xóa kho. Vui lòng thử lại.' })
      }
    }
  }

  const handleToggleStatus = async (id: number) => {
    try {
      const warehouse = warehouses.find(w => w.id === id)
      if (!warehouse) return

      const newStatus = !warehouse.active
      console.log('🔄 Toggling warehouse status:', id, 'from', warehouse.active, 'to', newStatus)

      // Use updateWarehouse with full payload
      const payload = {
        name: warehouse.name,
        address: warehouse.address,
        phone: warehouse.phone,
        contactPerson: warehouse.contact_person || undefined,
        manager: warehouse.contact_person || undefined,
        contact_person: warehouse.contact_person || undefined,
        description: warehouse.description || undefined,
        active: newStatus
      }

      await InventoryService.updateWarehouse(id, payload)
      console.log('✅ Warehouse status toggled:', id, newStatus)

      // Refresh the list
      await loadWarehouses()
      setNotify({
        type: 'success',
        message: `Kho đã được ${newStatus ? 'kích hoạt' : 'tạm ngưng'} thành công`
      })
    } catch (error) {
      console.error('❌ Error toggling warehouse status:', error)
      setNotify({ type: 'error', message: 'Không thể thay đổi trạng thái kho. Vui lòng thử lại.' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const activeWarehouses = warehouses.filter(w => w.active).length
  const inactiveWarehouses = warehouses.filter(w => !w.active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddWarehouse}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Thêm kho mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
          <div className="flex items-center">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Tổng số kho</p>
              <p className="text-xl font-semibold text-gray-900">{warehouses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
          <div className="flex items-center">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Kho hoạt động</p>
              <p className="text-xl font-semibold text-gray-900">{activeWarehouses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
          <div className="flex items-center">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Kho tạm dừng</p>
              <p className="text-xl font-semibold text-gray-900">{inactiveWarehouses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên kho, địa chỉ hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả kho</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên kho
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người liên hệ
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-500 text-sm">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-500 text-sm">
                    Không có dữ liệu kho
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{warehouse.name}</div>
                      {warehouse.description && (
                        <div className="text-xs text-gray-500">{warehouse.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {warehouse.address}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {warehouse.phone}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {warehouse.contact_person || '-'}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      warehouse.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {warehouse.active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(warehouse.created_at)}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditWarehouse(warehouse)}
                        className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleStatus(warehouse.id)}
                        className={`px-2.5 py-1 text-xs rounded ${
                          warehouse.active
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {warehouse.active ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                      <button
                        onClick={() => handleDeleteWarehouse(warehouse.id)}
                        className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Modal */}
      {notify && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setNotify(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className={`flex items-center ${notify.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  <div className="flex-shrink-0">
                    {notify.type === 'error' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{notify.message}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setNotify(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-[800px] w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingWarehouse ? 'Chỉnh sửa kho' : 'Thêm kho mới'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên kho *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập tên kho"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập địa chỉ kho"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="0900000000"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Người liên hệ
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Tên người liên hệ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Mô tả về kho"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                      Kho hoạt động
                    </label>
                  </div>

                  {/* Stock Locations Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Vị trí cụ thể trong kho</h4>
                      <span className="text-sm text-gray-500">{stockLocations.length} vị trí</span>
                    </div>

                    {/* Add Location Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên vị trí *
                          </label>
                          <input
                            type="text"
                            value={newLocation.name}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="VD: Kệ A1, Tầng 1..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mô tả
                          </label>
                          <input
                            type="text"
                            value={newLocation.description}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Mô tả vị trí..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Khu vực
                          </label>
                          <input
                            type="text"
                            value={newLocation.zone}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, zone: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="A, B, C..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lối đi
                          </label>
                          <input
                            type="text"
                            value={newLocation.aisle}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, aisle: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="1, 2, 3..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kệ
                          </label>
                          <input
                            type="text"
                            value={newLocation.rack}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, rack: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="1, 2, 3..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tầng
                          </label>
                          <input
                            type="text"
                            value={newLocation.level}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, level: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="1, 2, 3..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vị trí
                          </label>
                          <input
                            type="text"
                            value={newLocation.position}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, position: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="1, 2, 3..."
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="locationActive"
                            checked={newLocation.active}
                            onChange={(e) => setNewLocation(prev => ({ ...prev, active: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label htmlFor="locationActive" className="ml-2 block text-sm text-gray-900">
                            Vị trí hoạt động
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddLocation}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Thêm vị trí
                        </button>
                      </div>
                    </div>

                    {/* Locations List */}
                    {stockLocations.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Danh sách vị trí đã thêm:</h5>
                        {stockLocations.map((location, index) => (
                          <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-3">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{location.name}</div>
                              {location.description && (
                                <div className="text-sm text-gray-500">{location.description}</div>
                              )}
                              <div className="text-xs text-gray-400">
                                {[location.zone, location.aisle, location.rack, location.level, location.position]
                                  .filter(Boolean)
                                  .join(' - ') || 'Chưa có thông tin vị trí'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveLocation(index)}
                              className="ml-2 px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : (editingWarehouse ? 'Cập nhật' : 'Thêm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WarehouseManagement
