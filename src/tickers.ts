import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from './types'
import * as bitfinex from './tickers/bitfinex'
import * as bittrex from './tickers/bittrex'
import * as binance from './tickers/binance'
import * as coinexchange from './tickers/coinexchange'
import * as cmc from './tickers/cmc'
import * as poloniex from './tickers/poloniex'
import * as gdax from './tickers/gdax'

type KeyedSpecificTickers = T.NormalizedTickersKeyed

type ExchangeTickers = {
  bitfinex?: T.NormalizedTickersKeyed
  bittrex?: T.NormalizedTickersKeyed
  binance?: T.NormalizedTickersKeyed
  coinexchange?: T.NormalizedTickersKeyed
  poloniex?: T.NormalizedTickersKeyed
  gdax?: T.NormalizedTickersKeyed
}

interface Options {
  limit?: number
}

export async function updateTickers(options: Options = {}) {
  try {
    const combinedTickers = await collectExchangeTickers(options)
    const res = await updateFirebaseWithNewData(combinedTickers)
  } catch (err) {
    console.log(err)
  }
}

async function collectExchangeTickers(options: Options = {}) {
  const cmcTickers = await cmc.getCMCTickers({ limit: options.limit })
  const bitfinexTickers = await bitfinex.getPreparedBitfinexTickers()
  const bittrexTickers = await bittrex.getPreparedTickers()
  const binanceTickers = await binance.getPreparedBinanceTickers()
  const coinexchangeTickers = await coinexchange.getPreparedCoinexchangeTickers()
  const poloniexTickers = await poloniex.getPoloniexTickers()
  const gdaxTickers = await gdax.getGdaxTickers()

  const combinedTickers = combineTickers(cmcTickers, {
    bitfinex: bitfinexTickers,
    bittrex: bittrexTickers,
    binance: binanceTickers,
    coinexchange: coinexchangeTickers,
    poloniex: poloniexTickers,
    gdax: gdaxTickers,
  })

  return combinedTickers
}


function combineTickers(defaultTickers: T.DefaultDBTicker[], exchangeTickers: ExchangeTickers): T.DBTicker[] {
  const { bitfinex, bittrex, coinexchange, binance } = exchangeTickers
  return _.map(defaultTickers, defaultTicker => {
    _.forEach(exchangeTickers, (keyedTickers, exchangeId) => {
      if (keyedTickers && keyedTickers[defaultTicker.id]) {
        const exchangeTicker = keyedTickers[defaultTicker.id]
        defaultTicker[exchangeId] = removeUndefinedValues({
          priceBTC: exchangeTicker.priceBTC,
          priceUSD: exchangeTicker.priceUSD,
          priceETH: exchangeTicker.priceETH,
        })
      }
    })
    return defaultTicker
  })
}


async function updateFirebaseWithNewData(tickers: T.DBTicker[]) {
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

function removeUndefinedValues(object) {
  return _.omitBy(object, _.isUndefined)
}