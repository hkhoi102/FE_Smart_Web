import { useState, useEffect } from 'react'

interface Unit {
  id: number
  name: string
  description?: string
  createdAt: string
}

const UnitManagement = () => {
  const [units, setUnits] = useState<Unit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock data for units
  const mockUnits: Unit[] = [
    { id: 1, name: 'Cái', description: 'Đơn vị đếm số lượng', createdAt: '2024-01-01' },
    { id: 2, name: 'Chai', description: 'Đơn vị cho đồ uống', createdAt: '2024-01-01' },
    { id: 3, name: 'Lon', description: 'Đơn vị cho đồ uống có ga', createdAt: '2024-01-01' },
    { id: 4, name: 'Gói', description: 'Đơn vị đóng gói nhỏ', createdAt: '2024-01-01' },
    { id: 5, name: 'Hộp', description: 'Đơn vị đóng gói trung bình', createdAt: '2024-01-01' },
    { id: 6, name: 'Túi', description: 'Đơn vị đóng gói linh hoạt', createdAt: '2024-01-01' },
    { id: 7, name: 'Kg', description: 'Đơn vị đo khối lượng', createdAt: '2024-01-01' },
    { id: 8, name: 'Lít', description: 'Đơn vị đo thể tích', createdAt: '2024-01-01' },
    { id: 9, name: 'Thùng', description: 'Đơn vị đóng gói lớn', createdAt: '2024-01-01' },
    { id: 10, name: 'Cặp', description: 'Đơn vị đếm theo cặp', createdAt: '2024-01-01' }
  ]

  useEffect(() => {
    setUnits(mockUnits)
  }, [])

  const handleAddUnit = () => {
    setEditingUnit(null)
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({ name: unit.name, description: unit.description || '' })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUnit(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên đơn vị tính')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      if (editingUnit) {
        // Update existing unit
        setUnits(prev => prev.map(unit => 
          unit.id === editingUnit.id 
            ? { ...unit, name: formData.name, description: formData.description }
            : unit
        ))
      } else {
        // Add new unit
        const newUnit: Unit = {
          id: Math.max(...units.map(u => u.id)) + 1,
          name: formData.name,
          description: formData.description,
          createdAt: new Date().toISOString().split('T')[0]
        }
        setUnits(prev => [...prev, newUnit])
      }
      
      setIsSubmitting(false)
      handleCloseModal()
    }, 500)
  }


  const handleDeleteUnit = (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn vị tính này?')) {
      setUnits(prev => prev.filter(unit => unit.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn vị tính</h2>
        <button
          onClick={handleAddUnit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Thêm đơn vị tính
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{unit.name}</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditUnit(unit)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteUnit(unit.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
            
            {unit.description && (
              <p className="text-sm text-gray-600">{unit.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUnit ? 'Chỉnh sửa đơn vị tính' : 'Thêm đơn vị tính mới'}
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
                      Tên đơn vị tính *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập tên đơn vị tính"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập mô tả đơn vị tính"
                    />
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
                    {isSubmitting ? 'Đang lưu...' : (editingUnit ? 'Cập nhật' : 'Thêm')}
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

export default UnitManagement
