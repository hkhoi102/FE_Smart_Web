import { useState, useEffect } from 'react'
import { ProductService } from '@/services/productService'
// Removed inline barcode handling; handled via row actions in product table
import type { Product, ProductCategory } from '@/services/productService'

interface ProductFormProps {
  product?: Product | null
  categories: ProductCategory[]
  onSubmit: (productData: any) => void
  onCancel: () => void
  isLoading?: boolean
}

const ProductForm = ({ product, categories, onSubmit, onCancel, isLoading = false }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: 1,
    image_url: '',
    expiration_date: '',
    active: 1,
    unit_id: 0
  })

  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([])
  const [allUnits, setAllUnits] = useState<Array<{ id: number; name: string; isDefault?: boolean }>>([])
  const [productUnitsView, setProductUnitsView] = useState<Array<{ id: number; unitId: number; unitName: string; conversionFactor: number; isDefault: boolean }>>([])
  const [newUnitId, setNewUnitId] = useState<number | ''>('')
  const [newUnitCF, setNewUnitCF] = useState<number>(1)

  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)


  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: (product as any).categoryId || (product as any).category_id,
        image_url: (product as any).imageUrl || (product as any).image_url || '',
        expiration_date: (product as any).expirationDate || (product as any).expiration_date || '',
        active: (product as any).active ? 1 : 0,
        unit_id: (product as any).defaultUnitId || 0
      })
      setImagePreview((product as any).imageUrl || (product as any).image_url || '')
      setProductUnitsView((product.productUnits || []).map(u => ({ id: u.id, unitId: u.unitId, unitName: u.unitName, conversionFactor: u.conversionFactor, isDefault: !!u.isDefault })))
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        category_id: 1,
        image_url: '',
        expiration_date: '',
        active: 1,
        unit_id: 0
      })
      setImagePreview('')
      setProductUnitsView([])
    }
  }, [product])

  useEffect(() => {
    // Load all units for selection and default units list
    ProductService.getUnits()
      .then((res: any[]) => {
        const arr = (res || [])
        setAllUnits(arr)
        const filtered = arr.filter((u: any) => u && (u.isDefault === true))
        setUnits(filtered.map((u: any) => ({ id: u.id, name: u.name })))
      })
      .catch(() => { setUnits([]); setAllUnits([]) })
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'category_id' || name === 'active' ? Number(value) : value
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.name.trim()) return onSubmit({ __error: 'Vui lòng nhập tên sản phẩm' })

    const productData = {
      name: formData.name,
      description: formData.description,
      expirationDate: formData.expiration_date || undefined,
      categoryId: formData.category_id,
      active: formData.active === 1,
      defaultUnitId: formData.unit_id || null,
    }

    // Ảnh
    if (imageFile) {
      try {
        if (product && product.id) {
          await ProductService.updateProductImage(product.id, imageFile)
        } else {
          const created = await ProductService.createProductWithImage(productData as any, imageFile)
          onSubmit(created)
          return
        }
      } catch (err) {
        // fallback tạo thường nếu thất bại
      }
    }

    // Fallback: tạo không kèm ảnh (dùng URL nếu có)
    onSubmit({ ...productData, imageUrl: formData.image_url || undefined })
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
            Ảnh sản phẩm
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="mb-2 h-20 w-20 object-cover rounded" />
          )}
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploading(true)
                try {
                  // Với API tạo sản phẩm kèm ảnh, chỉ cần lưu file tạm để gửi cùng payload
                  setImageFile(file)
                  const reader = new FileReader()
                  reader.onload = () => setImagePreview(String(reader.result))
                  reader.readAsDataURL(file)
                } catch (err) {
                  alert('Tải ảnh thất bại')
                } finally {
                  setUploading(false)
                }
              }}
              className="block w-full text-sm text-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploading ? 'Đang xử lý ảnh...' : 'Chọn ảnh từ máy tính; nếu có API tạo kèm ảnh sẽ gửi cùng.'}</p>
        </div>

        {/* Hạn sử dụng - removed per request */}

        {/* Bỏ Đơn vị tính (mặc định) theo yêu cầu */}
      </div>

      {/* Đơn vị tính & Barcode (ẩn trong chế độ sửa theo yêu cầu) */}

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
