import { Product, ProductCategory, ProductUnit } from '@/services/productService'

interface ProductTableProps {
  products: Product[]
  categories: ProductCategory[]
  onEdit: (product: Product) => void
  onToggleUnitStatus: (product: Product, unit: ProductUnit) => void
  // Đã ẩn nút thêm đơn vị và tạo/xem giá theo yêu cầu
  onViewDetail?: (product: Product) => void
}

const ProductTable = ({ products, categories, onEdit, onToggleUnitStatus, onViewDetail }: ProductTableProps) => {

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'Chưa có'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  // HSD đã bỏ khỏi bảng, giữ lại nếu tái sử dụng ở nơi khác

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
      <table className="min-w-full divide-y divide-gray-200 text-xs">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              STT
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Mã SP
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Sản phẩm
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Danh mục
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Đơn vị tính
            </th>
            <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Giá
            </th>

            <th className="px-4 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {buildRows().map(({ product, unit }, index) => (
              <tr key={`${product.id}-${unit ? unit.id : 'nou'}`} className={`hover:bg-gray-50 ${unit && !unit.active ? 'bg-gray-50 opacity-75' : ''}`}>
                <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                  {product.code || 'Chưa có'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-9 w-9">
                      {product.imageUrl ? (
                        <img
                          className="h-9 w-9 rounded-lg object-cover"
                          src={product.imageUrl}
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gray-200 flex items-center justify-center">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-gray-900">{product.name}</div>
                        {unit && (
                          <span className={`px-1.5 py-0.5 text-[10px] rounded-full border ${
                            unit.active
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}>
                            {unit.active ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 max-w-xs truncate">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                  {getCategoryName(product)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">{unit ? unit.unitName : '—'}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                  {formatPrice(unit?.currentPrice)}
                </td>

                <td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {onViewDetail && (
                      <button
                        onClick={() => onViewDetail(product)}
                        className="px-2 py-0.5 text-[11px] bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="Xem chi tiết sản phẩm"
                      >
                        Chi tiết
                      </button>
                    )}
                    {/* Ẩn các nút: "+ Đơn vị" và "Tạo giá/Xem giá" theo yêu cầu */}
                    <button
                      onClick={() => onEdit(product)}
                      className="px-2 py-0.5 text-[11px] bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title="Chỉnh sửa sản phẩm"
                    >
                      Sửa
                    </button>
                    {unit && (
                      <button
                        onClick={() => onToggleUnitStatus(product, unit)}
                        className={`px-2 py-0.5 text-[11px] rounded ${
                          unit.active
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={unit.active ? 'Tạm dừng đơn vị' : 'Kích hoạt đơn vị'}
                      >
                        {unit.active ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    )}
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
