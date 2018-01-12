import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from '../types'

const url = 'https://api.binance.com/api/v1'

interface BinanceTicker {
  symbol: string  // e.g. ADABTC
  price: string
}

export async function getPreparedBinanceTickers(): Promise<T.NormalizedTickersKeyed> {
  const bitfinexTickers = await fetchBitfinexTickers()
  return normalizeTickers(bitfinexTickers)
}

async function fetchBitfinexTickers(): Promise<BinanceTicker[]> {
  const endpoint = '/ticker/allPrices'
  const result = await fetch(`${url}${endpoint}`)
  const json = await result.json()
  return json
}

function normalizeTickers(binanceTickers: BinanceTicker[]): T.NormalizedTickersKeyed {
  const btc = {}
  const eth = {}
  const usd = {}

  binanceTickers.forEach(t => {
    const normalized = normalizeTicker(t)
    if (!normalized) {
      return
    }
    if (normalized.priceBTC) {
      btc[normalized.symbolId] = normalized
    } else if (normalized.priceUSD) {
      usd[normalized.symbolId] = normalized
    } else {
      eth[normalized.symbolId] = normalized
    }
  })

  const merged = _.merge({}, btc, eth, usd)
  return merged as T.NormalizedTickersKeyed
}

function normalizeTicker(bittrexTicker: BinanceTicker): T.NormalizedTicker|null {
  const marketName = bittrexTicker.symbol
  const lastPrice = bittrexTicker.price

  const isAgainstBTC = /btc$/i.test(marketName)
  const isAgainstUSDT = /usdt$/i.test(marketName)
  const isAgainstETH = /eth$/i.test(marketName)

  if (isAgainstBTC || isAgainstETH || isAgainstUSDT) {
    const ticker: any = {
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