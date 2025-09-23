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
      throw new Error(`Failed to add barcode: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
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
