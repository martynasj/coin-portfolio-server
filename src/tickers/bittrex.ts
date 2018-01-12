import * as _ from 'lodash'
import fetch from 'node-fetch'
import * as T from '../types'
import { normalizeTickers } from './utils'

// "MarketName": "BTC-AMP",
// "High": 0.00006485,
// "Low": 0.0000572,
// "Volume": 3846179.58849562,
// "Last": 0.00006354,
// "BaseVolume": 236.19856227,
// "TimeStamp": "2018-01-08T20:58:36.163",
// "Bid": 0.00006221,
// "Ask": 0.00006345,
// "OpenBuyOrders": 572,
// "OpenSellOrders": 6070,
// "PrevDay": 0.00006132,
// "Created": "2015-11-03T19:13:55.18"

interface BittrexTicker {
  MarketName: string
  High: number
  Low: number
  Volume: number
  Last: number
  BaseVolume: number
  TimeStamp: string
  Bid: number
  Ask: number
  OpenBuyOrders: number
  OpenSellOrders: number
  PrevDay: number
  Created: string
}

export async function getPreparedTickers(): Promise<T.NormalizedTickersKeyed> {
  const bitfinexTickers = await fetchBittrexTickers()
  const preparedResult = normalizeTickers(bitfinexTickers, normalizeTicker)
  return preparedResult
}

async function fetchBittrexTickers(): Promise<BittrexTicker[]> {
  const apiUrl = 'https://bittrex.com/api/v1.1'
  const endpoint = '/public/getmarketsummaries'
  const res = await fetch(`${apiUrl}${endpoint}`)
  const json = await res.json()
  return json.result as BittrexTicker[]
}

function normalizeTicker(bittrexTicker: BittrexTicker): T.NormalizedTicker|null {
  const marketName = bittrexTicker.MarketName
  const lastPrice = bittrexTicker.Last

  const isAgainstBTC = /^btc-/i.test(marketName)
  const isAgainstUSDT = /^usdt-/i.test(marketName)
  const isAgainstETH = /^eth-/i.test(marketName)

  if (isAgainstBTC || isAgainstETH || isAgainstUSDT) {
    const ticker: any = {
      symbolId: marketName.replace(/.*-/i, '').toLowerCase(),
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