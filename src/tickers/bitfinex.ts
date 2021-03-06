import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from '../types'

const url = 'https://api.bitfinex.com/v2'
const availableSymbols = [
  'btc', 'xrp', 'eth', 'ltc', 'bch', 'iota', 'eos', 'etc', 'neo', 'omg', 'snt',
  'zec', 'xmr', 'dash', 'qtum', 'etp', 'qash', 'btg', 'data', 'yyw', 'gnt', 'san',
  'edo', 'avt', 'rrt', 'trx',
]

// it makes: ['tXRPUSD', 'tXRPBTC', ...]
function makePairsFromSymbols(symbols: string[]): string[] {
  return _.chain(symbols)
    .map(symbol => {
      if (symbol === 'btc') {
        return ['tBTCUSD']
      } else {
        const uppercased = symbol.toUpperCase()
        return [`t${uppercased}USD`, `t${uppercased}BTC`, `t${uppercased}ETH`]
      }
    })
    .flatten()
    .value()
}

// Example ticker
// [
//   'tBTCUSD',
//   15542,
//   26.92808765,
//   15546,
//   42.07157606,
//   -1264,
//   -0.0752,
//   15542,
//   33515.13209291,
//   16829,
//   15510
// ]

// type BitfinexTicker = [
//   SYMBOL,
//   BID,
//   BID_SIZE,
//   ASK,
//   ASK_SIZE,
//   DAILY_CHANGE,
//   DAILY_CHANGE_PERC,
//   LAST_PRICE,
//   VOLUME,
//   HIGH,
//   LOW
// ]

type BitfinexTicker = Array<string|number>

export async function getPreparedBitfinexTickers(): Promise<T.NormalizedTickersKeyed> {
  const bitfinexTickers = await fetchBitfinexTickers()
  const prepared = normalizeResponse(bitfinexTickers)
  const bySymbolId = _.keyBy(prepared, 'symbolId')
  return bySymbolId
}

async function fetchBitfinexTickers(): Promise<BitfinexTicker[]> {
  const endpoint = '/tickers'
  const params = `?symbols=${makePairsFromSymbols(availableSymbols)}`
  const result = await fetch(`${url}${endpoint}${params}`)
  const json = await result.json()
  return json
}

// todo: convert to a general normalizer function
function normalizeResponse(bitfinexTickerArray: BitfinexTicker[]): T.NormalizedTicker[] {
  const result: T.NormalizedTicker[] = []
  const btc = {}

  bitfinexTickerArray.forEach(t => {
    const normalized = normalizeTicker(t)
    if (normalized.priceBTC) {
      btc[normalized.symbolId] = normalized
    } else if (normalized.priceUSD) {
      result.push(normalized)
    }
  })

  return result.map(t => {
    if (btc[t.symbolId]) {
      t.priceBTC = btc[t.symbolId].priceBTC
    }
    return t
  })
}

function normalizeTicker(bitfinexTicker: Array<string|number>): T.NormalizedTicker {
  const symbol = bitfinexTicker[0] as string
  const lastPrice = bitfinexTicker[7] as number

  const isAgainstBTC = /btc$/i.test(symbol)

  const ticker: any = {
    symbolId: symbol.slice(1).replace(/(usd|btc)$/i, '').toLowerCase(),
  }

  if (isAgainstBTC) {
    ticker.priceBTC = lastPrice
  } else {
    ticker.priceUSD = lastPrice
  }

  return ticker as T.NormalizedTicker
}