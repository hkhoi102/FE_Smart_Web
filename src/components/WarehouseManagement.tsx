import { useState, useEffect } from 'react'
import { InventoryService } from '@/services/inventoryService'

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
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [nameError, setNameError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

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
    const matchesWarehouse = selectedWarehouse === 'all' || warehouse.id === selectedWarehouse
    return matchesSearch && matchesWarehouse
  })

  // Sort warehouses by status
  const sortedWarehouses = sortOrder ? [...filteredWarehouses].sort((a, b) => {
    // true (active/Đang hoạt động) = 1, false (inactive/Tạm dừng) = 0
    const aValue = a.active ? 1 : 0
    const bValue = b.active ? 1 : 0

    if (sortOrder === 'asc') {
      return aValue - bValue // Tạm dừng (0) trước, Đang hoạt động (1) sau
    } else {
      return bValue - aValue // Đang hoạt động (1) trước, Tạm dừng (0) sau
    }
  }) : filteredWarehouses

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
    setNameError(false) // Reset lỗi tên khi mở modal mới
    setPhoneError(false) // Reset lỗi số điện thoại khi mở modal mới
    setIsModalOpen(true)
  }

  const handleEditWarehouse = async (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      phone: warehouse.phone,
      contact_person: warehouse.contact_person || '',
      description: warehouse.description || '',
      active: warehouse.active
    })
    setNameError(false) // Reset lỗi tên khi edit warehouse
    setPhoneError(false) // Reset lỗi số điện thoại khi edit warehouse
    // Load existing stock location for this warehouse
    try {
      const locations = await InventoryService.getStockLocations(warehouse.id, true)
      if (locations.length > 0) {
        const location = locations[0] // Get first (and only) location
        setNewLocation({
          name: location.name || '',
          description: location.description || '',
          zone: location.zone || '',
          aisle: location.aisle || '',
          rack: location.rack || '',
          level: location.level || '',
          position: location.position || '',
          active: location.active
        })
      }
    } catch {
      // Reset form if no location found
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.phone) {
      setNotify({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
      return
    }

    // Kiểm tra định dạng số điện thoại
    const phoneRegex = /^0\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      setPhoneError(true)
      setNotify({ type: 'error', message: 'Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số' })
      return
    }

    // Kiểm tra tên kho trùng (chỉ khi tạo mới hoặc đổi tên)
    if (!editingWarehouse || formData.name !== editingWarehouse.name) {
      const existingWarehouse = warehouses.find(w =>
        w.name.toLowerCase() === formData.name.toLowerCase() && w.id !== editingWarehouse?.id
      )
      if (existingWarehouse) {
        setNameError(true) // Highlight trường tên khi có lỗi
        return // Không đóng modal, để người dùng sửa tên
      }
    }

    setIsSubmitting(true)

    try {
      if (!editingWarehouse) {
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

        // Create stock location for the warehouse if name is provided
        if (newLocation.name.trim()) {
          await InventoryService.createStockLocation({
            name: newLocation.name,
            description: newLocation.description,
            warehouseId: newWarehouse.id,
            zone: newLocation.zone,
            aisle: newLocation.aisle,
            rack: newLocation.rack,
            level: newLocation.level,
            position: newLocation.position,
            active: newLocation.active
          })
          setNotify({ type: 'success', message: 'Thêm kho và vị trí thành công' })
        } else {
          setNotify({ type: 'success', message: 'Thêm kho thành công' })
        }

        // Refresh the list
        await loadWarehouses()
      } else if (editingWarehouse) {
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

        // Update stock location for the warehouse if name is provided
        if (newLocation.name.trim()) {
          // First, get existing locations to update or create
          const existingLocations = await InventoryService.getStockLocations(editingWarehouse.id, true)

          if (existingLocations.length > 0) {
            // Update existing location
            await InventoryService.updateStockLocation(existingLocations[0].id, {
              name: newLocation.name,
              description: newLocation.description,
              zone: newLocation.zone,
              aisle: newLocation.aisle,
              rack: newLocation.rack,
              level: newLocation.level,
              position: newLocation.position,
              active: newLocation.active
            })
          } else {
            // Create new location
            await InventoryService.createStockLocation({
              name: newLocation.name,
              description: newLocation.description,
              warehouseId: editingWarehouse.id,
              zone: newLocation.zone,
              aisle: newLocation.aisle,
              rack: newLocation.rack,
              level: newLocation.level,
              position: newLocation.position,
              active: newLocation.active
            })
          }
          setNotify({ type: 'success', message: 'Cập nhật kho và vị trí thành công' })
        } else {
          setNotify({ type: 'success', message: 'Cập nhật kho thành công' })
        }

        // Refresh the list
        await loadWarehouses()
      }

      handleCloseModal()
    } catch (error: any) {
      console.error('❌ Error saving warehouse:', error)

      // Xử lý lỗi cụ thể từ backend
      let errorMessage = 'Không thể lưu kho. Vui lòng thử lại.'
      let shouldCloseModal = true // Mặc định đóng modal
      let isNameConflict = false // Flag để kiểm tra lỗi tên trùng

      // Kiểm tra response error từ API
      if (error?.response?.data?.error) {
        const apiError = error.response.data.error.toLowerCase()
        if (apiError.includes('already exists') || apiError.includes('đã tồn tại')) {
          shouldCloseModal = false // Không đóng modal khi tên trùng
          setNameError(true) // Highlight trường tên khi có lỗi
          isNameConflict = true // Đánh dấu là lỗi tên trùng
        } else if (apiError.includes('not found')) {
          errorMessage = 'Không tìm thấy kho. Vui lòng thử lại.'
        } else {
          errorMessage = error.response.data.error
        }
      } else if (error?.message) {
        const message = error.message.toLowerCase()
        if (message.includes('already exists') || message.includes('đã tồn tại')) {
          shouldCloseModal = false // Không đóng modal khi tên trùng
          setNameError(true) // Highlight trường tên khi có lỗi
          isNameConflict = true // Đánh dấu là lỗi tên trùng
        } else if (message.includes('not found')) {
          errorMessage = 'Không tìm thấy kho. Vui lòng thử lại.'
        } else if (message.includes('validation') || message.includes('invalid')) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
          shouldCloseModal = false // Không đóng modal khi validation lỗi
        } else {
          errorMessage = error.message
        }
      }

      // Chỉ hiển thị thông báo lỗi nếu không phải lỗi tên trùng
      if (!isNameConflict) {
        setNotify({ type: 'error', message: errorMessage })
      }

      // Chỉ đóng modal nếu không phải lỗi tên trùng hoặc validation
      if (shouldCloseModal) {
        handleCloseModal()
      }
    } finally {
      setIsSubmitting(false)
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
            value={selectedWarehouse === 'all' ? 'all' : String(selectedWarehouse)}
            onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả kho</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={String(warehouse.id)}>
                {warehouse.name}
              </option>
            ))}
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
                <th
                  className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : sortOrder === 'desc' ? null : 'asc')}
                >
                  <div className="flex items-center gap-1">
                    Trạng thái
                    {sortOrder && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {sortOrder === 'asc' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        )}
                      </svg>
                    )}
                  </div>
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
              ) : sortedWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-500 text-sm">
                    Không có dữ liệu kho
                  </td>
                </tr>
              ) : (
                sortedWarehouses.map((warehouse) => (
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

            <div className="relative bg-white rounded-lg shadow-xl max-w-[900px] w-full">
              <div className="flex items-center justify-between px-6 py-3 border-b">
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
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                        setNameError(false) // Reset lỗi khi người dùng thay đổi tên
                      }}
                      className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-green-500 ${
                        nameError
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="Nhập tên kho"
                      required
                    />
                    {nameError && (
                      <p className="mt-1 text-xs text-red-600">
                        ⚠️ Tên kho đã tồn tại. Vui lòng chọn tên khác.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        onChange={(e) => {
                          const phoneValue = e.target.value
                          setFormData(prev => ({ ...prev, phone: phoneValue }))

                          // Real-time validation
                          if (phoneValue && !/^0\d{0,9}$/.test(phoneValue)) {
                            setPhoneError(true)
                          } else if (phoneValue && phoneValue.length === 10 && !/^0\d{9}$/.test(phoneValue)) {
                            setPhoneError(true)
                          } else {
                            setPhoneError(false)
                          }
                        }}
                        className={`w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:border-green-500 ${
                          phoneError
                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-green-500'
                        }`}
                        placeholder="0900000000"
                        required
                      />
                      {phoneError && (
                        <p className="mt-1 text-xs text-red-600">
                          ⚠️ Số điện thoại phải bắt đầu bằng 0 và có đúng 10 số
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Người liên hệ
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Vị trí cụ thể trong kho</h4>
                    </div>

                     {/* Single Location Form - Always show for warehouse */}
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                               className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                               placeholder="1, 2, 3..."
                             />
                           </div>
                         </div>

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
                       </div>

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
