import { useState, useEffect } from 'react'

interface Account {
  id: number
  active: boolean
  created_at: string
  email: string
  full_name: string
  otp_code: string | null
  otp_expires_at: string | null
  password_hash: string
  phone_number: string
  role: 'USER' | 'ADMIN' | 'MANAGER'
}

const AccountManagement = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    role: 'USER' as 'USER' | 'ADMIN' | 'MANAGER'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Mock data for accounts
  const mockAccounts: Account[] = [
    { 
      id: 1, 
      active: true, 
      created_at: '2024-01-01 10:30:00', 
      email: 'admin@example.com', 
      full_name: 'Nguyen Van Admin', 
      otp_code: null, 
      otp_expires_at: null, 
      password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...', 
      phone_number: '0912345678', 
      role: 'ADMIN' 
    },
    { 
      id: 2, 
      active: true, 
      created_at: '2024-01-02 14:20:00', 
      email: 'manager1@example.com', 
      full_name: 'Tran Thi Manager', 
      otp_code: '123456', 
      otp_expires_at: '2024-01-02 15:20:00', 
      password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...', 
      phone_number: '0912345679', 
      role: 'MANAGER' 
    },
    { 
      id: 3, 
      active: true, 
      created_at: '2024-01-03 09:15:00', 
      email: 'staff1@example.com', 
      full_name: 'Le Van Staff', 
      otp_code: null, 
      otp_expires_at: null, 
      password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...', 
      phone_number: '0912345680', 
      role: 'USER' 
    },
    { 
      id: 4, 
      active: false, 
      created_at: '2024-01-04 16:45:00', 
      email: 'staff2@example.com', 
      full_name: 'Pham Thi Staff', 
      otp_code: '654321', 
      otp_expires_at: '2024-01-04 17:45:00', 
      password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...', 
      phone_number: '0912345681', 
      role: 'USER' 
    },
    { 
      id: 5, 
      active: true, 
      created_at: '2024-01-05 11:30:00', 
      email: 'manager2@example.com', 
      full_name: 'Hoang Van Manager', 
      otp_code: null, 
      otp_expires_at: null, 
      password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...', 
      phone_number: '0912345682', 
      role: 'MANAGER' 
    }
  ]

  useEffect(() => {
    setAccounts(mockAccounts)
  }, [])

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || account.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleAddAccount = () => {
    setEditingAccount(null)
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone_number: '',
      role: 'USER'
    })
    setIsModalOpen(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      full_name: account.full_name,
      email: account.email,
      password: '',
      phone_number: account.phone_number,
      role: account.role
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAccount(null)
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone_number: '',
      role: 'USER'
    })
  }

  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedAccount(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.email || (!editingAccount && !formData.password)) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      if (editingAccount) {
        // Update existing account
        setAccounts(prev => prev.map(account => 
          account.id === editingAccount.id 
            ? { 
                ...account, 
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                role: formData.role
              }
            : account
        ))
      } else {
        // Add new account
        const newAccount: Account = {
          id: Math.max(...accounts.map(a => a.id)) + 1,
          active: true,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          email: formData.email,
          full_name: formData.full_name,
          otp_code: null,
          otp_expires_at: null,
          password_hash: '$2a$10$mnSzAiCdltFuKMuhcZhEwuaKDbBpMujOfP9izAH...',
          phone_number: formData.phone_number,
          role: formData.role
        }
        setAccounts(prev => [...prev, newAccount])
      }
      
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }

  const handleDeleteAccount = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setAccounts(prev => prev.filter(account => account.id !== id))
    }
  }

  const handleToggleStatus = (id: number) => {
    setAccounts(prev => prev.map(account => 
      account.id === id ? { ...account, active: !account.active } : account
    ))
  }


  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên'
      case 'MANAGER': return 'Quản lý'
      case 'USER': return 'Người dùng'
      default: return role
    }
  }


  return (
    <div className="space-y-6">
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

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
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
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(account)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.full_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getRoleLabel(account.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.active ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleToggleStatus(account.id)}
                        className={`${account.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {account.active ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
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
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedAccount.full_name}</h4>
                      <p className="text-lg text-gray-600 mb-1">{selectedAccount.email}</p>
                      <p className="text-sm text-gray-500">{selectedAccount.phone_number}</p>
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
                        <p className="text-sm text-gray-900 font-medium">{selectedAccount.full_name}</p>
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
                        <p className="text-sm text-gray-900">{selectedAccount.phone_number}</p>
                      </div>
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
                          {new Date(selectedAccount.created_at).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedAccount.created_at).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Thời gian hoạt động
                        </label>
                        <p className="text-sm text-gray-900">
                          {Math.floor((new Date().getTime() - new Date(selectedAccount.created_at).getTime()) / (1000 * 60 * 60 * 24))} ngày
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
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
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập số điện thoại"
                      required
                    />
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
    </div>
  )
}

export default AccountManagement
