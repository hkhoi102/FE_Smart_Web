/**
 * Barcode management service
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export interface BarcodeDto {
  id: number
  productUnitId: number
  code: string
  type: string
  createdAt: string
  updatedAt: string
}

export interface CreateBarcodeRequest {
  productUnitId: number
  code: string
  type: string
}

export const BarcodeService = {
  /**
   * Add barcode to product unit
   */
  async addBarcode(productUnitId: number, code: string, type: string = 'EAN13'): Promise<BarcodeDto> {
    const response = await fetch(`${API_BASE_URL}/products/units/${productUnitId}/barcodes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code, type })
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      let errorMessage = text || `Failed to add barcode: ${response.status} ${response.statusText}`

      // Xử lý lỗi 400 - trùng mã barcode
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(text)
          console.log('🔍 Backend error response (barcode):', errorData)
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON (barcode):', text)
          if (text && text.trim()) {
            errorMessage = text
          }
        }
      }

      const error = new Error(errorMessage) as any
      error.status = response.status
      throw error
    }

    const result = await response.json()
    return result.data
  },

  /**
   * Get barcodes by product unit id
   */
  async getBarcodesByProductUnit(productUnitId: number): Promise<BarcodeDto[]> {
    const response = await fetch(`${API_BASE_URL}/products/units/${productUnitId}/barcodes`, {
      method: 'GET',
      headers: authHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get barcodes: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  },

  /**
   * Fallback: Get barcodes by product + productUnit id (for some BE routes)
   */
  async getBarcodesByProductAndUnit(productId: number, productUnitId: number): Promise<BarcodeDto[]> {
    // Backend hiện có endpoint: GET /api/products/{productId}/barcodes
    // Ta gọi endpoint đó rồi lọc theo productUnitId
    const response = await fetch(`${API_BASE_URL}/products/${productId}/barcodes`, {
      method: 'GET',
      headers: authHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get barcodes: ${response.statusText}`)
    }

    const result = await response.json().catch(() => ({} as any))
    const arr = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : [])
    return arr.filter((b: any) => (b?.productUnitId ?? b?.product_unit_id) === productUnitId)
      .map((b: any) => ({
        id: b.id,
        productUnitId: b.productUnitId ?? b.product_unit_id,
        code: b.code,
        type: b.type ?? 'EAN13',
        createdAt: b.createdAt ?? b.created_at ?? '',
        updatedAt: b.updatedAt ?? b.updated_at ?? ''
      }))
  },

  /**
   * Delete barcode
   */
  async deleteBarcode(barcodeId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/barcodes/${barcodeId}`, {
      method: 'DELETE',
      headers: authHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to delete barcode: ${response.statusText}`)
    }
  },

  /**
   * Get product by barcode
   */
  async getProductByBarcode(code: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/products/by-code/${code}`, {
      method: 'GET',
      headers: authHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to get product by barcode: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  }
}
