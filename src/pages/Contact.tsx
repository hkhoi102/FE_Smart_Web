import { useState } from 'react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Địa chỉ',
      content: 'Nguyễn Văn Bảo/12 Đ. Hạnh Thông, Phường, Gò Vấp, Hồ Chí Minh 700000, Vietnam'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Email',
      content: 'dhcn@iuh.edu.vn'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Điện thoại',
      content: '028 38940 390'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Liên hệ với chúng tôi
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Bạn có câu hỏi hay muốn hợp tác? Hãy để lại lời nhắn, chúng tôi sẽ phản hồi sớm nhất có thể.
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-16">
        {/* Contact Form */
        }
        <section>
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gửi tin nhắn cho chúng tôi
            </h2>

            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Có lỗi xảy ra. Vui lòng thử lại.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="tenban@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Chủ đề *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Nội dung chính của yêu cầu"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Tin nhắn *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="input resize-none"
                  placeholder="Mô tả chi tiết yêu cầu của bạn..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          </div>
        </section>

        {/* Contact Information */}
        <section>
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Thông tin liên hệ
              </h2>
              <p className="text-gray-600 mb-8">
                Bạn có thể liên hệ với chúng tôi qua các kênh dưới đây. Chúng tôi luôn sẵn sàng hỗ trợ.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {info.title}
                    </h3>
                    <p className="text-gray-600">
                      {info.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Business Hours */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Giờ làm việc
              </h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Thứ 2 - Thứ 6:</span>
                  <span>9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Thứ 7:</span>
                  <span>10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Chủ nhật:</span>
                  <span>Nghỉ</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Map Section */}
      <section className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Địa chỉ của chúng tôi
        </h2>
        <div className="rounded-lg overflow-hidden">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.231234567890!2d106.6842705!3d10.8221642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174deb3ef536f31%3A0x8b7bb8b7c956157b!2sIndustrial%20University%20of%20Ho%20Chi%20Minh%20City!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
            className="w-full h-96 border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </div>
  )
}

export default Contact
