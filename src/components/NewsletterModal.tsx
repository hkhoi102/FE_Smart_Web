import { useEffect, useState } from 'react'

type NewsletterModalProps = {
  defaultOpen?: boolean
  onClose?: () => void
  imageUrl?: string
  snoozeDays?: number // number of days to hide when opted out
}

const NewsletterModal = ({ defaultOpen = false, onClose, imageUrl, snoozeDays = 30 }: NewsletterModalProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Migration: remove old boolean key so modal can show again
    const oldKey = window.localStorage.getItem('newsletter_opt_out')
    if (oldKey) {
      window.localStorage.removeItem('newsletter_opt_out')
    }

    const untilStr = window.localStorage.getItem('newsletter_opt_out_until')
    const until = untilStr ? new Date(untilStr).getTime() : null
    const now = Date.now()

    if (!until || now > until) {
      // If expired or not set, open and clear key
      setIsOpen(true)
      window.localStorage.removeItem('newsletter_opt_out_until')
    } else {
      setIsOpen(false)
    }
  }, [])

  const handleClose = () => {
    if (dontShowAgain) {
      const until = new Date()
      until.setDate(until.getDate() + snoozeDays)
      window.localStorage.setItem('newsletter_opt_out_until', until.toISOString())
    } else {
      window.localStorage.removeItem('newsletter_opt_out_until')
    }
    setIsOpen(false)
    onClose && onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Normally submit email here
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl overflow-hidden w-[90%] max-w-3xl grid grid-cols-1 md:grid-cols-[300px_1fr] md:min-h-[300px]">
        <button aria-label="Đóng" onClick={handleClose} className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/80 hover:bg-white grid place-items-center shadow">
          <span className="text-xl">×</span>
        </button>

        <div className="hidden md:block h-full">
          {/* Left Image */}
          <img src={imageUrl} alt="newsletter" className="h-full w-full object-cover" />
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký nhận tin</h3>
          <p className="text-sm text-gray-600 mb-5">Đăng ký nhận bản tin và tiết kiệm 20% với mã giảm giá hôm nay.</p>

          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              className="flex-1 h-10 rounded-full border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button type="submit" className="h-10 px-5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 whitespace-nowrap">Đăng ký</button>
          </form>

          <label className="mt-4 flex items-center gap-2 text-xs text-gray-600 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            Không hiện cửa sổ này
          </label>
        </div>
      </div>
    </div>
  )
}

export default NewsletterModal


