import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserAuthProvider } from '@/contexts/UserAuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { Layout, ProtectedRoute } from '@/components'
import Home from '@/pages/Home'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import Payment from '@/pages/Payment'
import MyOrders from '@/pages/MyOrders'
import Login from '@/pages/Login'
import UserLogin from '@/pages/UserLogin'
import Admin from '@/pages/Admin'
import PromotionDetail from '@/pages/PromotionDetail'
import ReturnOrderPage from '@/pages/ReturnOrderPage'
// InventoryCheckCreate is rendered inside Admin when tab=inventory-check-create
import InventoryImportExportDetail from '@/components/InventoryImportExportDetail'

function App() {
  return (
    <UserAuthProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/user-login" element={<UserLogin />} />

              {/* Protected routes with layout */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
              <Route path="/products" element={<Layout><Products /></Layout>} />
              <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/payment/:orderId" element={<Layout><Payment /></Layout>} />
              <Route path="/my-orders" element={<Layout><MyOrders /></Layout>} />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/:tab"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prices"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prices/:headerId"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/inventory-check/create"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/import-export/:id"
                element={
                  <ProtectedRoute>
                    <InventoryImportExportDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/promotion/:id"
                element={
                  <ProtectedRoute>
                    <PromotionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/return-order-page/:orderId"
                element={
                  <ProtectedRoute>
                    <ReturnOrderPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </UserAuthProvider>
  )
}

export default App
