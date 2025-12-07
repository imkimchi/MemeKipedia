/**
 * Utility functions for Memecore token operations
 */

/**
 * Sanitize wiki title to create a valid token symbol
 * - Convert to uppercase
 * - Remove special characters
 * - Limit to 6 characters for readability
 * - Ensure it starts with a letter
 *
 * @param title Wiki title
 * @returns Sanitized token symbol
 */
export function sanitizeTokenSymbol(title: string): string {
  // Remove special characters and spaces, keep only alphanumeric
  let symbol = title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim()

  // Ensure it starts with a letter
  if (symbol.length > 0 && /^[0-9]/.test(symbol)) {
    symbol = 'M' + symbol
  }

  // Default if empty
  if (symbol.length === 0) {
    symbol = 'MEME'
  }

  // Limit length (token symbols are typically 3-6 chars)
  return symbol.substring(0, 6)
}

/**
 * Generate token description from wiki category and title
 */
export function generateTokenDescription(title: string, category: string): string {
  return `${title} - A memecoin from the ${category} category on Memekipedia`
}

/**
 * Format token supply with proper decimals display
 */
export function formatTokenSupply(supply: bigint | string, decimals: number = 18): string {
  const supplyBigInt = typeof supply === 'string' ? BigInt(supply) : supply
  const divisor = BigInt(10 ** decimals)
  const whole = supplyBigInt / divisor
  return whole.toLocaleString()
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`
}
