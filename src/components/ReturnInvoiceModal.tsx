import React from 'react'
import Modal from './Modal'

interface ReturnInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  orderData: {
    orderCode: string
    customerName: string
    createdAt: string

    // Dữ liệu TRƯỚC khi trả hàng
    originalTotal: number
    originalDiscount: number
    originalOrderDetails: Array<{
      id: number
      productUnitId: number
      quantity: number
      unitPrice: number
      subtotal: number
      productName?: string
      unitName?: string
    }>

    // Dữ liệu SAU khi trả hàng
    finalTotal: number
    finalDiscount: number

    // Dữ liệu trả hàng
    returnDetails: Array<{
      id: number
      orderDetailId: number
      productUnitId: number
      quantity: number
      refundAmount: number
      productName: string
      unitName: string
    }>
    totalReturnAmount: number

    // Thông tin đơn trả hàng
    returnOrder: {
      id: number
      reason: string
      status: string
      createdAt: string
    }
  }
}

const ReturnInvoiceModal: React.FC<ReturnInvoiceModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0.5cm;
            }
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100vh;
              overflow: hidden;
              font-size: 14px !important;
              line-height: 1.3 !important;
              font-family: 'Courier New', monospace !important;
            }
            .print-content table {
              font-size: 13px !important;
              border-collapse: collapse;
              width: 100%;
              margin: 8px 0;
            }
            .print-content th, .print-content td {
              padding: 3px 4px !important;
              border: none !important;
              text-align: left;
              font-size: 13px !important;
            }
            .print-content th {
              background-color: transparent !important;
              font-weight: bold;
              border-bottom: 1px dashed #000 !important;
            }
            .print-content .mb-1, .print-content .mb-2, .print-content .mb-4, .print-content .mb-6 {
              margin-bottom: 4px !important;
            }
            .print-content .p-1, .print-content .p-2, .print-content .p-3, .print-content .p-4 {
              padding: 2px !important;
            }
            .print-content .text-lg, .print-content .text-xl, .print-content .text-2xl {
              font-size: 18px !important;
            }
            .print-content .text-sm {
              font-size: 12px !important;
            }
            .print-content .text-xs {
              font-size: 11px !important;
            }
            .print-content h1, .print-content h2, .print-content h3 {
              font-size: 16px !important;
              margin: 4px 0 !important;
              font-weight: bold;
              text-align: center;
            }
            .print-content .grid {
              gap: 4px !important;
            }
            .print-content .space-y-2 > * + * {
              margin-top: 4px !important;
            }
            .print-content .print\\:hidden {
              display: none !important;
            }
            .print-content .border {
              border: none !important;
            }
            .print-content .rounded {
              border-radius: 0 !important;
            }
            .print-content .bg-gray-50,
            .print-content .bg-blue-50,
            .print-content .bg-red-50 {
              background: transparent !important;
            }
            .print-content .text-center {
              text-align: center !important;
            }
            .print-content .grid-cols-2 {
              grid-template-columns: 1fr 1fr !important;
            }
            .print-content .grid-cols-3 {
              grid-template-columns: 1fr 1fr 1fr !important;
            }
            .print-content .font-bold {
              font-weight: bold !important;
            }
            .print-content .text-red-600 {
              color: #000 !important;
            }
            .print-content .text-blue-600 {
              color: #000 !important;
            }
            .print-content .border-b-2 {
              border-bottom: 2px dashed #000 !important;
            }
            .print-content .border-b {
              border-bottom: 1px dashed #000 !important;
            }
          }
        `}
      </style>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Hóa đơn bán hàng sau trả"
        size="xl"
      >
        <div className="print-content max-w-4xl mx-auto bg-white print:max-w-none print:mx-0 print:shadow-none print:text-xs print:leading-tight print:page-break-inside-avoid">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-4 print:pb-2 print:mb-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-lg">HÓA ĐƠN BÁN HÀNG</h1>
          <p className="text-gray-600 print:text-xs print:hidden">Sau khi trả sản phẩm</p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm print:text-xs print:mt-1">
            <div className="text-left">
              <p><span className="font-semibold">Mã đơn hàng:</span> {orderData.orderCode}</p>
              <p><span className="font-semibold">Khách hàng:</span> {orderData.customerName}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Ngày tạo:</span> {formatDate(orderData.createdAt)}</p>
              <p><span className="font-semibold">Ngày trả:</span> {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Original Order Summary */}
        <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200 print:mb-1 print:p-1 print:bg-white print:border-gray-300">
          <h3 className="text-sm font-semibold text-blue-900 mb-1 print:text-xs print:mb-0">Thông tin đơn hàng gốc</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-gray-600 print:text-xs">Tổng tiền:</p>
              <p className="font-semibold text-sm print:text-xs">{formatCurrency(orderData.originalTotal)}</p>
            </div>
            <div>
              <p className="text-gray-600 print:text-xs">Giảm giá:</p>
              <p className="font-semibold text-sm text-red-600 print:text-xs">{formatCurrency(orderData.originalDiscount)}</p>
            </div>
            <div>
              <p className="text-gray-600 print:text-xs">Thành tiền:</p>
              <p className="font-semibold text-sm text-blue-600 print:text-xs">{formatCurrency(orderData.originalTotal - orderData.originalDiscount)}</p>
            </div>
          </div>
        </div>

        {/* Original Order Details */}
        <div className="mb-4 print:mb-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 print:text-xs print:mb-1">Danh sách sản phẩm gốc</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 print:text-xs">
              <thead>
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold print:px-2 print:py-1">STT</th>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold print:px-2 print:py-1">Sản phẩm</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold print:px-2 print:py-1">Đơn vị</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold print:px-2 print:py-1">Đơn giá</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold print:px-2 print:py-1">SL</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold print:px-2 print:py-1">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderData.originalOrderDetails.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 text-center print:px-2 print:py-1">{index + 1}</td>
                    <td className="border border-gray-300 px-3 py-2 print:px-2 print:py-1">
                      <div className="font-medium text-sm">{item.productName || `Sản phẩm #${item.productUnitId}`}</div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center print:px-2 print:py-1">{item.unitName || `Đơn vị #${item.productUnitId}`}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right print:px-2 print:py-1">{formatCurrency(item.unitPrice)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center print:px-2 print:py-1">{item.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-semibold print:px-2 print:py-1">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Items Table */}
        <div className="mb-2 print:mb-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 print:text-xs print:mb-0">Danh sách sản phẩm trả</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 print:text-xs">
              <thead>
                <tr className="bg-gray-50 print:bg-white">
                  <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold print:px-0.5 print:py-0">STT</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-left text-xs font-semibold print:px-0.5 print:py-0">Sản phẩm</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center text-xs font-semibold print:px-0.5 print:py-0">Đơn vị</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-center text-xs font-semibold print:px-0.5 print:py-0">SL trả</th>
                  <th className="border border-gray-300 px-1 py-0.5 text-right text-xs font-semibold print:px-0.5 print:py-0">Tiền trả</th>
                </tr>
              </thead>
              <tbody>
                {orderData.returnDetails.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-1 py-0.5 text-center print:px-0.5 print:py-0">{index + 1}</td>
                    <td className="border border-gray-300 px-1 py-0.5 print:px-0.5 print:py-0">
                      <div className="font-medium text-xs">{item.productName}</div>
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center print:px-0.5 print:py-0">{item.unitName}</td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center font-semibold text-red-600 print:px-0.5 print:py-0">{item.quantity}</td>
                    <td className="border border-gray-300 px-1 py-0.5 text-right font-semibold print:px-0.5 print:py-0">{formatCurrency(item.refundAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison Before/After Return */}
        <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded border border-gray-200 print:mb-1 print:p-1 print:bg-white">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 print:text-xs print:mb-0">So sánh trước và sau trả hàng</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-1">
            {/* Before Return */}
            <div className="bg-white p-2 rounded border border-blue-200 print:p-1 print:border-gray-300">
              <h4 className="text-xs font-semibold text-blue-900 mb-1 print:text-xs print:mb-0">TRƯỚC</h4>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng:</span>
                  <span className="font-semibold">{formatCurrency(orderData.originalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(orderData.originalDiscount)}</span>
                </div>
                <div className="flex justify-between border-t pt-0.5">
                  <span className="font-semibold">Thành:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(orderData.originalTotal - orderData.originalDiscount)}</span>
                </div>
              </div>
            </div>

            {/* After Return */}
            <div className="bg-white p-2 rounded border border-green-200 print:p-1 print:border-gray-300">
              <h4 className="text-xs font-semibold text-green-900 mb-1 print:text-xs print:mb-0">SAU</h4>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng:</span>
                  <span className="font-semibold">{formatCurrency(orderData.finalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giảm:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(orderData.finalDiscount)}</span>
                </div>
                <div className="flex justify-between border-t pt-0.5">
                  <span className="font-semibold">Thành:</span>
                  <span className="font-bold text-green-600">{formatCurrency(orderData.finalTotal - orderData.finalDiscount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Return Summary */}
        <div className="mb-2 p-2 bg-red-50 rounded border border-red-200 print:mb-1 print:p-1 print:bg-white print:border-gray-300">
          <h3 className="text-sm font-semibold text-red-900 mb-1 print:text-xs print:mb-0">Tóm tắt trả hàng</h3>
          <div className="text-center">
            <p className="text-gray-600 mb-0.5 print:text-xs">Tổng tiền trả:</p>
            <p className="font-bold text-lg text-red-600 print:text-sm">{formatCurrency(orderData.totalReturnAmount)}</p>
            <p className="text-xs text-gray-500 mt-0.5 print:text-xs">Lý do: {orderData.returnOrder.reason}</p>
          </div>
        </div>

        {/* Final Summary */}
        <div className="border-t border-gray-300 pt-2 print:pt-1">
          <div className="bg-gray-50 p-2 rounded print:p-1 print:bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center print:text-xs print:mb-0">Tóm tắt cuối cùng</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center print:gap-1">
              <div className="bg-white p-2 rounded border border-blue-200 print:p-1 print:border-gray-300">
                <p className="text-xs text-gray-600 mb-0.5 print:text-xs">Tổng gốc</p>
                <p className="text-sm font-bold text-blue-600 print:text-xs">{formatCurrency(orderData.originalTotal)}</p>
              </div>
              <div className="bg-white p-2 rounded border border-red-200 print:p-1 print:border-gray-300">
                <p className="text-xs text-gray-600 mb-0.5 print:text-xs">Tiền trả</p>
                <p className="text-sm font-bold text-red-600 print:text-xs">{formatCurrency(orderData.totalReturnAmount)}</p>
              </div>
              <div className="bg-white p-2 rounded border border-green-200 print:p-1 print:border-gray-300">
                <p className="text-xs text-gray-600 mb-0.5 print:text-xs">Tổng cuối</p>
                <p className="text-sm font-bold text-green-600 print:text-xs">{formatCurrency(orderData.finalTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-xs text-gray-500 print:mt-1 print:text-xs">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p>Hóa đơn được tạo tự động sau khi hoàn thành trả hàng</p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end space-x-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            In hóa đơn
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
        </div>
      </Modal>
    </>
  )
}

export default ReturnInvoiceModal
