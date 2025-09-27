import { useState, useEffect } from 'react'
import { InventoryService, type WarehouseDto, type StockLocationDto, type StockBalanceDto } from '@/services/inventoryService'
import { ProductService } from '@/services/productService'
import InventoryCheckManagement from './InventoryCheckManagement'

interface Warehouse {
  id: number
  name: string
  address: string
  phone: string
  contact_person: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

interface InventoryItem {
  id: number
  productId: number
  productName: string
  category: string
  unit: string
  warehouseId: number
  warehouseName: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  totalValue: number
  lastUpdated: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

const InventoryManagement = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<StockLocationDto[]>([])
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'CREATE' | 'CHECK'>('HISTORY')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  // removed unused editingItem
  const [txnType, setTxnType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [formData, setFormData] = useState({
    productUnitId: '',
    warehouseId: '',
    stockLocationId: '',
    quantity: '',
    referenceNumber: '',
    note: ''
  })
  // Document-based flow
  const [documentId, setDocumentId] = useState<number | null>(null)
  const [lineInputs, setLineInputs] = useState<Array<{ productUnitId: string; quantity: string; productText?: string; productId?: number; unitOptions?: Array<{ id: number; name: string }>; }>>([{ productUnitId: '', quantity: '', productText: '' }])
  const [documentLines, setDocumentLines] = useState<Array<{ id: number; productUnitId: number; quantity: number }>>([])
  const [docList, setDocList] = useState<Array<{ id: number; type: 'INBOUND' | 'OUTBOUND'; status?: string; createdAt?: string }>>([])
  // removed old searchResults (replaced by dropdown products)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailDoc, setDetailDoc] = useState<any | null>(null)
  const [detailLines, setDetailLines] = useState<Array<{ id: number; productUnitId: number; quantity: number; productName?: string; unitName?: string }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [productOptions, setProductOptions] = useState<Array<{ id: number; name: string }>>([])

  const getDocumentStatusLabel = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'DRAFT':
        return 'Chờ duyệt'
      case 'APPROVED':
        return 'Đã duyệt'
      case 'REJECTED':
        return 'Đã từ chối'
      case 'PENDING':
        return 'Đang xử lý'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status || '-'
    }
  }

  const getDocumentStatusClass = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'DRAFT':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
      case 'APPROVED':
        return 'bg-green-50 text-green-700 ring-1 ring-green-200'
      case 'REJECTED':
        return 'bg-red-50 text-red-700 ring-1 ring-red-200'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
      default:
        return 'bg-gray-50 text-gray-600 ring-1 ring-gray-200'
    }
  }

  const handleRejectClick = (docId: number) => {
    setRejectingDocId(docId)
    setRejectReason('')
    setRejectModalOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectingDocId) return

    try {
      await InventoryService.rejectDocument(rejectingDocId, rejectReason || undefined)
      setNotify({ type: 'success', message: `Đã từ chối phiếu #${rejectingDocId}` })
      const list = await InventoryService.listDocuments({})
      setDocList(list as any)
      setRejectModalOpen(false)
      setRejectingDocId(null)
      setRejectReason('')
    } catch (e: any) {
      setNotify({ type: 'error', message: e?.message || 'Từ chối phiếu thất bại' })
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        console.log('🔄 Loading inventory data...')
        const [whs, stocks] = await Promise.all([
          InventoryService.getWarehouses(),
          InventoryService.getStock(),
        ])
        console.log('📦 Warehouses loaded:', whs)
        console.log('📊 Stock data loaded:', stocks)
        setWarehouses(
          whs.map(w => ({
            id: w.id,
            name: w.name,
            address: w.address || '',
            phone: w.phone || '',
            contact_person: (w as any).manager || null,
            description: (w as any).description || null,
            active: w.active,
            created_at: (w as any).createdAt || '',
            updated_at: (w as any).updatedAt || '',
          }))
        )
        // Map stock rows into UI inventory rows (best-effort; BE may not return names)
        const mapped: InventoryItem[] = await Promise.all((stocks as StockBalanceDto[]).map(async (s, idx) => {
          let productName = s.productName as string | undefined
          let unitName = s.unitName as string | undefined
          if (!productName || !unitName) {
            const detail = await ProductService.getProductUnitById(s.productUnitId)
            productName = productName || detail?.productName || `PU#${s.productUnitId}`
            unitName = unitName || detail?.unitName || '-'
          }
          return {
            id: s.id ?? idx + 1,
            productId: s.productUnitId,
            productName,
            category: '-',
            unit: unitName,
            warehouseId: s.warehouseId,
            warehouseName: s.warehouseName || `Kho #${s.warehouseId}`,
            currentStock: s.quantity,
            minStock: 0,
            maxStock: 0,
            unitPrice: 0,
            totalValue: 0,
            lastUpdated: s.updatedAt || '',
            status: s.quantity === 0 ? 'out_of_stock' : 'in_stock',
          }
        }))
        setInventory(mapped)
        } catch (e) {
          console.error('❌ Error loading inventory data:', e)
          // Show error notification instead of falling back to mock
          setNotify({ type: 'error', message: 'Không thể tải dữ liệu kho. Vui lòng thử lại.' })
          setInventory([])
          setWarehouses([])
        }
    }
    load()
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.warehouseName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse
    return matchesSearch && matchesStatus && matchesWarehouse
  })

  const handleAddItem = () => {
    setFormData({
      productUnitId: '',
      warehouseId: '',
      stockLocationId: '',
      quantity: '',
      referenceNumber: '',
      note: ''
    })
    setTxnType('INBOUND')
    setIsModalOpen(true)
    // Load first-page products for dropdown
    ;(async ()=>{
      try {
        const res = await ProductService.getProducts(1, 50)
        setProductOptions(res.products.map(p => ({ id: p.id, name: p.name })))
      } catch {}
    })()
  }

  // removed unused handleEditItem

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      productUnitId: '',
      warehouseId: '',
      stockLocationId: '',
      quantity: '',
      referenceNumber: '',
      note: ''
    })
    setDocumentId(null)
    setLineInputs([{ productUnitId: '', quantity: '' }])
    setDocumentLines([])
  }

  // Load documents when switching to CREATE tab
  useEffect(() => {
    (async () => {
      if (activeTab === 'CREATE') {
        try {
          const list = await InventoryService.listDocuments({})
          setDocList(list as any)
        } catch { setDocList([]) }
      }
    })()
  }, [activeTab])

  // removed old handleSubmit (flow replaced by document create + bulk lines)

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'Còn hàng'
      case 'low_stock': return 'Sắp hết'
      case 'out_of_stock': return 'Hết hàng'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventory.filter(item => item.status === 'low_stock').length
  const outOfStockItems = inventory.filter(item => item.status === 'out_of_stock').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý kho</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              // quick refresh from BE
              const [whs, stocks] = await Promise.all([
                InventoryService.getWarehouses(),
                InventoryService.getStock(),
              ])
              setWarehouses(
                (whs as any).map((w: WarehouseDto) => ({
                  id: w.id,
                  name: w.name,
                  address: (w as any).address || '',
                  phone: (w as any).phone || '',
                  contact_person: (w as any).manager || null,
                  description: (w as any).description || null,
                  active: w.active,
                  created_at: (w as any).createdAt || '',
                  updated_at: (w as any).updatedAt || '',
                }))
              )
              const mapped: InventoryItem[] = await Promise.all((stocks as StockBalanceDto[]).map(async (s, idx) => {
                let productName = s.productName as string | undefined
                let unitName = s.unitName as string | undefined
                if (!productName || !unitName) {
                  const detail = await ProductService.getProductUnitById(s.productUnitId)
                  productName = productName || detail?.productName || `PU#${s.productUnitId}`
                  unitName = unitName || detail?.unitName || '-'
                }
                return {
                  id: s.id ?? idx + 1,
                  productId: s.productUnitId,
                  productName,
                  category: '-',
                  unit: unitName,
                  warehouseId: s.warehouseId,
                  warehouseName: s.warehouseName || `Kho #${s.warehouseId}`,
                  currentStock: s.quantity,
                  minStock: 0,
                  maxStock: 0,
                  unitPrice: 0,
                  totalValue: 0,
                  lastUpdated: s.updatedAt || '',
                  status: s.quantity === 0 ? 'out_of_stock' : 'in_stock',
                }
              }))
              setInventory(mapped)
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Làm mới
          </button>
          {activeTab==='CREATE' && (
            <button
              onClick={() => { setActiveTab('CREATE'); handleAddItem() }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Tạo phiếu nhập/xuất
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='HISTORY' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Số lượng sản phẩm
          </button>
          <button
            onClick={() => { setActiveTab('CREATE') }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='CREATE' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Tạo phiếu nhập xuất hàng
          </button>
          <button
            onClick={() => { setActiveTab('CHECK') }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab==='CHECK' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Kiểm kê
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold text-gray-900">{inventory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tổng giá trị</p>
              <p className="text-2xl font-semibold text-gray-900">{formatPrice(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sắp hết</p>
              <p className="text-2xl font-semibold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hết hàng</p>
              <p className="text-2xl font-semibold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, danh mục hoặc kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="flex space-x-2">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
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
            <option value="in_stock">Còn hàng</option>
            <option value="low_stock">Sắp hết</option>
            <option value="out_of_stock">Hết hàng</option>
          </select>
        </div>
      </div>

      {/* Inventory Table (History tab) */}
      {activeTab==='HISTORY' && (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      <div className="text-sm text-gray-500">{item.unit}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.warehouseName}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {item.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Documents list under Create tab */}
      {activeTab==='CREATE' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Danh sách phiếu gần đây</h3>
            <button className="text-sm text-gray-600 hover:text-gray-900" onClick={async ()=>{ try{ const list = await InventoryService.listDocuments({}); setDocList(list as any) } catch{} }}>Làm mới</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Duyệt/Từ chối</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {docList.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">#{d.id}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{d.type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusClass(d.status)}`}>
                        {getDocumentStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">{d.createdAt ? new Date(d.createdAt).toLocaleString('vi-VN') : '-'}</td>
                    <td className="px-6 py-3 text-sm text-center">
                      {(['DRAFT','PENDING'].includes((d.status || '').toUpperCase())) ? (
                        <div className="inline-flex gap-2">
                          <button className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={async ()=>{ try{ await InventoryService.approveDocument(d.id); setNotify({ type: 'success', message: `Đã duyệt phiếu #${d.id}` }); const list = await InventoryService.listDocuments({}); setDocList(list as any) } catch(e:any){ setNotify({ type: 'error', message: e?.message || 'Duyệt phiếu thất bại' }) } }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                            Duyệt
                          </button>
                          <button className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700" onClick={() => handleRejectClick(d.id)}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-right">
                      <div className="inline-flex gap-2">
                        <button className="px-3 py-1 text-xs bg-gray-100 rounded" onClick={async ()=>{ try{ const doc = await InventoryService.getDocument(d.id); let lines = await InventoryService.getDocumentLines(d.id); try { lines = await Promise.all(lines.map(async (ln:any)=>{ const unit = await ProductService.getProductUnitById(ln.productUnitId); return { ...ln, productName: unit?.productName, unitName: unit?.unitName } })) } catch{} setDetailDoc(doc); setDetailLines(lines); setDetailOpen(true) } catch{} }}>Chi tiết</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {docList.length === 0 && (<tr><td colSpan={4} className="px-6 py-4 text-sm text-gray-500">Chưa có phiếu</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notify && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setNotify(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full">
              <div className="p-6">
                <div className={`flex items-center ${notify.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  <div className="flex-shrink-0">
                    {notify.type === 'error' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{notify.message}</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setNotify(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create transaction modal */}
      {isModalOpen && activeTab==='CREATE' && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal}></div>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
              <div className={`relative bg-white rounded-lg shadow-xl w-full ${documentId ? 'max-w-5xl' : 'max-w-md'}`}>
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {txnType === 'INBOUND' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất'}
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

              <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại giao dịch
                      </label>
                      <select
                        value={txnType}
                        onChange={(e) => setTxnType(e.target.value === 'INBOUND' ? 'INBOUND' : 'OUTBOUND')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="INBOUND">Nhập kho</option>
                        <option value="OUTBOUND">Xuất kho</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kho *
                      </label>
                      <select
                        value={formData.warehouseId}
                        onChange={async (e) => {
                          const warehouseId = e.target.value
                          setFormData(prev => ({ ...prev, warehouseId, stockLocationId: '' }))
                          if (warehouseId) {
                            try {
                              const locs = await InventoryService.getStockLocations(Number(warehouseId))
                              setLocations(locs)
                            } catch {}
                          } else {
                            setLocations([])
                          }
                        }}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vị trí kho *
                      </label>
                      <select
                        value={formData.stockLocationId}
                        onChange={(e) => setFormData(prev => ({ ...prev, stockLocationId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Chọn vị trí</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số tham chiếu
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="VD: NK-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        value={formData.note}
                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder=""
                      />
                    </div>
                  </div>
                  {/* Actions for document step */}
                  <div className="flex justify-end space-x-3 mt-2">
                    {!documentId && (
                      <button
                        type="button"
                        disabled={isSubmitting || !formData.warehouseId || !formData.stockLocationId}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                        onClick={async () => {
                          try {
                            setIsSubmitting(true)
                            const created = await InventoryService.createDocument({
                              type: txnType,
                              warehouseId: Number(formData.warehouseId),
                              stockLocationId: Number(formData.stockLocationId),
                              referenceNumber: formData.referenceNumber || undefined,
                              note: formData.note || undefined,
                            })
                            setDocumentId(created?.id)
                            setNotify({ type: 'success', message: `Đã tạo phiếu #${created?.id}` })
                          } catch (e:any) {
                            setNotify({ type: 'error', message: e?.message || 'Tạo phiếu thất bại' })
                          } finally { setIsSubmitting(false) }
                        }}
                      >Tạo phiếu</button>
                    )}
                  </div>
                </div>

                {/* Step 2: Add lines */}
                {documentId && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-900">Thêm sản phẩm cho phiếu #{documentId}</div>
                    {lineInputs.map((ln, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-start">
                        <div className="col-span-2">
                          <select
                            value={String(ln.productId || '')}
                            onChange={async (e)=> {
                              const pid = Number(e.target.value)
                              setLineInputs(prev => prev.map((x,idx)=> idx===i? { ...x, productId: pid }: x))
                              if (pid) {
                                try {
                                  const detail = await ProductService.getProductById(pid)
                                  const units = (detail.productUnits || []).map((u:any)=> ({ id: u.id, name: u.unitName }))
                                  const firstUnit = units[0]?.id ? String(units[0].id) : ''
                                  setLineInputs(prev => prev.map((x,idx)=> idx===i? { ...x, unitOptions: units, productUnitId: firstUnit }: x))
                                } catch {}
                              } else {
                                setLineInputs(prev => prev.map((x,idx)=> idx===i? { ...x, unitOptions: [], productUnitId: '' }: x))
                              }
                            }}
                            className="w-full px-2 py-2 border rounded"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {productOptions.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={ln.productUnitId}
                            onChange={(e)=> setLineInputs(prev=> prev.map((x,idx)=> idx===i? { ...x, productUnitId: e.target.value }: x))}
                            className="w-full px-2 py-2 border rounded"
                          >
                            <option value="">-- Chọn đơn vị --</option>
                            {(ln.unitOptions || []).map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <input type="number" placeholder="Số lượng" value={ln.quantity} onChange={(e)=> setLineInputs(prev=> prev.map((x,idx)=> idx===i? { ...x, quantity: e.target.value }: x))} className="px-2 py-2 border rounded" />
                        <div className="flex gap-2">
                          <button type="button" className="px-3 py-2 text-xs bg-gray-100 rounded" onClick={()=> setLineInputs(prev=> [...prev, { productUnitId: '', quantity: '' }])}>+ Dòng</button>
                          {lineInputs.length > 1 && (
                            <button type="button" className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded" onClick={()=> setLineInputs(prev=> prev.filter((_,idx)=> idx!==i))}>Xóa</button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end gap-2">
                      <button type="button" className="px-4 py-2 text-sm border rounded" onClick={async ()=>{
                        try {
                          const payload = lineInputs
                            .map(l => ({ productUnitId: Number(l.productUnitId), quantity: Number(l.quantity) }))
                            .filter(l => l.productUnitId>0 && l.quantity>0)
                          if (payload.length === 0) return
                          await InventoryService.addDocumentLinesBulk(documentId, payload)
                          setNotify({ type: 'success', message: `Đã thêm ${payload.length} dòng vào phiếu #${documentId}` })
                          // refresh list and close modal
                          try { const list = await InventoryService.listDocuments({}); setDocList(list as any) } catch {}
                          handleCloseModal()
                        } catch (e:any) {
                          setNotify({ type: 'error', message: e?.message || 'Thêm dòng thất bại' })
                        }
                      }}>Xác nhận</button>
                    </div>

                    <div className="border rounded">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">PU ID</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th><th></th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {documentLines.map(l => (
                            <tr key={l.id}><td className="px-3 py-2 text-sm">{l.productUnitId}</td><td className="px-3 py-2 text-sm">{l.quantity}</td><td className="px-3 py-2 text-sm text-right"><button className="text-red-600" onClick={async ()=>{ try{ await InventoryService.deleteDocumentLine(l.id); setDocumentLines(prev=> prev.filter(x=> x.id!==l.id)) } catch{} }}>Xóa</button></td></tr>
                          ))}
                          {documentLines.length === 0 && (<tr><td colSpan={3} className="px-3 py-3 text-sm text-gray-500">Chưa có dòng</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail document modal */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={()=> setDetailOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Chi tiết phiếu #{detailDoc?.id}</h3>
                <button onClick={()=> setDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><span className="text-gray-500">Loại:</span> <span className="font-medium">{detailDoc?.type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'}</span></div>
                  <div><span className="text-gray-500">Trạng thái:</span> <span className="font-medium">{getDocumentStatusLabel(detailDoc?.status)}</span></div>
                  <div><span className="text-gray-500">Kho:</span> <span className="font-medium">{detailDoc?.warehouseId}</span></div>
                  <div><span className="text-gray-500">Vị trí:</span> <span className="font-medium">{detailDoc?.stockLocationId}</span></div>
                </div>
                <div className="border rounded">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Sản phẩm</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Đơn vị</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailLines.map(l => (<tr key={l.id}><td className="px-3 py-2 text-sm">{l.productName || `PU#${l.productUnitId}`}</td><td className="px-3 py-2 text-sm">{l.unitName || '-'}</td><td className="px-3 py-2 text-sm">{l.quantity}</td></tr>))}
                      {detailLines.length===0 && (<tr><td colSpan={3} className="px-3 py-3 text-sm text-gray-500">Chưa có dòng</td></tr>)}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <button onClick={()=> setDetailOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Đóng</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECK Tab Content */}
      {activeTab === 'CHECK' && (
        <InventoryCheckManagement />
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Từ chối phiếu</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối (tùy chọn)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setRejectModalOpen(false)
                    setRejectingDocId(null)
                    setRejectReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement
