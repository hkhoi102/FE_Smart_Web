import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react'
import { Product } from '../services/productService'
import { OrderApi, CartReviewResponse } from '../services/orderService'

export interface CartItem extends Product {
  quantity: number
  // Derived for cart display/pricing
  price: number
  unitName?: string
  unitId?: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  reviewData?: CartReviewResponse
  loading: boolean
  error?: string
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; payload: string }
  | { type: 'SET_REVIEW_DATA'; payload: CartReviewResponse }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const defaultUnit = (action.payload.productUnits && action.payload.productUnits.find(u => u.isDefault)) || action.payload.productUnits?.[0]
      const price = defaultUnit?.currentPrice ?? defaultUnit?.convertedPrice ?? 0
      const unitName = defaultUnit?.unitName
      // Use unit.id (productUnit ID) instead of unitId (unit of measure ID)
      const unitId = defaultUnit?.id

      console.log('🛒 Add to Cart Debug:', {
        productId: action.payload.id,
        unitId: unitId,
        unitName: unitName,
        price: price,
        productUnits: action.payload.productUnits
      })

      const existingItem = state.items.find(item => item.id === action.payload.id && item.unitId === unitId)

      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id && item.unitId === unitId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        const enriched: CartItem = { ...action.payload, quantity: 1, price, unitName, unitId }
        newItems = [...state.items, enriched]
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems,
        totalAmount,
        loading: false
      }
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems,
        totalAmount,
        loading: false
      }
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload

      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: id })
      }

      const newItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      )

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems,
        totalAmount,
        loading: false
      }
    }

    case 'CLEAR_CART':
      return { ...initialState, loading: false }

    case 'SET_REVIEW_DATA':
      return { ...state, reviewData: action.payload, error: undefined }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addToCart: (product: Product) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  reviewCart: () => Promise<void>
  applyPromotion: (promotionId: number) => Promise<void>
  removePromotion: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  // Load cart from localStorage on initialization
  const loadCartFromStorage = (): CartState => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        return {
          ...parsedCart,
          loading: false,
          error: undefined
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
    }
    return { ...initialState, loading: false }
  }

  const [state, dispatch] = useReducer(cartReducer, loadCartFromStorage())
  const [appliedPromotionId, setAppliedPromotionId] = useState<number | undefined>(() => {
    try {
      const savedPromotionId = localStorage.getItem('appliedPromotionId')
      return savedPromotionId ? parseInt(savedPromotionId) : undefined
    } catch {
      return undefined
    }
  })

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product })
  }

  const removeFromCart = (id: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id })
  }

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
    setAppliedPromotionId(undefined)
    localStorage.removeItem('cart')
    localStorage.removeItem('appliedPromotionId')
  }

  const reviewCart = async () => {
    if (state.items.length === 0) {
      dispatch({ type: 'SET_REVIEW_DATA', payload: undefined as any })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: undefined })

    try {
      const orderDetails = state.items.map(item => {
        // Use unitId if available, otherwise fallback to id
        const productUnitId = item.unitId || item.id

        console.log('🔍 Cart Item Debug:', {
          itemId: item.id,
          unitId: item.unitId,
          productUnitId,
          productName: item.name,
          unitName: item.unitName
        })

        return {
          productUnitId,
          quantity: item.quantity
        }
      })

      console.log('🛒 Review Cart Debug:', {
        orderDetails,
        appliedPromotionId,
        userToken: localStorage.getItem('user_access_token') ? 'exists' : 'missing',
        adminToken: localStorage.getItem('access_token') ? 'exists' : 'missing'
      })

      const reviewData = await OrderApi.reviewCart({
        orderDetails,
        promotionAppliedId: appliedPromotionId
      })

      dispatch({ type: 'SET_REVIEW_DATA', payload: reviewData })
    } catch (error) {
      console.error('Error reviewing cart:', error)
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to review cart' })
    }
  }

  const applyPromotion = async (promotionId: number) => {
    setAppliedPromotionId(promotionId)
    localStorage.setItem('appliedPromotionId', promotionId.toString())
    await reviewCart()
  }


  const removePromotion = () => {
    setAppliedPromotionId(undefined)
    localStorage.removeItem('appliedPromotionId')
    reviewCart()
  }

  // Save cart to localStorage whenever state changes
  useEffect(() => {
    try {
      const cartToSave = {
        items: state.items,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount
      }
      localStorage.setItem('cart', JSON.stringify(cartToSave))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [state.items, state.totalItems, state.totalAmount])

  // Auto-review cart when items change
  useEffect(() => {
    reviewCart()
  }, [state.items])

  return (
    <CartContext.Provider value={{
      state,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      reviewCart,
      applyPromotion,
      removePromotion
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
