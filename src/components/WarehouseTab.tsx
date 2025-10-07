import { WarehouseManagement } from './index'

const WarehouseTab = () => {

  return (
    <div className="space-y-6">
      {/* Content - always show WarehouseManagement for warehouse-list */}
      <WarehouseManagement />
    </div>
  )
}

export default WarehouseTab
