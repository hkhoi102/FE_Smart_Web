import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Product } from '../services/productService'

export interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

type CartAction = 
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_COUPON'; payload: string }

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }]
      }

      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems,
        totalAmount
      }
    }

    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.id !== action.payload)
      const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        items: newItems,
        totalItems,
        totalAmount
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
        totalAmount
      }
    }

    case 'CLEAR_CART':
      return initialState

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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

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
  }

  return (
    <CartContext.Provider value={{
      state,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
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
