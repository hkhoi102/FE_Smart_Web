import { ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Input from './Input'
import CategoryMenu from './CategoryMenu'
import AccountDropdown from './AccountDropdown'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [isCategoriesOpen, setIsCategoriesOpen] = useState<boolean>(false)
  const categoriesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!categoriesRef.current) return
      if (!categoriesRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsCategoriesOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="hidden md:block bg-gray-900 text-gray-200 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <p>Welcome to Smart Web — Fresh groceries delivered fast</p>
          <div className="flex items-center gap-6">
            <span>Help</span>
            <span>Track Order</span>
            <span>Contact: +84 123 456 789</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <Link to="/" className="text-2xl md:text-3xl font-bold text-primary-600">Ecobazar</Link>

            {/* Search */}
            <div className="flex-1 hidden md:block">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Input placeholder="Search for products..." className="pl-10 py-3" />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.1-4.4a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"/></svg>
                </div>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block">
                <AccountDropdown />
              </div>
              <Link to="/wishlist" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span className="text-sm">Wishlist</span>
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-primary-600">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Nav bar */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between relative">
            <div className="relative" ref={categoriesRef}>
              <button onClick={() => setIsCategoriesOpen((v) => !v)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                <span>All Categories</span>
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {/* Dropdown */}
              {isCategoriesOpen && (
                <div className="absolute z-30 mt-2 md:block">
                  <CategoryMenu onSelect={(label) => { console.log('Selected category:', label); setIsCategoriesOpen(false) }} />
                </div>
              )}
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${location.pathname === item.path ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <span className="hidden md:inline text-sm text-gray-600">Call us: <strong className="text-gray-900">+84 123 456 789</strong></span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>


      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Link to="/" className="text-xl font-bold text-white">Ecobazar</Link>
            <p className="mt-2 text-sm text-gray-400">Fresh, healthy groceries delivered to your door.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/about" className="hover:text-white">About</Link>
              <Link to="/contact" className="hover:text-white">Contact</Link>
              <Link to="#" className="hover:text-white">Orders</Link>
              <Link to="#" className="hover:text-white">Help</Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Contact Info</h4>
            <div className="space-y-1 text-sm text-gray-400">
              <p>+84 123 456 789</p>
              <p>support@ecobazar.com</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-center text-gray-400">
            <p>© 2024 Ecobazar. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
