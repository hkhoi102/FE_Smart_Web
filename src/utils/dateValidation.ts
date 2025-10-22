/**
 * Utility functions for date validation in promotion system
 */

export interface DateValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate promotion dates
 * @param startDate - Start date string (YYYY-MM-DD format)
 * @param endDate - End date string (YYYY-MM-DD format) - optional
 * @param allowPastStartDate - Whether to allow start date in the past (default: false)
 * @returns DateValidationResult with validation status and error messages
 */
export function validatePromotionDates(
  startDate: string,
  endDate?: string,
  allowPastStartDate: boolean = false
): DateValidationResult {
  const errors: string[] = []
  
  // Check if start date is provided
  if (!startDate || startDate.trim() === '') {
    errors.push('Ngày bắt đầu là bắt buộc')
    return { isValid: false, errors }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  const startDateObj = new Date(startDate)
  const endDateObj = endDate ? new Date(endDate) : null

  // Validate start date format
  if (isNaN(startDateObj.getTime())) {
    errors.push('Ngày bắt đầu không hợp lệ')
    return { isValid: false, errors }
  }

  // Check if start date is in the past (if not allowed)
  if (!allowPastStartDate && startDateObj < today) {
    errors.push('Ngày bắt đầu không được trong quá khứ')
  }

  // Validate end date if provided
  if (endDate && endDate.trim() !== '') {
    if (isNaN(endDateObj!.getTime())) {
      errors.push('Ngày kết thúc không hợp lệ')
    } else if (endDateObj! <= startDateObj) {
      errors.push('Ngày kết thúc phải sau ngày bắt đầu')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate multiple promotion line dates
 * @param lines - Array of promotion line objects with startDate and endDate
 * @returns DateValidationResult with validation status and error messages
 */
export function validatePromotionLinesDates(lines: Array<{
  lineStartDate?: string
  lineEndDate?: string
  targetType?: string
  targetId?: number
}>): DateValidationResult {
  const errors: string[] = []
  
  lines.forEach((line, index) => {
    if (line.lineStartDate || line.lineEndDate) {
      const result = validatePromotionDates(
        line.lineStartDate || '',
        line.lineEndDate,
        true // Allow past dates for lines
      )
      
      if (!result.isValid) {
        result.errors.forEach(error => {
          errors.push(`Dòng ${index + 1}: ${error}`)
        })
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format date for display in Vietnamese locale
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Check if a date is in the past
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false
  
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return date < today
}
