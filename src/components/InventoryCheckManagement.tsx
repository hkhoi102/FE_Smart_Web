import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { InventoryService, WarehouseDto } from '../services/inventoryService'
import { ProductService } from '../services/productService'
import Pagination from './Pagination'

interface InventoryCheck {
  id: number
  check_date: string
  warehouse_id: number
  warehouse_name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED'
  created_by: string
  created_at: string
  updated_at: string
  note: string
  total_items: number
  checked_items: number
  discrepancy_items: number
}

interface CheckItem {
  id: number
  check_id: number
  product_id: number
  product_name: string
  unit: string
  system_quantity: number
  actual_quantity: number
  difference: number
  note: string
  status: 'PENDING' | 'CHECKED' | 'DISCREPANCY'
}

interface ProductUnit {
  id: number
  productId: number
  productName: string
  unitName: string
  systemQuantity?: number
}

const InventoryCheckManagement = () => {
  const navigate = useNavigate()
  const [checks, setChecks] = useState<InventoryCheck[]>([])
  const [checkItems, setCheckItems] = useState<CheckItem[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingCheck, setEditingCheck] = useState<InventoryCheck | null>(null)
  const [selectedCheck, setSelectedCheck] = useState<InventoryCheck | null>(null)
  const [formData, setFormData] = useState({
    check_date: '',
    warehouse_id: '',
    note: ''
  })
  const [itemFormData, setItemFormData] = useState({
    product_id: '',
    actual_quantity: '',
    note: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotify({ type, message })
    window.clearTimeout((showNotify as any)._t)
    ;(showNotify as any)._t = window.setTimeout(() => setNotify(null), 2500)
  }

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellingCheckId, setCancellingCheckId] = useState<number | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | 'all'>('all')
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [currentPage, setCurrentPage] = useState(1)

  const mapCheck = (dto: any): InventoryCheck => {
    console.log('🔍 Mapping check dto:', dto)
    console.log('🔍 Created by fields:', {
      createdBy: dto.createdBy,
      created_by: dto.created_by,
      created_by_username: dto.created_by_username,
      createdByUsername: dto.createdByUsername
    })
    return {
      id: dto.id,
      check_date: (dto.stocktakingDate ?? dto.checkDate ?? dto.check_date ?? '').replace('T', ' ').substring(0, 19),
      warehouse_id: dto.warehouseId ?? dto.warehouse_id,
      warehouse_name: dto.warehouseName ?? dto.warehouse_name ?? '',
      status: dto.status,
      created_by: dto.createdByUsername ?? dto.createdBy ?? dto.created_by ?? dto.created_by_username ?? 'Chưa xác định',
      created_at: dto.createdAt ?? dto.created_at ?? '',
      updated_at: dto.updatedAt ?? dto.updated_at ?? '',
      note: dto.note ?? '',
      total_items: dto.totalItems ?? dto.total_items ?? 0,
      checked_items: dto.checkedItems ?? dto.checked_items ?? 0,
      discrepancy_items: dto.discrepancyItems ?? dto.discrepancy_items ?? 0,
    }
  }

  // If BE returns items later we can map with this util
  // const mapItem = (dto: any): CheckItem => ({
  //   id: dto.id,
  //   check_id: dto.checkId ?? dto.check_id,
  //   product_id: dto.productUnitId ?? dto.product_id,
  //   product_name: dto.productName ?? dto.product_name ?? 'Sản phẩm',
  //   unit: dto.unitName ?? dto.unit ?? '',
  //   system_quantity: dto.systemQuantity ?? dto.system_quantity ?? 0,
  //   actual_quantity: dto.actualQuantity ?? dto.actual_quantity ?? 0,
  //   difference: dto.difference ?? 0,
  //   note: dto.note ?? '',
  //   status: dto.status ?? 'PENDING',
  // })

  const loadInitial = async () => {
    try {
      const [whs, checksDto] = await Promise.all([
        InventoryService.getWarehouses(),
        InventoryService.getInventoryChecks().catch(() => []),
      ])
      setWarehouses(whs)
      const mapped = Array.isArray(checksDto) ? checksDto.map(mapCheck) : []
      // Ensure warehouse_name is populated using loaded warehouses if missing
      const idToName = new Map<number, string>(whs.map(w => [w.id, w.name]))
      const enriched = mapped.map(c => ({
        ...c,
        warehouse_name: c.warehouse_name || idToName.get(c.warehouse_id) || ''
      }))
      setChecks(enriched)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadInitial()
  }, [])

  const filteredChecks = checks.filter(check => {
    const matchesSearch = check.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         check.created_by.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter
    const matchesWarehouse = warehouseFilter === 'all' || check.warehouse_id === warehouseFilter
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  // Pagination logic
  const itemsPerPage = 10
  const totalItems = filteredChecks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedChecks = filteredChecks.slice(startIndex, endIndex)

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, warehouseFilter])

  const handleAddCheck = () => {
    navigate({ pathname: '/admin', search: '?tab=inventory-check-create' })
  }

  const handleEditCheck = (check: InventoryCheck) => {
    setEditingCheck(check)
    setFormData({
      check_date: check.check_date.slice(0, 16),
      warehouse_id: check.warehouse_id.toString(),
      note: check.note
    })
    setIsModalOpen(true)
  }

  const handleViewItems = async (check: InventoryCheck) => {
    setSelectedCheck(check)
    setIsItemModalOpen(true)
    try {
      // Load details from API
      const details = await InventoryService.getInventoryCheckDetails(check.id)
      const mapped = (details.items || []).map((it: any) => ({
        id: it.id ?? Date.now() + Math.random(),
        check_id: check.id,
        product_id: it.productUnitId,
        product_name: it.productName ?? 'Sản phẩm',
        unit: it.unitName ?? '',
        system_quantity: it.systemQuantity ?? 0,
        actual_quantity: it.actualQuantity ?? 0,
        difference: (it.actualQuantity ?? 0) - (it.systemQuantity ?? 0),
        note: it.note ?? '',
        status: (it.status ?? ((it.actualQuantity ?? 0) === (it.systemQuantity ?? 0) ? 'CHECKED' : 'DISCREPANCY')),
      }))
      setCheckItems(mapped)

      const stock = await InventoryService.getStock({ warehouseId: check.warehouse_id }).catch(() => [])
      // Build product unit list from stock and enrich names
      const units: ProductUnit[] = []
      for (const s of stock as any[]) {
        const pid = s.productUnitId ?? s.product_unit_id
        if (!pid) continue
        const enriched = await ProductService.getProductUnitById(Number(pid)).catch(() => null)
        units.push({
          id: Number(pid),
          productId: enriched?.productId ?? 0,
          productName: enriched?.productName ?? `PU#${pid}`,
          unitName: enriched?.unitName ?? '',
          systemQuantity: s.quantity ?? 0,
        })
      }
      setProductUnits(units)
    } catch (e) {
      console.error(e)
    }
  }


  const handleEditCheckItem = (item: CheckItem) => {
    setItemFormData({
      product_id: item.product_id.toString(),
      actual_quantity: item.actual_quantity.toString(),
      note: item.note
    })
    // Logic to edit check item
  }

  const handleSaveCheckItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemFormData.product_id || !itemFormData.actual_quantity) {
      showNotify('Vui lòng điền đầy đủ thông tin sản phẩm', 'error')
      return
    }

    if (!selectedCheck) return

    setIsSubmitting(true)
    try {
      const pu = productUnits.find(p => p.id === parseInt(itemFormData.product_id))
      const systemQuantity = pu?.systemQuantity ?? 0
      const actualQuantity = parseInt(itemFormData.actual_quantity)
      const difference = actualQuantity - systemQuantity
      const newItem: CheckItem = {
        id: Date.now(),
        check_id: selectedCheck.id,
        product_id: parseInt(itemFormData.product_id),
        product_name: pu?.productName ?? 'Sản phẩm',
        unit: pu?.unitName ?? '',
        system_quantity: systemQuantity,
        actual_quantity: actualQuantity,
        difference,
        note: itemFormData.note,
        status: difference === 0 ? 'CHECKED' : 'DISCREPANCY'
      }
      setCheckItems(prev => [...prev, newItem])
      setItemFormData({ product_id: '', actual_quantity: '', note: '' })
      showNotify('Đã thêm sản phẩm vào phiếu kiểm kê', 'success')
    } catch (e) {
      console.error(e)
      showNotify('Không thể thêm sản phẩm. Vui lòng thử lại', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCheck(null)
    setFormData({
      check_date: '',
      warehouse_id: '',
      note: ''
    })
  }

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false)
    setSelectedCheck(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.check_date || !formData.warehouse_id || !formData.note) {
      showNotify('Vui lòng điền đầy đủ thông tin phiếu kiểm kê', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      if (!editingCheck) {
        // Choose first stock location of warehouse as default
        const stockLocations = await InventoryService.getStockLocations(parseInt(formData.warehouse_id)).catch(() => []) as any[]
        const stockLocationId = (stockLocations?.[0]?.id) || 1
        await InventoryService.createInventoryCheck({
          stocktakingDate: formData.check_date,
          warehouseId: parseInt(formData.warehouse_id),
          stockLocationId,
          note: formData.note,
        })
        showNotify('Tạo phiếu kiểm kê thành công', 'success')
      } else {
        // No dedicated update endpoint per spec; re-create not ideal, so skip
      }
      const dto = await InventoryService.getInventoryChecks()
      setChecks(dto.map(mapCheck))
      handleCloseModal()
    } catch (e) {
      console.error(e)
      showNotify('Có lỗi khi tạo phiếu kiểm kê', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelCheck = (id: number) => {
    setCancellingCheckId(id)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!cancellingCheckId) return

    try {
      const reasonText = cancelReason ? `Lý do hủy: ${cancelReason}` : 'Đã hủy phiếu kiểm kê'
      await InventoryService.cancelInventoryCheck(cancellingCheckId, reasonText)
      setChecks(prev => prev.map(check =>
        check.id === cancellingCheckId ? { ...check, status: 'CANCELLED', note: reasonText } : check
      ))
      showNotify('Đã hủy phiếu kiểm kê thành công', 'success')
      setCancelModalOpen(false)
      setCancellingCheckId(null)
      setCancelReason('')
    } catch (e) {
      console.error(e)
      showNotify('Hủy phiếu kiểm kê thất bại', 'error')
    }
  }

  const handleStartCheck = async (id: number) => {
    setChecks(prev => prev.map(check => check.id === id ? { ...check, status: 'IN_PROGRESS' } : check))
  }

  const handleCompleteCheck = async (id: number) => {
    try {
      const itemsPayload = checkItems
        .filter(i => i.check_id === id)
        .map(i => ({
          productUnitId: i.product_id,
          systemQuantity: i.system_quantity,
          actualQuantity: i.actual_quantity,
          note: i.note,
        }))
      await InventoryService.confirmInventoryCheck(id, itemsPayload)
      setChecks(prev => prev.map(check => check.id === id ? { ...check, status: 'COMPLETED' } : check))
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportReport = async (check: InventoryCheck) => {
    try {
      await InventoryService.exportStocktakingExcel(check.id)
    } catch (e) {
      console.error(e)
    }
  }

  // CSV export removed per BE offering direct Excel endpoint

  const handleExportAllReports = () => {
    // Create Excel workbook with all checks
    const workbook = XLSX.utils.book_new()

    // Create summary sheet for all checks (horizontal layout)
    const allChecksData = [
      ['BÁO CÁO TỔNG HỢP KIỂM KÊ KHO'],
      [''],
      ['Thống kê tổng quan:'],
      ['Tổng phiếu kiểm', 'Chờ kiểm', 'Đang kiểm', 'Hoàn thành', 'Tổng chênh lệch'],
      [checks.length, pendingChecks, inProgressChecks, checks.filter(c => c.status === 'COMPLETED').length, totalDiscrepancies],
      [''],
      ['Danh sách phiếu kiểm kê:'],
      ['ID', 'Kho', 'Ngày kiểm', 'Trạng thái', 'Tổng SP', 'Đã kiểm', 'Chênh lệch', 'Người tạo'],
      ...checks.map(check => [
        check.id,
        check.warehouse_name,
        check.check_date,
        getStatusLabel(check.status),
        check.total_items,
        check.checked_items,
        check.discrepancy_items,
        check.created_by
      ])
    ]

    const allChecksSheet = XLSX.utils.aoa_to_sheet(allChecksData)
    allChecksSheet['!cols'] = [
      { wch: 8 },  // ID
      { wch: 20 }, // Kho
      { wch: 20 }, // Ngày kiểm
      { wch: 15 }, // Trạng thái
      { wch: 10 }, // Tổng SP
      { wch: 10 }, // Đã kiểm
      { wch: 10 }, // Chênh lệch
      { wch: 15 }  // Người tạo
    ]
    XLSX.utils.book_append_sheet(workbook, allChecksSheet, 'Tổng hợp')

    // Create individual sheets for each check
    checks.forEach(check => {
      const checkItemsForReport = checkItems.filter(item => item.check_id === check.id)

      const checkData = [
        [`PHIẾU KIỂM KÊ #${check.id}`],
        [''],
        ['Thông tin phiếu:'],
        ['Kho', 'Ngày kiểm', 'Người tạo', 'Ghi chú'],
        [check.warehouse_name, check.check_date, check.created_by, check.note],
        [''],
        ['Thống kê:'],
        ['Tổng sản phẩm', 'Đã kiểm', 'Chênh lệch'],
        [check.total_items, check.checked_items, check.discrepancy_items],
        [''],
        ['Chi tiết sản phẩm:'],
        ['Sản phẩm', 'Đơn vị', 'Tồn hệ thống', 'Thực tế', 'Chênh lệch', 'Ghi chú', 'Trạng thái'],
        ...checkItemsForReport.map(item => [
          item.product_name,
          item.unit,
          item.system_quantity,
          item.actual_quantity,
          item.difference,
          item.note,
          item.status === 'CHECKED' ? 'Đã kiểm' : item.status === 'DISCREPANCY' ? 'Chênh lệch' : 'Chờ kiểm'
        ])
      ]

      const checkSheet = XLSX.utils.aoa_to_sheet(checkData)
      checkSheet['!cols'] = [
        { wch: 20 }, // Sản phẩm
        { wch: 10 }, // Đơn vị
        { wch: 15 }, // Tồn hệ thống
        { wch: 15 }, // Thực tế
        { wch: 15 }, // Chênh lệch
        { wch: 30 }, // Ghi chú
        { wch: 15 }  // Trạng thái
      ]

      XLSX.utils.book_append_sheet(workbook, checkSheet, `Phiếu ${check.id}`)
    })

    // Download Excel file
    const fileName = `BaoCaoTongHopKiemKe_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ kiểm'
      case 'IN_PROGRESS': return 'Đang kiểm'
      case 'COMPLETED': return 'Hoàn thành'
      case 'CANCELLED': return 'Đã hủy'
      case 'CONFIRMED': return 'Hoàn thành'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingChecks = checks.filter(c => c.status === 'PENDING').length
  const inProgressChecks = checks.filter(c => c.status === 'IN_PROGRESS').length
  const totalDiscrepancies = checks.reduce((sum, c) => sum + c.discrepancy_items, 0)

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notify && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow text-sm text-white ${
          notify.type === 'success' ? 'bg-green-600' : notify.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {notify.message}
        </div>
      )}
      {/* Header with inline filters (filters sit to the left of Export button) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Kiểm kê kho</h2>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Filters group */}
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả kho</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ kiểm</option>
            <option value="IN_PROGRESS">Đang kiểm</option>
            <option value="CONFIRMED">Hoàn thành</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          {/* Action buttons on the far right */}
          <button
            onClick={handleExportAllReports}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium"
          >
            📊 Xuất tất cả Excel
          </button>
          <button
            type="button"
            onClick={handleAddCheck}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium"
          >
            Tạo phiếu kiểm kê
          </button>
        </div>
      </div>

      {/* Stats Cards removed per request */}

      {/* Filters moved inline with header */}

      {/* Checks Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kiểm
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-900">
                    {check.id}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(check.check_date)}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {check.warehouse_name}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-900">
                    {check.note}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {getStatusLabel(check.status)}
                    </span>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm text-gray-500">
                    {check.created_by}
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewItems(check)}
                        className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {(check.status === 'COMPLETED' || check.status === 'CONFIRMED') ? 'Chi tiết' : 'Kiểm kê'}
                      </button>
                      <button
                        onClick={() => handleEditCheck(check)}
                        className="px-2.5 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        Sửa
                      </button>
                      {(check.status !== 'COMPLETED' && check.status !== 'CONFIRMED' && check.status !== 'CANCELLED') && (
                        <button
                          onClick={() => handleCancelCheck(check.id)}
                          className="px-2.5 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Hủy phiếu
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {check.status === 'PENDING' && (
                        <button
                          onClick={() => handleStartCheck(check.id)}
                          className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Bắt đầu
                        </button>
                      )}
                      {check.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleCompleteCheck(check.id)}
                          className="px-2.5 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                        >
                          Hoàn thành
                        </button>
                      )}
                      {(check.status === 'CONFIRMED' || check.status === 'COMPLETED') && (
                        <button
                          onClick={() => handleExportReport(check)}
                          className="px-2.5 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Xuất Excel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Check Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCheck ? 'Chỉnh sửa phiếu kiểm kê' : 'Tạo phiếu kiểm kê mới'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kiểm kê *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.check_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kho *
                      </label>
                      <select
                        value={formData.warehouse_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Chọn kho</option>
                        {warehouses.map(warehouse => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú *
                    </label>
                    <textarea
                      value={formData.note}
                      onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Nhập ghi chú cho phiếu kiểm kê"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Người tạo lấy từ JWT, không nhập tay */}
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
                    {isSubmitting ? 'Đang lưu...' : (editingCheck ? 'Cập nhật' : 'Tạo')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Check Items Modal */}
      {isItemModalOpen && selectedCheck && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseItemModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết kiểm kê - Phiếu #{selectedCheck.id}
                </h3>
                <button
                  onClick={handleCloseItemModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Add Item Form */}
                {selectedCheck.status === 'IN_PROGRESS' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Thêm sản phẩm kiểm kê</h4>
                    <form onSubmit={handleSaveCheckItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sản phẩm *
                        </label>
                        <select
                          value={itemFormData.product_id}
                          onChange={(e) => setItemFormData(prev => ({ ...prev, product_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          <option value="">Chọn sản phẩm</option>
                          {productUnits.map(pu => (
                            <option key={pu.id} value={pu.id}>
                              {pu.productName} ({pu.unitName}) - Tồn: {pu.systemQuantity ?? 0}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số lượng thực tế *
                        </label>
                        <input
                          type="number"
                          value={itemFormData.actual_quantity}
                          onChange={(e) => setItemFormData(prev => ({ ...prev, actual_quantity: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ghi chú
                        </label>
                        <input
                          type="text"
                          value={itemFormData.note}
                          onChange={(e) => setItemFormData(prev => ({ ...prev, note: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Ghi chú kiểm kê"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Đang lưu...' : 'Thêm'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Summary removed per request */}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tồn hệ thống
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thực tế
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chênh lệch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ghi chú
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
                      {checkItems.filter(item => item.check_id === selectedCheck.id).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                              <div className="text-sm text-gray-500">{item.unit}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.system_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.actual_quantity}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                            item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.note}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'CHECKED' ? 'bg-green-100 text-green-800' :
                              item.status === 'DISCREPANCY' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status === 'CHECKED' ? 'Đã kiểm' :
                               item.status === 'DISCREPANCY' ? 'Chênh lệch' : 'Chờ kiểm'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditCheckItem(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi phiếu kiểm kê?')) {
                                    setCheckItems(prev => prev.filter(i => i.id !== item.id))
                                  }
                                }}
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
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hủy phiếu kiểm kê</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy (tùy chọn)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Nhập lý do hủy phiếu kiểm kê..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCancelModalOpen(false)
                    setCancellingCheckId(null)
                    setCancelReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Xác nhận hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryCheckManagement
