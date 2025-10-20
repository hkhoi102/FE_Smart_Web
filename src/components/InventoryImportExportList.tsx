import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { InventoryService } from '../services/inventoryService'
import Pagination from './Pagination'

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
}

const InventoryImportExportList = () => {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>()
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

  useEffect(() => {
    loadWarehouses()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [selectedWarehouse])

  const loadWarehouses = async () => {
    try {
      const data = await InventoryService.getWarehouses()
      setWarehouses(data)
    } catch (error) {
      console.error('Error loading warehouses:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const params = selectedWarehouse ? { warehouseId: selectedWarehouse } : undefined
      const data = await InventoryService.listDocuments(params)
      console.log('Documents data:', data)
      // Map data to ensure all required fields are present
      const mappedData = data.map((doc: any) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        referenceNumber: doc.referenceNumber,
        note: doc.note,
        warehouseId: doc.warehouseId || 0, // Default value if missing
        warehouseName: doc.warehouseName,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }))
      setDocuments(mappedData)
    } catch (error) {
      console.error('Error loading documents:', error)
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
        return 'Chờ xác nhận'
      case 'rejected':
        return 'Từ chối'
      case 'cancelled':
        return 'Đã hủy'
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

  const handleViewDetails = (documentId: number) => {
    navigate(`/admin/import-export/${documentId}`)
  }

  const handleApprove = async (documentId: number) => {
    try {
      await InventoryService.approveDocument(documentId)
      alert('Phiếu đã được chấp nhận!')
      loadDocuments() // Reload danh sách
    } catch (error) {
      console.error('Error approving document:', error)
      alert('Có lỗi xảy ra khi chấp nhận phiếu: ' + (error as Error).message)
    }
  }

  const handleReject = async (documentId: number) => {
    const reason = prompt('Nhập lý do từ chối:')
    if (reason === null) return // User cancelled

    try {
      await InventoryService.rejectDocument(documentId, reason)
      alert('Phiếu đã bị từ chối!')
      loadDocuments() // Reload danh sách
    } catch (error) {
      console.error('Error rejecting document:', error)
      alert('Có lỗi xảy ra khi từ chối phiếu: ' + (error as Error).message)
    }
  }


  // Sort documents by status
  const sortedDocuments = sortOrder ? [...documents].sort((a, b) => {
    // Define status priority: approved/completed = 2, pending/draft = 1, rejected/cancelled = 0
    const getStatusPriority = (status: string) => {
      const s = status.toLowerCase()
      if (s === 'approved' || s === 'completed') return 2
      if (s === 'pending' || s === 'draft') return 1
      if (s === 'rejected' || s === 'cancelled') return 0
      return -1
    }
    
    const aPriority = getStatusPriority(a.status)
    const bPriority = getStatusPriority(b.status)
    
    if (sortOrder === 'asc') {
      return aPriority - bPriority // cancelled first, then pending, then approved
    } else {
      return bPriority - aPriority // approved first, then pending, then cancelled
    }
  }) : documents

  // Pagination logic
  const itemsPerPage = 10
  const totalItems = sortedDocuments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocuments = sortedDocuments.slice(startIndex, endIndex)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách phiếu nhập xuất</h1>
            <p className="text-gray-600">Quản lý các phiếu nhập xuất hàng</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <select
                value={selectedWarehouse || ''}
                onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả kho</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => navigate('/admin/inventory-import-export')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Tạo phiếu mới
            </button>
          </div>
        </div>

        {/* Filters moved into header */}

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Danh sách phiếu</h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có phiếu nào</h3>
              <p className="mt-1 text-sm text-gray-500">Hãy tạo phiếu nhập xuất đầu tiên.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số phiếu
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ghi chú
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{document.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getTypeColor(document.type)}`}>
                          {getTypeText(document.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {document.referenceNumber || `#${document.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                          {getStatusText(document.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {document.createdAt ? new Date(document.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {document.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(document.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Chi tiết
                          </button>
                          {(document.status.toLowerCase() === 'pending' || document.status.toLowerCase() === 'draft') && (
                            <>
                              <button
                                onClick={() => handleApprove(document.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleReject(document.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryImportExportList
