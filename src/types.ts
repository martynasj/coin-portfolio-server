export interface NormalizedTicker {
  symbolId: string // in our format
  priceUSD?: number
  priceBTC?: number
  priceETH?: number
}

export type NormalizedTickersKeyed = { [symbolId: string]: NormalizedTicker }
