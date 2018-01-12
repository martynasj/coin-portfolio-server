export interface NormalizedTicker {
  symbolId: string // in our format
  priceUSD?: number
  priceBTC?: number
  priceETH?: number
}

export type NormalizedTickersKeyed = { [symbolId: string]: NormalizedTicker }

export interface DefaultDBTicker {
  id: string
  name: string
  symbol: string
  priceUSD: number
  priceBTC: number
}

export interface SpecificTicker {
  priceUSD?: number
  priceBTC?: number
}

export interface DBTicker extends DefaultDBTicker {
  bitfinex?: SpecificTicker
  bittrex?: SpecificTicker
  binance?: SpecificTicker
  kraken?: SpecificTicker
  coinexchange?: SpecificTicker
}