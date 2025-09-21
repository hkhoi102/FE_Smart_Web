import { HTMLAttributes } from 'react'

interface PromoCardProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
  title: string
  subline?: string
  badgeText?: string
  imageUrl?: string
  bgClassName?: string
}

const PromoCard = ({
  label,
  title,
  subline,
  badgeText,
  imageUrl,
  bgClassName = 'bg-blue-600',
  className = '',
  ...props
}: PromoCardProps) => {
  return (
    <div className={`relative rounded-2xl overflow-hidden text-white ${bgClassName} ${className}`} {...props}>
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover opacity-90" />
        ) : null}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      <div className="relative p-6 md:p-8 flex flex-col h-full">
        {label && <p className="uppercase tracking-wider text-xs text-white/80 mb-2">{label}</p>}
        <h3 className="text-2xl font-bold leading-tight mb-3">{title}</h3>
        {subline && <p className="text-sm text-white/90 mb-4">{subline}</p>}
        {badgeText && (
          <span className="self-start bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded">{badgeText}</span>
        )}
        <div className="mt-auto">
          <button className="bg-white text-primary-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-full">
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromoCard


