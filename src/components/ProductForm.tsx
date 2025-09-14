import { useState, useEffect } from 'react'
import { Product, ProductCategory, ProductPrice } from '@/types/product'

interface ProductFormProps {
  product?: Product | null
  categories: ProductCategory[]
  onSubmit: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  isLoading?: boolean
}

const ProductForm = ({ product, categories, onSubmit, onCancel, isLoading = false }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 1,
    unit: '',
    image_url: '',
    expiration_date: '',
    active: 1
  })
  

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        unit: product.unit,
        image_url: product.image_url || '',
        expiration_date: product.expiration_date || '',
        active: product.active
      })
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category_id: 1,
        unit: '',
        image_url: '',
        expiration_date: '',
        active: 1
      })
    }
  }, [product])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' || name === 'active' ? Number(value) : value
    }))
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm')
      return
    }
    
    if (!formData.unit.trim()) {
      alert('Vui lòng chọn đơn vị tính')
      return
    }

    const productData = {
      ...formData,
      expiration_date: formData.expiration_date || null,
      image_url: formData.image_url || null,
      prices: [{
        id: 1,
        product_id: product?.id || 0,
        unit: formData.unit,
        price: 0,
        is_default: true
      }]
    }

    onSubmit(productData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tên sản phẩm */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên sản phẩm *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Nhập tên sản phẩm"
            required
          />
        </div>

        {/* Mô tả */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Nhập mô tả sản phẩm"
          />
        </div>

        {/* Danh mục */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Danh mục *
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>


        {/* Hình ảnh */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL hình ảnh
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Hạn sử dụng và Đơn vị tính */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hạn sử dụng
          </label>
          <input
            type="date"
            name="expiration_date"
            value={formData.expiration_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đơn vị tính
          </label>
          <select
            value={formData.unit}
            onChange={handleInputChange}
            name="unit"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          >
            <option value="">Chọn đơn vị tính</option>
            <option value="Cái">Cái</option>
            <option value="Chai">Chai</option>
            <option value="Lon">Lon</option>
            <option value="Gói">Gói</option>
            <option value="Hộp">Hộp</option>
            <option value="Túi">Túi</option>
            <option value="Kg">Kg</option>
            <option value="Lít">Lít</option>
            <option value="Thùng">Thùng</option>
            <option value="Cặp">Cặp</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang lưu...' : (product ? 'Cập nhật' : 'Thêm sản phẩm')}
        </button>
      </div>
    </form>
  )
}

export default ProductForm
