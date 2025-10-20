import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InventoryService } from '../services/inventoryService'
import { ProductService } from '../services/productService'

interface DocumentLine {
  id: number
  productUnitId: number
  quantity: number
  productName?: string
  unitName?: string
}

interface Document {
  id: number
  type: 'INBOUND' | 'OUTBOUND'
  status: string
  referenceNumber?: string
  note?: string
  warehouseId: number
  warehouseName?: string
  createdAt?: string
  updatedAt?: string
  lines?: DocumentLine[]
}

const InventoryImportExportDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(false)
  const [lines, setLines] = useState<DocumentLine[]>([])

  useEffect(() => {
    if (id) {
      loadDocument()
    }
  }, [id])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const documentId = Number(id)

      // Load document info
      const doc = await InventoryService.getDocument(documentId)
      console.log('Document data:', doc)
      setDocument(doc)

      // Load document lines
      const documentLines = await InventoryService.getDocumentLines(documentId)
      console.log('Document lines:', documentLines)

      // Enrich document lines with product and unit names
      const enrichedLines = await Promise.all(
        documentLines.map(async (line) => {
          try {
            // Get product unit details
            const productUnit = await ProductService.getProductUnitById(line.productUnitId)
            if (productUnit) {
              return {
                ...line,
                productName: productUnit.productName || `Product #${line.productUnitId}`,
                unitName: productUnit.unitName || 'N/A'
              }
            }
            return line
          } catch (error) {
            console.error('Error loading product unit details:', error)
            return line
          }
        })
      )

      setLines(enrichedLines)
    } catch (error) {
      console.error('Error loading document:', error)
      alert('Có lỗi xảy ra khi tải chi tiết phiếu: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'Đã duyệt'
      case 'pending':
        return 'Chờ duyệt'
      case 'draft':
        return 'Nháp'
      case 'rejected':
        return 'Từ chối'
      case 'cancelled':
        return 'Hủy'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeText = (type: string) => {
    return type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'
  }

  const getTypeColor = (type: string) => {
    return type === 'INBOUND' ? 'text-blue-600' : 'text-orange-600'
  }

  const handleApprove = async () => {
    if (!document) return

    try {
      await InventoryService.approveDocument(document.id)
      alert('Phiếu đã được chấp nhận!')
      loadDocument() // Reload
    } catch (error) {
      console.error('Error approving document:', error)
      alert('Có lỗi xảy ra khi chấp nhận phiếu: ' + (error as Error).message)
    }
  }

  const handleReject = async () => {
    if (!document) return

    const reason = prompt('Nhập lý do từ chối:')
    if (reason === null) return // User cancelled

    try {
      await InventoryService.rejectDocument(document.id, reason)
      alert('Phiếu đã bị từ chối!')
      loadDocument() // Reload
    } catch (error) {
      console.error('Error rejecting document:', error)
      alert('Có lỗi xảy ra khi từ chối phiếu: ' + (error as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải chi tiết phiếu...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy phiếu</h2>
          <button
            onClick={() => navigate('/admin/inventory-import-export-list')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết phiếu #{document.id}</h1>
            <p className="text-gray-600">
              {getTypeText(document.type)} - {document.referenceNumber || `#${document.id}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/inventory-import-export-list')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Quay lại
            </button>
            {(document.status.toLowerCase() === 'pending' || document.status.toLowerCase() === 'draft') && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Chấp nhận
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Từ chối
                </button>
              </>
            )}
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Thông tin phiếu</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Phiếu</label>
                <p className="text-sm text-gray-900">#{document.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <p className={`text-sm font-medium ${getTypeColor(document.type)}`}>
                  {getTypeText(document.type)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số phiếu</label>
                <p className="text-sm text-gray-900">{document.referenceNumber || `#${document.id}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                  {getStatusText(document.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                <p className="text-sm text-gray-900">
                  {document.createdAt ? new Date(document.createdAt).toLocaleString('vi-VN') : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cập nhật lần cuối</label>
                <p className="text-sm text-gray-900">
                  {document.updatedAt ? new Date(document.updatedAt).toLocaleString('vi-VN') : '-'}
                </p>
              </div>
            </div>
            {document.note && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{document.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Lines */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Danh sách sản phẩm</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn vị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Chưa có sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.productName || `Product Unit #${line.productUnitId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {line.unitName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {line.quantity.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryImportExportDetail
