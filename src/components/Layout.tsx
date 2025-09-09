import { ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Input from './Input'
import CategoryMenu from './CategoryMenu'

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
              <Link to="/account" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-sm">Account</span>
              </Link>
              <Link to="/wishlist" className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span className="text-sm">Wishlist</span>
              </Link>
              <Link to="/cart" className="relative text-gray-700 hover:text-primary-600">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 22a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"/></svg>
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 grid place-items-center">2</span>
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

      {/* Newsletter */}
      <section className="bg-white border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Subscribe our Newsletter</h3>
            <p className="text-sm text-gray-600">Get updates about our latest shop and special offers.</p>
          </div>
          <form className="w-full md:w-auto flex gap-2">
            <Input placeholder="Your email address" className="w-full md:w-80" type="email" />
            <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="text-2xl font-bold text-white">Ecobazar</Link>
            <p className="mt-4 text-sm">Fresh, healthy groceries delivered to your door. Quality you can trust.</p>
            <div className="mt-4 space-y-1 text-sm">
              <p>Call: +84 123 456 789</p>
              <p>Email: support@ecobazar.com</p>
              <p>Address: 123 Green Street, HCM</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">My Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="hover:text-white">Orders</Link></li>
              <li><Link to="#" className="hover:text-white">Wishlist</Link></li>
              <li><Link to="#" className="hover:text-white">Account Details</Link></li>
              <li><Link to="#" className="hover:text-white">Track Order</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="hover:text-white">About</Link></li>
              <li><Link to="#" className="hover:text-white">Contact</Link></li>
              <li><Link to="#" className="hover:text-white">Shipping</Link></li>
              <li><Link to="#" className="hover:text-white">Refunds</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="#" className="hover:text-white">Fruits & Vegetables</Link></li>
              <li><Link to="#" className="hover:text-white">Meat & Fish</Link></li>
              <li><Link to="#" className="hover:text-white">Beverages</Link></li>
              <li><Link to="#" className="hover:text-white">Snacks</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-gray-400">© 2024 Ecobazar. All rights reserved.</p>
            <div className="flex items-center gap-4 text-gray-400">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
