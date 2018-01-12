import * as _ from 'lodash'
import fetch from 'node-fetch'
import * as T from '../types'
import { normalizeTickers } from './utils'

const availableMarkets = [
  'BCH-USD',
  // 'LTC-EUR',
  'LTC-USD',
  'LTC-BTC',
  // 'ETH-EUR',
  'ETH-USD',
  'ETH-BTC',
  // 'BTC-GBP',
  // 'BTC-EUR',
  'BTC-USD',
]

interface GdaxTickerRaw {
  trade_id: number
  price: string
  size: string
  bid: string
  ask: string
  volume: string
  time: string
}

interface GdaxTicker extends GdaxTickerRaw {
  market: string
}

async function wait(ms: number) {
  return new Promise(res => {
    setTimeout(() => { res() }, ms)
  })
}

export async function getGdaxTickers(): Promise<T.NormalizedTickersKeyed> {
  const firstBatch = ['BCH-USD', 'LTC-USD', 'LTC-BTC',].map(market => {
    return fetchGdaxPair(market)
  })

  // gdax api has call limit rates...
  await wait(2000)

  const secondBatch = ['ETH-USD', 'ETH-BTC', 'BTC-USD'].map(market => {
    return fetchGdaxPair(market)
  })

  const responses = await Promise.all([...firstBatch, ...secondBatch])
  const normalized = normalizeTickers(responses, normalizeTicker)
  return normalized
}

async function fetchGdaxPair(pair: string): Promise<GdaxTicker> {
  const url = `https://api.gdax.com/products/${pair}/ticker`
  const res = await fetch(url)
  const json: GdaxTickerRaw = await res.json()
  return {
    ...json,
    market: pair,
  }
}

function normalizeTicker(ticker: GdaxTicker): T.NormalizedTicker|null {
  const price = parseFloat(ticker.price)
  const [symbol, baseSymbol] = ticker.market.toLowerCase().split('-')

  const normalized: T.NormalizedTicker = {
    symbolId: symbol,
  }

  if (baseSymbol === 'usd') {
    normalized.priceUSD = price
  } else if (baseSymbol === 'btc') {
    normalized.priceBTC = price
  } else if (baseSymbol === 'eth') {
    normalized.priceETH = price
  } else {
    return null
  }

  return normalized
}