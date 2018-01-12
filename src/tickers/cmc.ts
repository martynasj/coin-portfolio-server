import fetch from 'node-fetch'
import * as T from '../types'

// const coinmarketcapExampleTicker = {
//   id: 'raiden-network-token',
//   name: 'Raiden Network Token',
//   symbol: 'RDN',
//   rank: '99',
//   price_usd: '7.13571',
//   price_btc: '0.00044236',
//   '24h_volume_usd': '47245100.0',
//   market_cap_usd: '357848264.0',
//   available_supply: '50148936.0',
//   total_supply: '100000000.0',
//   max_supply: null,
//   percent_change_1h: '2.14',
//   percent_change_24h: '9.35',
//   percent_change_7d: '62.79',
//   last_updated: '1515354856',
// }

// partial interface
interface CoinmarketcapTicker {
  id: string
  name: string
  symbol: string
  price_usd: string
  price_btc: string
}

interface CmcTickerOptions {
  limit?: number
}

export async function getCMCTickers(options: CmcTickerOptions = {}): Promise<T.DefaultDBTicker[]> {
  const { limit } = options
  const cmcTickers = await fetchCoinmarketcapTickers(limit)
  const normalizedTickers = cmcTickers.map(ticker => normalizeCoinmarketcapTicker(ticker))
  return normalizedTickers
}

async function fetchCoinmarketcapTickers(limit = 100): Promise<CoinmarketcapTicker[]> {
  const url = `https://api.coinmarketcap.com/v1/ticker?limit=${limit}`
  const res = await fetch(url)
  const data: CoinmarketcapTicker[] = await res.json()
  return data
}

function normalizeCoinmarketcapTicker(ticker: CoinmarketcapTicker): T.DefaultDBTicker {
  return {
    id: ticker.symbol.toLowerCase(),
    name: ticker.name,
    symbol: ticker.symbol,
    priceBTC: parseFloat(ticker.price_btc),
    priceUSD: parseFloat(ticker.price_usd),
  }
}