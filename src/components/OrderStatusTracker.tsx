import React from 'react'

interface OrderStatusTrackerProps {
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PROCESSING'
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL'
  createdAt: string
  updatedAt: string
}

const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  status,
  paymentStatus,
  createdAt,
  updatedAt
}) => {
  const getStatusStep = (orderStatus: string) => {
    switch (orderStatus) {
      case 'PENDING':
        return 1 // Đặt hàng thành công
      case 'PROCESSING':
        return 2 // Đã xác nhận
      case 'COMPLETED':
        return 3 // Đã nhận hàng
      case 'CANCELLED':
        return 0 // Hủy bỏ
      default:
        return 1
    }
  }

  const currentStep = getStatusStep(status)
  const isCancelled = status === 'CANCELLED'

  const steps = [
    {
      id: 1,
      title: 'Đặt hàng thành công',
      description: 'Đơn hàng đã được đặt thành công',
      icon: '✓'
    },
    {
      id: 2,
      title: 'Đã xác nhận',
      description: 'Đơn hàng đã được xác nhận',
      icon: '✓'
    },
    {
      id: 3,
      title: 'Đã nhận hàng',
      description: 'Khách hàng đã nhận được hàng',
      icon: '✓'
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-red-600 text-xl">✕</span>
          </div>
          <p className="text-sm font-medium text-red-600">Đơn hàng đã hủy</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(updatedAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep >= step.id
          const isCurrent = currentStep === step.id
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? step.icon : step.id}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isCompleted || isCurrent
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>

                  {/* Timestamp */}
                  {isCompleted && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.id === 1 && formatDate(createdAt)}
                      {step.id === 2 && currentStep >= 2 && formatDate(updatedAt)}
                      {step.id === 3 && currentStep >= 3 && formatDate(updatedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Status Description */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">
          {currentStep === 1 && 'Đơn hàng đang chờ xác nhận'}
          {currentStep === 2 && 'Đơn hàng đang được xử lý'}
          {currentStep === 3 && 'Đơn hàng đã hoàn thành'}
        </p>
        {/* {paymentStatus === 'PAID' && (
          <p className="text-xs text-green-600 mt-1">✓ Đã thanh toán</p>
        )}
        {paymentStatus === 'UNPAID' && (
          <p className="text-xs text-red-600 mt-1">⚠ Chưa thanh toán</p>
        )}
        {paymentStatus === 'PARTIAL' && (
          <p className="text-xs text-yellow-600 mt-1">⚠ Thanh toán một phần</p>
        )} */}
      </div>
    </div>
  )
}

export default OrderStatusTracker
