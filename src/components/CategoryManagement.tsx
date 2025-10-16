import { useState, useEffect } from 'react'
import { CategoryService, Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/categoryService'
import Pagination from './Pagination'

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Load categories from API
  const loadCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await CategoryService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Không thể tải danh sách danh mục: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('Bạn cần đăng nhập để truy cập trang này')
      return
    }

    loadCategories()
  }, [])

  // Filter categories by search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const itemsPerPage = 9 // 3x3 grid
  const totalItems = filteredCategories.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

  // Update pagination state
  useEffect(() => {
    setPagination({
      current_page: currentPage,
      total_pages: totalPages,
      total_items: totalItems,
      items_per_page: itemsPerPage
    })
  }, [currentPage, totalPages, totalItems, itemsPerPage])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleAddCategory = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: ''
    })
    setImageFile(null)
    setImagePreview('')
    setIsModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      description: ''
    })
    setImageFile(null)
    setImagePreview('')
  }

  const handleViewDetails = (category: Category) => {
    setSelectedCategory(category)
    setIsDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (editingCategory) {
        // Update existing category
        const updateData: UpdateCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim()
        }

        await CategoryService.updateCategory(editingCategory.id, updateData)
      } else {
        // Create new category
        if (imageFile) {
          // Create with image
          await CategoryService.createCategoryWithImage(
            formData.name.trim(),
            formData.description.trim(),
            imageFile
          )
        } else {
          // Create without image
          const createData: CreateCategoryRequest = {
            name: formData.name.trim(),
            description: formData.description.trim()
          }

          await CategoryService.createCategory(createData)
        }
      }

      // Reload categories after successful operation
      await loadCategories()
      handleCloseModal()
    } catch (error: any) {
      console.error('Error saving category:', error)
      setError(error.message || 'Có lỗi xảy ra khi lưu danh mục')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    const category = categories.find(cat => cat.id === id)
    if (!category) return

    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      try {
        await CategoryService.deleteCategory(id)
        await loadCategories()
      } catch (error: any) {
        console.error('Error deleting category:', error)
        alert(error.message || 'Có lỗi xảy ra khi xóa danh mục')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý danh mục sản phẩm</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="hidden md:block w-64 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleAddCategory}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Thêm danh mục
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Search moved to header */}

      {/* Categories Grid */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {paginatedCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(category)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      {category.imageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {category.description || 'Không có mô tả'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span>ID: {category.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                      title="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && paginatedCategories.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có danh mục nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo danh mục mới.</p>
          <div className="mt-6">
            <button
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm danh mục
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseDetailModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Chi tiết danh mục
                    </h3>
                    <p className="text-sm text-gray-500">ID: {selectedCategory.id}</p>
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
                <div className="space-y-6">
                  {selectedCategory.imageUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ảnh danh mục
                      </label>
                      <img
                        src={selectedCategory.imageUrl}
                        alt={selectedCategory.name}
                        className="h-32 w-32 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên danh mục
                    </label>
                    <p className="text-lg font-semibold text-gray-900">{selectedCategory.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <p className="text-gray-900">
                      {selectedCategory.description || 'Không có mô tả'}
                    </p>
                  </div>

                  {selectedCategory.createdAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày tạo
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedCategory.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => {
                        handleCloseDetailModal()
                        handleEditCategory(selectedCategory)
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
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
                      Tên danh mục *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập tên danh mục"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập mô tả danh mục"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload - Only for new categories */}
                  {!editingCategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ảnh danh mục (tùy chọn)
                      </label>
                      {imagePreview && (
                        <div className="mb-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-20 w-20 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImageFile(file)
                            const reader = new FileReader()
                            reader.onload = () => setImagePreview(reader.result as string)
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Chọn ảnh để tạo danh mục với hình ảnh
                      </p>
                    </div>
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
                    {isSubmitting ? 'Đang lưu...' : (editingCategory ? 'Cập nhật' : 'Thêm')}
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

export default CategoryManagement
