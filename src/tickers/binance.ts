import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from '../types'
import { normalizeTickers } from './utils'

const url = 'https://api.binance.com/api/v1'

interface BinanceTicker {
  symbol: string  // e.g. ADABTC
  price: string
}

export async function getPreparedBinanceTickers(): Promise<T.NormalizedTickersKeyed> {
  const bitfinexTickers = await fetchBitfinexTickers()
  return normalizeTickers(bitfinexTickers, normalizeTicker)
}

async function fetchBitfinexTickers(): Promise<BinanceTicker[]> {
  const endpoint = '/ticker/allPrices'
  const result = await fetch(`${url}${endpoint}`)
  const json = await result.json()
  return json
}

function normalizeTicker(bittrexTicker: BinanceTicker): T.NormalizedTicker|null {
  const marketName = bittrexTicker.symbol
  const lastPrice = parseFloat(bittrexTicker.price)

  const isAgainstBTC = /btc$/i.test(marketName)
  const isAgainstUSDT = /usdt$/i.test(marketName)
  const isAgainstETH = /eth$/i.test(marketName)

  if (isAgainstBTC || isAgainstETH || isAgainstUSDT) {
    const ticker: T.NormalizedTicker = {
      symbolId: marketName.replace(/(eth|btc|usdt)$/i, '').toLowerCase(),
    }

    if (isAgainstBTC) {
      ticker.priceBTC = lastPrice
    } else if (isAgainstUSDT) {
      ticker.priceUSD = lastPrice
    } else {
      ticker.priceETH = lastPrice
    }

    return ticker as T.NormalizedTicker
  } else {
    // we don't support any other markets
    return null
  }
}