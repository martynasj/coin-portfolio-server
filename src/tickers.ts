import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from './types'
import * as bitfinex from './tickers/bitfinex'
import * as bittrex from './tickers/bittrex'

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

interface SpecificTicker {
  priceUSD?: number
  priceBTC?: number
}

type KeyedSpecificTickers = T.NormalizedTickersKeyed

type ExchangeTickers = {
  bitfinex?: T.NormalizedTickersKeyed
  bittrex?: T.NormalizedTickersKeyed
}

interface DBTicker {
  id: string
  name: string
  symbol: string
  priceUSD: number
  priceBTC: number
  bitfinex?: SpecificTicker
  bittrex?: SpecificTicker
  binance?: SpecificTicker
  kraken?: SpecificTicker
}

// partial interface
interface CoinmarketcapTicker {
  id: string
  name: string
  symbol: string
  price_usd: string
  price_btc: string
}

interface Options {
  limit?: number
}

export async function updateTickers(options: Options = {}) {
  const { limit } = options

  try {
    const cmcTickers = await getCMCTickers({ limit })
    const bitfinexTickers = await bitfinex.getPreparedBitfinexTickers()
    const bittrexTickers = await bittrex.getPreparedTickers()

    const combinedTickers = combineTickers(cmcTickers, {
      bitfinex: bitfinexTickers,
      bittrex: bittrexTickers,
    })

    const res = await updateTickersWithOwnData(combinedTickers)
    console.log(res)
  } catch (err) {
    console.log(err)
  }
}

function combineTickers(defaultTickers: DBTicker[], exchangeTickers: ExchangeTickers): DBTicker[] {
  const { bitfinex, bittrex } = exchangeTickers
  return _.map(defaultTickers, t => {
    // todo: simplify this
    const bitfinexTicker = bitfinex && bitfinex[t.id]
    const bittrexTicker = bittrex && bittrex[t.id]
    if (bitfinexTicker) {
      t.bitfinex = removeUndefinedValues({
        priceBTC: bitfinexTicker.priceBTC,
        priceUSD: bitfinexTicker.priceUSD,
      })
    }
    if (bittrexTicker) {
      t.bittrex = removeUndefinedValues({
        priceBTC: bittrexTicker.priceBTC,
        priceUSD: bittrexTicker.priceUSD,
        priceETH: bittrexTicker.priceETH,
      })
    }
    return t
  })
}

async function updateTickersWithOwnData(tickers: DBTicker[]) {
  const endpoint = 'https://us-central1-shit-coin-portfolio.cloudfunctions.net/updateTickersWithOwnData'
  const res = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ tickers }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return await res.text()
}

interface CmcTickerOptions {
  limit?: number
}

async function getCMCTickers(options: CmcTickerOptions = {}): Promise<DBTicker[]> {
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

function normalizeCoinmarketcapTicker(ticker: CoinmarketcapTicker): DBTicker {
  return {
    id: ticker.symbol.toLowerCase(),
    name: ticker.name,
    symbol: ticker.symbol,
    priceBTC: parseFloat(ticker.price_btc),
    priceUSD: parseFloat(ticker.price_usd),
  }
}

function removeUndefinedValues(object) {
  return _.omitBy(object, _.isUndefined)
}