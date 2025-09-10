import { HTMLAttributes } from 'react'

interface TestimonialCardProps extends HTMLAttributes<HTMLDivElement> {
  quote: string
  name: string
  role?: string
  avatarUrl?: string
}

const TestimonialCard = ({ quote, name, role = 'Customer', avatarUrl, className = '', ...props }: TestimonialCardProps) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 md:p-7 ${className}`} {...props}>
      <div className="text-green-500 mb-4">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.17 6.17A5.5 5.5 0 002 11.5V22h8v-8H6.5c0-2.5.33-4.17 1.67-5.5 1.34-1.34 3-1.66 3-1.66V2s-2.83.17-4.99 2.17zM16.17 6.17A5.5 5.5 0 0011 11.5V22h8v-8h-3.5c0-2.5.33-4.17 1.67-5.5 1.34-1.34 3-1.66 3-1.66V2s-2.83.17-4.99 2.17z"/></svg>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-6">{quote}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          )}
          <div>
            <p className="text-gray-900 font-medium text-sm">{name}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestimonialCard


