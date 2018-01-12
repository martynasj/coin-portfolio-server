import * as _ from 'lodash'
import fetch from 'node-fetch'
import * as T from '../types'
import { normalizeTickers } from './utils'

interface PoloniexTickerCollection {
  [market: string]: PoloniexRawTicker  // market e.g BTC_DOGE
}

interface PoloniexRawTicker {
  id: number
  last: string
  lowestAsk: string
  highestBid: string
  percentChange: string
  baseVolume: string
  quoteVolume: string
  isFrozen: string // "0" or ??
  high24hr: string
  low24hr: string
}

interface PoloniexTicker extends PoloniexRawTicker {
  market: string
}

export async function getPoloniexTickers(): Promise<T.NormalizedTickersKeyed> {
  const poloniexTickers = await fetchPoloniexTickers()
  const preparedResult = normalizeTickers(poloniexTickers, normalizeTicker)
  return preparedResult
}

async function fetchPoloniexTickers(): Promise<PoloniexTicker[]> {
  const url = 'https://poloniex.com/public?command=returnTicker'
  const res = await fetch(url)
  const json = await res.json()
  return _.map(json, (t: PoloniexRawTicker, key: string) => {
    return { ...t, market: key }
  })
}

function normalizeTicker(ticker: PoloniexTicker): T.NormalizedTicker|null {
  const [baseSymbol, symbol] = ticker.market.toLowerCase().split('_')
  const price = parseFloat(ticker.last)

  const normalized: T.NormalizedTicker = {
    symbolId: symbol,
  }

  if (baseSymbol === 'btc') {
    normalized.priceBTC = price
  } else if (baseSymbol === 'eth') {
    normalized.priceETH = price
  } else if (baseSymbol === 'usdt') {
    normalized.priceUSD = price
  } else {
    return null
  }

  return normalized
}