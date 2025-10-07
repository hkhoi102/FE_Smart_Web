import { useState, useEffect } from 'react'
import { InventoryService, type StockBalanceDto } from '@/services/inventoryService'
import { ProductService } from '@/services/productService'
import Pagination from './Pagination'

interface Warehouse {
  id: number
  name: string
  address: string
  phone: string
  status: 'active' | 'inactive'
}

interface EnrichedStockBalance extends StockBalanceDto {
  productName?: string
  unitName?: string
  warehouseName?: string
  locationName?: string
}

const InventoryManagement = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [notify, setNotify] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | 'all'>('all')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stockBalances, setStockBalances] = useState<EnrichedStockBalance[]>([])
  const [stockLocations, setStockLocations] = useState<Map<number, string>>(new Map())
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Function to load stock locations for all warehouses
  const loadStockLocations = async () => {
    try {
      const locationMap = new Map<number, string>()

      for (const warehouse of warehouses) {
        try {
          const locations = await InventoryService.getStockLocations(warehouse.id)
          locations.forEach(location => {
            locationMap.set(location.id, `${location.name} (${warehouse.name})`)
          })
        } catch (error) {
          console.error(`Error loading locations for warehouse ${warehouse.id}:`, error)
        }
      }

      setStockLocations(locationMap)
      console.log('Stock locations loaded:', locationMap)
    } catch (error) {
      console.error('Error loading stock locations:', error)
    }
  }

  // Function to enrich stock balances with product names, unit names, and location names
  const enrichStockBalances = async (balances: StockBalanceDto[]): Promise<EnrichedStockBalance[]> => {
    const enrichedBalances = await Promise.all(
      balances.map(async (balance) => {
        try {
          // Get product unit details to get product name and unit name
          const productUnit = await ProductService.getProductUnitById(balance.productUnitId)
          const locationName = stockLocations.get(balance.stockLocationId) || `Vị trí ${balance.stockLocationId}`

          return {
            ...balance,
            productName: productUnit?.productName || `Sản phẩm ${balance.productUnitId}`,
            unitName: productUnit?.unitName || 'Cái',
            locationName: locationName
          }
        } catch (error) {
          console.error(`Error loading product for unit ${balance.productUnitId}:`, error)
          const locationName = stockLocations.get(balance.stockLocationId) || `Vị trí ${balance.stockLocationId}`

          return {
            ...balance,
            productName: `Sản phẩm ${balance.productUnitId}`,
            unitName: 'Cái',
            locationName: locationName
          }
        }
      })
    )
    return enrichedBalances
  }

  // Load warehouses on component mount
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const warehousesData = await InventoryService.getWarehouses()
        // Convert WarehouseDto to Warehouse interface
        const convertedWarehouses = warehousesData.map(w => ({
          id: w.id,
          name: w.name,
          address: w.address || '',
          phone: w.phone || '',
          status: 'active' as const
        }))
        setWarehouses(convertedWarehouses)
      } catch (error) {
        console.error('Error loading warehouses:', error)
        setNotify({ type: 'error', message: 'Không thể tải danh sách kho' })
      }
    }

    loadWarehouses()
  }, [])

  // Load stock locations when warehouses change
  useEffect(() => {
    if (warehouses.length > 0) {
      loadStockLocations()
    }
  }, [warehouses])

  // Load stock balances when warehouse changes
  useEffect(() => {
    const loadStockBalances = async () => {
      try {
        console.log('Loading stock balances for warehouse:', selectedWarehouse)

        if (selectedWarehouse === 'all') {
          // Load stock for all warehouses
          const allBalances = []
          for (const warehouse of warehouses) {
            try {
              const balances = await InventoryService.getStock({ warehouseId: warehouse.id })
              console.log(`Stock for warehouse ${warehouse.id}:`, balances)

              // Enrich with warehouse name
              const warehouseEnrichedBalances = balances.map(balance => {
                console.log(`Enriching balance for warehouse ${warehouse.id} (${warehouse.name})`)
                return {
                  ...balance,
                  warehouseName: warehouse.name
                }
              })

              allBalances.push(...warehouseEnrichedBalances)
            } catch (error) {
              console.error(`Error loading stock for warehouse ${warehouse.id}:`, error)
            }
          }

          // Enrich all balances with product names
          const enrichedBalances = await enrichStockBalances(allBalances)
          setStockBalances(enrichedBalances)
        } else {
          const balances = await InventoryService.getStock({ warehouseId: selectedWarehouse })
          console.log('Stock balances loaded:', balances)

          // Find warehouse name
          const warehouse = warehouses.find(w => w.id === selectedWarehouse)
          console.log(`Found warehouse for ID ${selectedWarehouse}:`, warehouse)
          const warehouseEnrichedBalances = balances.map(balance => {
            console.log(`Enriching balance for selected warehouse ${selectedWarehouse} (${warehouse?.name})`)
            return {
              ...balance,
              warehouseName: warehouse?.name || `Kho ${selectedWarehouse}`
            }
          })

          // Enrich with product names
          const enrichedBalances = await enrichStockBalances(warehouseEnrichedBalances)
          setStockBalances(enrichedBalances)
        }
      } catch (error) {
        console.error('Error loading stock balances:', error)
        setNotify({ type: 'error', message: 'Không thể tải số lượng sản phẩm' })
      }
    }

    if (warehouses.length > 0) {
      loadStockBalances()
    }
  }, [selectedWarehouse, warehouses])


  const handleRejectConfirm = async () => {
    if (!rejectingDocId) return

    try {
      await InventoryService.rejectDocument(rejectingDocId, rejectReason || undefined)
      setNotify({ type: 'success', message: `Đã từ chối phiếu #${rejectingDocId}` })
      setRejectModalOpen(false)
      setRejectingDocId(null)
      setRejectReason('')
    } catch (e: any) {
      setNotify({ type: 'error', message: e?.message || 'Từ chối phiếu thất bại' })
    }
  }


  // Filter stock balances based on search term and status
  const filteredBalances = stockBalances.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesWarehouse = selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse
    return matchesSearch && matchesWarehouse
  })

  // Pagination logic
  const itemsPerPage = 10
  const totalItems = filteredBalances.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBalances = filteredBalances.slice(startIndex, endIndex)

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
  }, [searchTerm, selectedWarehouse, statusFilter])

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
        <h2 className="text-2xl font-bold text-gray-900">Quản lý kho</h2>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              setSearchTerm('')
              setStatusFilter('all')
              setSelectedWarehouse('all')
              // Force reload stock balances
              try {
                console.log('Manual reload - Loading stock for all warehouses')
                const allBalances = []
                for (const warehouse of warehouses) {
                  try {
                    const balances = await InventoryService.getStock({ warehouseId: warehouse.id })
                    console.log(`Manual reload - Stock for warehouse ${warehouse.id}:`, balances)

                    // Enrich with warehouse name
                    const warehouseEnrichedBalances = balances.map(balance => ({
                      ...balance,
                      warehouseName: warehouse.name
                    }))

                    allBalances.push(...warehouseEnrichedBalances)
                  } catch (error) {
                    console.error(`Manual reload - Error loading stock for warehouse ${warehouse.id}:`, error)
                  }
                }

                // Enrich with product names
                const enrichedBalances = await enrichStockBalances(allBalances)
                setStockBalances(enrichedBalances)
                setNotify({ type: 'success', message: `Đã tải ${enrichedBalances.length} sản phẩm từ ${warehouses.length} kho` })
              } catch (error) {
                console.error('Manual reload error:', error)
                setNotify({ type: 'error', message: 'Không thể tải số lượng sản phẩm' })
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            🔄 Làm mới
          </button>
          <button
            onClick={async () => {
              try {
                console.log('Test load stock for first warehouse')
                if (warehouses.length > 0) {
                  const balances = await InventoryService.getStock({ warehouseId: warehouses[0].id })
                  console.log('Test stock result:', balances)

                  // Enrich with warehouse name
                  const warehouseEnrichedBalances = balances.map(balance => ({
                    ...balance,
                    warehouseName: warehouses[0].name
                  }))

                  // Enrich with product names
                  const enrichedBalances = await enrichStockBalances(warehouseEnrichedBalances)
                  setStockBalances(enrichedBalances)
                  setNotify({ type: 'success', message: `Test: Đã tải ${enrichedBalances.length} sản phẩm từ kho ${warehouses[0].name}` })
                } else {
                  setNotify({ type: 'error', message: 'Chưa có kho nào' })
                }
              } catch (error) {
                console.error('Test load error:', error)
                setNotify({ type: 'error', message: `Test lỗi: ${error instanceof Error ? error.message : 'Unknown error'}` })
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            🧪 Test Load
          </button>
        </div>
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
              <p className="text-sm font-medium text-gray-600">Tổng số kho</p>
              <p className="text-2xl font-semibold text-gray-900">{warehouses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kho hoạt động</p>
              <p className="text-2xl font-semibold text-gray-900">
                {warehouses.filter(w => w.status === 'active').length}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Kho tạm dừng</p>
              <p className="text-2xl font-semibold text-gray-900">
                {warehouses.filter(w => w.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold text-gray-900">{stockBalances.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center space-x-4">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kho</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả kho</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết hàng</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
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
              {paginatedBalances.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.productName || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Đơn vị: {item.unitName || 'Cái'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.warehouseName || `Kho ID: ${item.warehouseId}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.locationName || `Vị trí ID: ${item.stockLocationId}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity || 0} {item.unitName || 'Cái'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (item.quantity || 0) > 10 ? 'bg-green-100 text-green-800' :
                      (item.quantity || 0) > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(item.quantity || 0) > 10 ? 'Còn hàng' :
                       (item.quantity || 0) > 0 ? 'Sắp hết hàng' :
                       'Hết hàng'}
                    </span>
                  </td>
                </tr>
              ))}
                          {paginatedBalances.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                {selectedWarehouse === 'all' ? 'Chọn kho để xem số lượng sản phẩm' : 'Không có dữ liệu'}
                              </td>
                            </tr>
                          )}
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
