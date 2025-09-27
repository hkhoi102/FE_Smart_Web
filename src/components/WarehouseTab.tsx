import { useState } from 'react'
import { InventoryManagement, WarehouseManagement, ImportExportManagement } from './index'

const WarehouseTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'warehouses' | 'import-export'>('inventory')

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'inventory'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Quản lý kho
          </button>
          <button
            onClick={() => setActiveSubTab('warehouses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'warehouses'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Danh sách kho
          </button>
          <button
            onClick={() => setActiveSubTab('import-export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSubTab === 'import-export'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
           Lịch Sử Giao Dịch Kho
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeSubTab === 'inventory' && <InventoryManagement />}
      {activeSubTab === 'warehouses' && <WarehouseManagement />}
      {activeSubTab === 'import-export' && <ImportExportManagement />}
    </div>
  )
}

export default WarehouseTab
