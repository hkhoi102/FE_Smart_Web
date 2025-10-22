import { useState, useEffect } from 'react'
import { UserService, User, CreateUserRequest, UpdateUserRequest } from '@/services/userService'
import { InventoryService, WarehouseDto, StockLocationDto } from '@/services/inventoryService'

interface Account extends User {
  createdAt: string
  otpCode: string | null
  otpExpiresAt: string | null
  passwordHash: string
}

const AccountManagement = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'MANAGER',
    defaultWarehouseId: null as number | null,
    defaultStockLocationId: null as number | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10
  })
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)

  // Load warehouses from API
  const loadWarehouses = async () => {
    setLoadingWarehouses(true)
    try {
      const warehousesData = await InventoryService.getWarehouses()
      setWarehouses(warehousesData)
    } catch (error) {
      console.error('Error loading warehouses:', error)
    } finally {
      setLoadingWarehouses(false)
    }
  }

  // Load stock locations for a specific warehouse
  const loadStockLocations = async (warehouseId: number | null) => {
    if (!warehouseId) {
      setStockLocations([])
      return
    }

    try {
      const locations = await InventoryService.getStockLocations(warehouseId)
      setStockLocations(locations)
    } catch (error) {
      console.error('Error loading stock locations:', error)
      setStockLocations([])
    }
  }

  // Load users from API
  const loadUsers = async (page: number = 0, search: string = '') => {
    setLoading(true)
    setError('')
    try {
      const response = await UserService.getUsers(page, pagination.size, search || undefined)

      // Transform API response to match our interface
      const transformedAccounts: Account[] = response.content.map(user => ({
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        otpCode: null,
        otpExpiresAt: null,
        passwordHash: '***'
      }))

      setAccounts(transformedAccounts)
      setPagination({
        currentPage: response.number,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        size: response.size
      })
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadWarehouses()
  }, [])

  // Auto dismiss notifications
  useEffect(() => {
    if (!notify) return
    const t = setTimeout(() => setNotify(null), 3000)
    return () => clearTimeout(t)
  }, [notify])

  // Load users when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers(0, searchTerm)
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Filter accounts by role (search is handled by API)
  const filteredAccounts = accounts.filter(account => {
    const matchesRole = roleFilter === 'all' || account.role === roleFilter
    return matchesRole
  })

  const handleAddAccount = () => {
    setEditingAccount(null)
    setError('')
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'USER',
      defaultWarehouseId: null,
      defaultStockLocationId: null
    })
    setPhoneTouched(false)
    setIsModalOpen(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      fullName: account.fullName,
      email: account.email,
      password: '',
      phoneNumber: account.phoneNumber,
      role: account.role,
      defaultWarehouseId: account.defaultWarehouseId || null,
      defaultStockLocationId: account.defaultStockLocationId || null
    })
    // Load stock locations if warehouse is selected
    if (account.defaultWarehouseId) {
      loadStockLocations(account.defaultWarehouseId)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAccount(null)
    setError('')
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      role: 'USER',
      defaultWarehouseId: null,
      defaultStockLocationId: null
    })
    setStockLocations([])
    setPhoneTouched(false)
  }

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account)
    // Load stock locations if warehouse is selected
    if (account.defaultWarehouseId) {
      loadStockLocations(account.defaultWarehouseId)
    }
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedAccount(null)
    setStockLocations([])
  }

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false)
    setEditingAccount(null) // Reset editing state
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName || !formData.email || (!editingAccount && !formData.password)) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Phone validation: must start with 0 and have exactly 10 digits
    const phoneRegex = /^0\d{9}$/
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 số')
      setPhoneTouched(true)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (editingAccount) {
        // Update existing account
        const updateData: UpdateUserRequest = {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          defaultWarehouseId: formData.defaultWarehouseId,
          defaultStockLocationId: formData.defaultStockLocationId
        }

        await UserService.updateUser(editingAccount.id, updateData)
      } else {
        // Create new account
        const createData: CreateUserRequest = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          defaultWarehouseId: formData.defaultWarehouseId,
          defaultStockLocationId: formData.defaultStockLocationId
        }

        await UserService.createUser(createData)
      }

      // Reload users after successful operation
      await loadUsers(pagination.currentPage, searchTerm)
      handleCloseModal()

      // Show success modal for both create and update
      setIsSuccessModalOpen(true)
    } catch (error: any) {
      console.error('Error saving user:', error)

      // Parse error message from backend
      let errorMessage = 'Có lỗi xảy ra khi lưu thông tin'

      try {
        // Try to parse error response if it's a string
        if (typeof error.message === 'string') {
          const errorData = JSON.parse(error.message)
          if (errorData.error) {
            if (errorData.error === 'Email exists') {
              errorMessage = 'Email đã tồn tại trong hệ thống'
            } else if (errorData.error === 'Phone exists') {
              errorMessage = 'Số điện thoại đã tồn tại trong hệ thống'
            } else {
              errorMessage = errorData.error
            }
          }
        }
      } catch (parseError) {
        // If parsing fails, check if error message contains specific text
        if (error.message && error.message.includes('Email exists')) {
          errorMessage = 'Email đã tồn tại trong hệ thống'
        } else if (error.message && error.message.includes('Phone exists')) {
          errorMessage = 'Số điện thoại đã tồn tại trong hệ thống'
        } else {
          errorMessage = error.message || errorMessage
        }
      }

      setError(errorMessage)
      setNotify({ type: 'error', message: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleToggleStatus = async (id: number) => {
    try {
      const account = accounts.find(acc => acc.id === id)
      if (account) {
        await UserService.updateUserStatus(id, !account.active)
        await loadUsers(pagination.currentPage, searchTerm)
      }
    } catch (error: any) {
      console.error('Error updating user status:', error)
      alert(error.message || 'Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }


  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên'
      case 'MANAGER': return 'Quản lý'
      case 'USER': return 'Người dùng'
      default: return role
    }
  }

  // Handle warehouse change
  const handleWarehouseChange = (warehouseId: number | null) => {
    setFormData(prev => ({ ...prev, defaultWarehouseId: warehouseId, defaultStockLocationId: null }))
    loadStockLocations(warehouseId)
  }


  return (
    <div className="space-y-6">
      {/* Global notifications */}
      {notify && (
        <div className={`${notify.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-md`}>
          {notify.message}
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h2>
        <button
          onClick={handleAddAccount}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Thêm tài khoản
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-56 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="MANAGER">Quản lý</option>
            <option value="USER">Người dùng</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(account)}>
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.fullName}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {account.email}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {getRoleLabel(account.role)}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      account.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleStatus(account.id)}
                        className={`px-2.5 py-1 text-xs rounded ${account.active ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {account.active ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {pagination.currentPage * pagination.size + 1} đến {Math.min((pagination.currentPage + 1) * pagination.size, pagination.totalElements)} trong tổng số {pagination.totalElements} kết quả
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadUsers(pagination.currentPage - 1, searchTerm)}
              disabled={pagination.currentPage === 0}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Trang {pagination.currentPage + 1} / {pagination.totalPages}
            </span>
            <button
              onClick={() => loadUsers(pagination.currentPage + 1, searchTerm)}
              disabled={pagination.currentPage >= pagination.totalPages - 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseDetailModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Chi tiết thông tin người dùng
                    </h3>
                    <p className="text-sm text-gray-500">ID: {selectedAccount.id}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetailModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Header Info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedAccount.fullName}</h4>
                      <p className="text-lg text-gray-600 mb-1">{selectedAccount.email}</p>
                      <p className="text-sm text-gray-500">{selectedAccount.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                        selectedAccount.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          selectedAccount.active ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        {selectedAccount.active ? 'Hoạt động' : 'Tạm dừng'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getRoleLabel(selectedAccount.role)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Thông tin cá nhân */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Thông tin cá nhân
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Họ tên
                        </label>
                        <p className="text-sm text-gray-900 font-medium">{selectedAccount.fullName}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900">{selectedAccount.email}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Số điện thoại
                        </label>
                        <p className="text-sm text-gray-900">{selectedAccount.phoneNumber}</p>
                      </div>
                      {/* Warehouse and Stock Location info for MANAGER/ADMIN */}
                      {(selectedAccount.role === 'MANAGER' || selectedAccount.role === 'ADMIN') && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Kho
                            </label>
                            <p className="text-sm text-gray-900">
                              {selectedAccount.defaultWarehouseId
                                ? warehouses.find(w => w.id === selectedAccount.defaultWarehouseId)?.name || 'Không xác định'
                                : 'Chưa chọn'
                              }
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Vị trí kho
                            </label>
                            <p className="text-sm text-gray-900">
                              {selectedAccount.defaultStockLocationId
                                ? stockLocations.find(l => l.id === selectedAccount.defaultStockLocationId)?.name || 'Không xác định'
                                : 'Chưa chọn'
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thông tin hệ thống */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thông tin hệ thống
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          ID người dùng
                        </label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                          #{selectedAccount.id}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Vai trò
                        </label>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getRoleLabel(selectedAccount.role)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Trạng thái
                        </label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedAccount.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedAccount.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin thời gian */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Thông tin thời gian
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Ngày tạo tài khoản
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedAccount.createdAt).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedAccount.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Thời gian hoạt động
                        </label>
                        <p className="text-sm text-gray-900">
                          {Math.floor((new Date().getTime() - new Date(selectedAccount.createdAt).getTime()) / (1000 * 60 * 60 * 24))} ngày
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCloseDetailModal}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Đóng
                      </button>
                      <button
                        onClick={() => {
                          handleCloseDetailModal()
                          handleEditAccount(selectedAccount)
                        }}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
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

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
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
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập họ tên"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setFormData(prev => ({ ...prev, phoneNumber: digitsOnly }))
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập số điện thoại"
                      pattern="^0\d{9}$"
                      title="Số điện thoại phải bắt đầu bằng 0 và có 10 số"
                      maxLength={10}
                      required
                    />
                    {phoneTouched && formData.phoneNumber !== '' && !/^0\d{9}$/.test(formData.phoneNumber) && (
                      <p className="mt-1 text-sm text-red-600">Số điện thoại phải bắt đầu bằng 0 và có 10 số</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu {!editingAccount && '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={editingAccount ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
                      required={!editingAccount}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vai trò *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'USER' | 'ADMIN' | 'MANAGER' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="USER">Người dùng</option>
                      <option value="MANAGER">Quản lý</option>
                      <option value="ADMIN">Quản trị viên</option>
                    </select>
                  </div>

                  {/* Warehouse and Stock Location fields for MANAGER/ADMIN */}
                  {(formData.role === 'MANAGER' || formData.role === 'ADMIN') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kho *
                        </label>
                        <select
                          value={formData.defaultWarehouseId || ''}
                          onChange={(e) => handleWarehouseChange(e.target.value ? Number(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                          disabled={loadingWarehouses}
                        >
                          <option value="">Chọn kho</option>
                          {warehouses.map(warehouse => (
                            <option key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                        </select>
                        {loadingWarehouses && (
                          <p className="text-sm text-gray-500 mt-1">Đang tải danh sách kho...</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vị trí kho *
                        </label>
                        <select
                          value={formData.defaultStockLocationId || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, defaultStockLocationId: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                          disabled={!formData.defaultWarehouseId || stockLocations.length === 0}
                        >
                          <option value="">Chọn vị trí kho</option>
                          {stockLocations.map(location => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                        {!formData.defaultWarehouseId && (
                          <p className="text-sm text-gray-500 mt-1">Vui lòng chọn kho trước</p>
                        )}
                        {formData.defaultWarehouseId && stockLocations.length === 0 && (
                          <p className="text-sm text-gray-500 mt-1">Không có vị trí kho nào</p>
                        )}
                      </div>
                    </>
                  )}
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
                    {isSubmitting ? 'Đang lưu...' : (editingAccount ? 'Cập nhật' : 'Thêm')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseSuccessModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                {/* Success Icon */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Success Message */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {editingAccount ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản thành công!'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {editingAccount
                      ? 'Thông tin tài khoản đã được cập nhật thành công. Các thay đổi đã được lưu vào hệ thống.'
                      : 'Tài khoản mới đã được tạo và thêm vào hệ thống. Bạn có thể quản lý tài khoản này trong danh sách bên dưới.'
                    }
                  </p>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleCloseSuccessModal}
                      className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountManagement
