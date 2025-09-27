import { Product, ProductCategory, ProductUnit } from '@/services/productService'

interface ProductTableProps {
  products: Product[]
  categories: ProductCategory[]
  onEdit: (product: Product) => void
  onDelete: (id: number) => void
  // Đã ẩn nút thêm đơn vị và tạo/xem giá theo yêu cầu
  onViewDetail?: (product: Product) => void
}

const ProductTable = ({ products, categories, onEdit, onDelete, onViewDetail }: ProductTableProps) => {

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const getCategoryName = (product: Product) => {
    if (product.categoryName) return product.categoryName
    const category = categories.find(cat => cat.id === product.categoryId)
    return category ? category.name : `ID: ${product.categoryId}`
  }

  const buildRows = () => {
    const rows: { product: Product; unit: ProductUnit | null }[] = []
    for (const product of products) {
      const units = product.productUnits && product.productUnits.length > 0
        ? product.productUnits
        : [null]
      for (const unit of units) {
        rows.push({ product, unit })
      }
    }
    return rows
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã SP
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sản phẩm
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Danh mục
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Đơn vị tính
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Giá
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HSD
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {buildRows().map(({ product, unit }) => (
              <tr key={`${product.id}-${unit ? unit.id : 'nou'}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{product.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {product.imageUrl ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={product.imageUrl}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCategoryName(product)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit ? unit.unitName : '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(unit?.currentPrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.expirationDate ? formatDate(product.expirationDate) : 'Không có'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(product)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Xem chi tiết sản phẩm"
                      >
                        Chi tiết
                      </button>
                    )}
                    {/* Ẩn các nút: "+ Đơn vị" và "Tạo giá/Xem giá" theo yêu cầu */}
                    <button
                      onClick={() => onEdit(product)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Chỉnh sửa sản phẩm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Xóa sản phẩm"
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
  )
}

export default ProductTable
