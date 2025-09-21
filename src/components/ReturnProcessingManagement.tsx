import React, { useEffect, useState } from 'react'
import Modal from './Modal'
import { ReturnService, ReturnStatus } from '../services/returnService'
import { CustomerService } from '../services/customerService'
import { ProductService } from '../services/productService'

type Row = {
  id: number
  orderId: number
  customerId: number
  reason?: string
  status: ReturnStatus
  refundAmount?: number
  createdAt?: string
}

const ReturnProcessingManagement: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [detail, setDetail] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nameMap, setNameMap] = useState<Record<number, string>>({})
  const [unitCache, setUnitCache] = useState<Record<number, { productName?: string; unitName?: string }>>({})
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REQUESTED' | 'APPROVED'>('ALL')
  const [refundMap, setRefundMap] = useState<Record<number, number>>({})

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  const formatDate = (d?: string) => d ? new Date(d).toLocaleString('vi-VN') : ''
  const toNumber = (v: any): number => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      // Normalize common VN formats: 100.000,0 or 100,000.00
      const s = v.replace(/\./g, '').replace(/,/g, '.')
      const n = Number(s)
      return isNaN(n) ? 0 : n
    }
    return 0
  }
  const pickRefund = (obj: any): number => {
    if (!obj) return 0
    return toNumber(
      obj.refundAmount ?? obj.refund_amount ?? obj.totalRefundAmount ?? obj.total_refund_amount ?? obj.refund
    )
  }

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        // Only REQUESTED/APPROVED are shown per requirement
        let arr: any[] = []
        if (statusFilter === 'ALL') {
          const [appr, rej] = await Promise.all([
            ReturnService.list({ page: 0, size: 50, status: 'REQUESTED' }),
            ReturnService.list({ page: 0, size: 50, status: 'APPROVED' }),
          ])
          const a1 = Array.isArray(appr?.data) ? appr.data : []
          const a2 = Array.isArray(rej?.data) ? rej.data : []
          arr = [...a1, ...a2]
        } else {
          const res = await ReturnService.list({ page: 0, size: 50, status: statusFilter as any })
          arr = Array.isArray(res?.data) ? res.data : []
        }
        const mapped: Row[] = arr.map((r: any) => ({
          id: r.id,
          orderId: r.orderId || r.order_id,
          customerId: r.customerId || r.customer_id,
          reason: r.reason,
          status: (r.status || 'REQUESTED') as ReturnStatus,
          refundAmount: pickRefund(r),
          createdAt: r.createdAt || r.created_at,
        }))
        if (!mounted) return
        setRows(mapped)
        // preload customer names
        const nm = await CustomerService.preloadNames(mapped.map(m => m.customerId))
        if (!mounted) return
        setNameMap(nm)
        // compute refund totals if BE list does not include
        const details = await Promise.all(mapped.map(m => ReturnService.getById(m.id).catch(()=>null)))
        const totals: Record<number, number> = {}
        details.forEach((resp: any) => {
          const d = resp?.data
          if (d) totals[d.id] = pickRefund(d)
        })
        if (!mounted) return
        setRefundMap(totals)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Không thể tải danh sách đơn trả về')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabelVi = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'Chờ chấp nhận'
      case 'APPROVED': return 'Đã chấp nhận'
      case 'REJECTED': return 'Đã từ chối'
      case 'COMPLETED': return 'Hoàn thành'
      default: return status
    }
  }

  const openDetail = async (id: number) => {
    setIsModalOpen(true)
    try {
      const resp = await ReturnService.getById(id)
      const data = (resp as any)?.data ?? resp
      setDetail(data)
      // preload product unit info for rows
      if (data && Array.isArray(data.returnDetails)) {
        const unitIds = Array.from(new Set(data.returnDetails.map((d: any) => d.productUnitId ?? d.product_unit_id).filter(Boolean))) as number[]
        const missing = unitIds.filter(u => !unitCache[u])
        if (missing.length) {
          const infos = await Promise.all(missing.map(id => ProductService.getProductUnitById(id)))
          const next = { ...unitCache }
          infos.forEach((info, idx) => {
            const key = missing[idx]
            if (info) next[key] = { productName: info.productName, unitName: info.unitName }
          })
          setUnitCache(next)
        }
      }
    } catch {
      setDetail(null)
    }
  }

  const approveOne = async (id: number) => { await ReturnService.approve(id); setRows(prev => prev.filter(r => r.id !== id)) }
  // Reject flow is not exposed in this screen per requirement
  // const rejectOne = async (id: number) => { await ReturnService.reject(id); setRows(prev => prev.filter(r => r.id !== id)) }
  const completeOne = async (id: number) => { await ReturnService.complete(id); setRows(prev => prev.filter(r => r.id !== id)) }

  const approveBulk = async () => { await Promise.all(selectedIds.map(approveOne)) ; setSelectedIds([]) }
  // const rejectBulk = async () => { await Promise.all(selectedIds.map(rejectOne)) ; setSelectedIds([]) }
  const completeBulk = async () => { await Promise.all(selectedIds.map(completeOne)) ; setSelectedIds([]) }

  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const selectAll = () => setSelectedIds(prev => prev.length === rows.length ? [] : rows.map(r => r.id))

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Xử lý Đơn hàng Trả về</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Lọc:</span>
            <div className="inline-flex rounded-md shadow-sm overflow-hidden border border-gray-300">
              <button
                onClick={()=> setStatusFilter('ALL')}
                className={`px-3 py-1.5 text-sm ${statusFilter==='ALL'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Tất cả</button>
              <button
                onClick={()=> setStatusFilter('REQUESTED')}
                className={`px-3 py-1.5 text-sm border-l border-gray-300 ${statusFilter==='REQUESTED'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Chờ chấp nhận</button>
              <button
                onClick={()=> setStatusFilter('APPROVED')}
                className={`px-3 py-1.5 text-sm border-l border-gray-300 ${statusFilter==='APPROVED'?'bg-blue-600 text-white':'bg-white text-gray-700 hover:bg-gray-50'}`}
              >Đã chấp nhận</button>
            </div>

          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={approveBulk} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Duyệt</button>
              <button onClick={async()=>{ await Promise.all(selectedIds.map(id => ReturnService.reject(id))); setRows(prev=> prev.filter(r=> !selectedIds.includes(r.id))) ; setSelectedIds([])}} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Từ chối</button>
              <button onClick={completeBulk} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Hoàn thành</button>
            </div>
          )}
        </div>

        {loading && (<div className="p-4 text-sm text-gray-500">Đang tải dữ liệu...</div>)}
        {error && (<div className="p-4 text-sm text-red-600">{error}</div>)}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" checked={selectedIds.length === rows.length && rows.length>0} onChange={selectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(r.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nameMap[r.customerId] || `#${r.customerId}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{r.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{getStatusLabelVi(r.status)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency((refundMap[r.id] ?? pickRefund(r)) || 0)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button onClick={() => openDetail(r.id)} className="text-blue-600 hover:text-blue-900">Xem</button>
                      {r.status === 'REQUESTED' && (
                        <>
                          <button onClick={() => approveOne(r.id)} className="text-green-600 hover:text-green-900">Duyệt</button>
                          <button onClick={async()=>{ await ReturnService.reject(r.id); setRows(prev=> prev.filter(x=> x.id!==r.id)) }} className="text-red-600 hover:text-red-900">Từ chối</button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button onClick={() => completeOne(r.id)} className="text-blue-600 hover:text-blue-900">Hoàn thành</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">Không có yêu cầu trả hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Chi tiết đơn trả về">
        {detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã trả hàng</label>
                <p className="mt-1 text-sm text-gray-900">{detail.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Đơn hàng</label>
                <p className="mt-1 text-sm text-gray-900">#{detail.orderId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Khách hàng</label>
                <p className="mt-1 text-sm text-gray-900">{nameMap[detail.customerId] || `#${detail.customerId}`}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <p className="mt-1 text-sm text-gray-900">{detail.status}</p>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng trả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(detail.returnDetails || []).map((it: any, idx: number) => {
                    const unit = unitCache[it.productUnitId]
                    return (
                      <tr key={it.id || idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit?.productName || `#${it.productUnitId}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit?.unitName || ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(it.refundAmount || 0)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm text-gray-500">Đang tải...</div>
        )}
      </Modal>
    </div>
  )
}

export default ReturnProcessingManagement



