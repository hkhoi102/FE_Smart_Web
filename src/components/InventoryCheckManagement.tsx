import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { InventoryService, WarehouseDto } from '../services/inventoryService'
import { ProductService } from '../services/productService'

interface InventoryCheck {
  id: number
  check_date: string
  warehouse_id: number
  warehouse_name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
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
  const [loading, setLoading] = useState(false)
  const [notify, setNotify] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const showNotify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotify({ type, message })
    window.clearTimeout((showNotify as any)._t)
    ;(showNotify as any)._t = window.setTimeout(() => setNotify(null), 2500)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | 'all'>('all')

  const mapCheck = (dto: any): InventoryCheck => ({
    id: dto.id,
    check_date: (dto.stocktakingDate ?? dto.checkDate ?? dto.check_date ?? '').replace('T', ' ').substring(0, 19),
    warehouse_id: dto.warehouseId ?? dto.warehouse_id,
    warehouse_name: dto.warehouseName ?? dto.warehouse_name ?? '',
    status: dto.status,
    created_by: dto.createdBy ?? dto.created_by ?? '',
    created_at: dto.createdAt ?? dto.created_at ?? '',
    updated_at: dto.updatedAt ?? dto.updated_at ?? '',
    note: dto.note ?? '',
    total_items: dto.totalItems ?? dto.total_items ?? 0,
    checked_items: dto.checkedItems ?? dto.checked_items ?? 0,
    discrepancy_items: dto.discrepancyItems ?? dto.discrepancy_items ?? 0,
  })

  // If BE returns items later we can map with this util
  const mapItem = (dto: any): CheckItem => ({
    id: dto.id,
    check_id: dto.checkId ?? dto.check_id,
    product_id: dto.productUnitId ?? dto.product_id,
    product_name: dto.productName ?? dto.product_name ?? 'Sản phẩm',
    unit: dto.unitName ?? dto.unit ?? '',
    system_quantity: dto.systemQuantity ?? dto.system_quantity ?? 0,
    actual_quantity: dto.actualQuantity ?? dto.actual_quantity ?? 0,
    difference: dto.difference ?? 0,
    note: dto.note ?? '',
    status: dto.status ?? 'PENDING',
  })

  const loadInitial = async () => {
    setLoading(true)
    try {
      const [whs, checksDto] = await Promise.all([
        InventoryService.getWarehouses(),
        InventoryService.getInventoryChecks().catch(() => []),
      ])
      setWarehouses(whs)
      setChecks(Array.isArray(checksDto) ? checksDto.map(mapCheck) : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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

  const handleAddCheck = () => {
    setEditingCheck(null)
    setFormData({
      check_date: new Date().toISOString().slice(0, 16),
      warehouse_id: '',
      note: '',

    })
    setIsModalOpen(true)
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

  const handleDeleteCheck = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) return
    try {
      await InventoryService.deleteInventoryCheck(id)
      setChecks(prev => prev.filter(check => check.id !== id))
      setCheckItems(prev => prev.filter(item => item.check_id !== id))
    } catch (e) {
      console.error(e)
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
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Kiểm kê kho</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportAllReports}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            📊 Xuất tất cả Excel
          </button>
          <button
            onClick={handleAddCheck}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Tạo phiếu kiểm kê
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng phiếu kiểm</p>
              <p className="text-2xl font-semibold text-gray-900">{checks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Chờ kiểm</p>
              <p className="text-2xl font-semibold text-gray-900">{pendingChecks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Đang kiểm</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgressChecks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Chênh lệch</p>
              <p className="text-2xl font-semibold text-gray-900">{totalDiscrepancies}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo ghi chú, kho hoặc người tạo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ kiểm</option>
            <option value="IN_PROGRESS">Đang kiểm</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Checks Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày kiểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ghi chú
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChecks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {check.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(check.check_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {check.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {check.note}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {getStatusLabel(check.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {check.created_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewItems(check)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Chi tiết
                      </button>
                      {check.status === 'PENDING' && (
                        <button
                          onClick={() => handleStartCheck(check.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Bắt đầu
                        </button>
                      )}
                      {check.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleCompleteCheck(check.id)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Hoàn thành
                        </button>
                      )}
                      <button
                        onClick={() => handleEditCheck(check)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleExportReport(check)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Xuất báo cáo
                      </button>
                      <button
                        onClick={() => handleDeleteCheck(check.id)}
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

                {/* Check Summary */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">Tổng sản phẩm</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedCheck.total_items}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Đã kiểm</div>
                    <div className="text-2xl font-bold text-green-900">{selectedCheck.checked_items}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-red-600">Chênh lệch</div>
                    <div className="text-2xl font-bold text-red-900">{selectedCheck.discrepancy_items}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-600">Tiến độ</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.round((selectedCheck.checked_items / selectedCheck.total_items) * 100)}%
                    </div>
                  </div>
                </div>

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
    </div>
  )
}

export default InventoryCheckManagement
