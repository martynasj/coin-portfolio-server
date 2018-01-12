import fetch from 'node-fetch'
import * as _ from 'lodash'
import * as T from '../types'
import { normalizeTickers } from './utils'

const url = 'https://www.coinexchange.io/api/v1'

interface Market {
  MarketID: string
  MarketAssetName: string // e.g. Litecoin
  MarketAssetCode: string // e.g. LTC
  MarketAssetID: string
  MarketAssetType: string
  BaseCurrency: string // e.g. Bitcoin
  BaseCurrencyCode: string // e.g. BTC
  BaseCurrencyID: string
  Active: boolean
}

interface Ticker {
  MarketID: string
  LastPrice: string
  Change: string // percentage, e.g. "-11.50"
  HighPrice: string
  LowPrice: string
  Volume: string
  BTCVolume: string
  TradeCount: string
  BidPrice: string
  AskPrice: string
  BuyOrderCount: string
  SellOrderCount: string
}

interface ResolvedTicker extends Ticker {
  market: Market|null
}

export async function getPreparedCoinexchangeTickers(): Promise<T.NormalizedTickersKeyed> {
  const markets = await fetchAllMarkets()
  const tickers = await fetchTickers()
  const resolvedTickers = resolveTickers(tickers, markets)
  return normalizeTickers(resolvedTickers, normalizeTicker)
}

async function fetchAllMarkets(): Promise<Market[]> {
  const endpoint = '/getmarkets'
  const res = await fetch(`${url}${endpoint}`)
  const json = await res.json()
  return json.result as Market[]
}

async function fetchTickers(): Promise<any> {
  const endpoint = '/getmarketsummaries'
  const res = await fetch(`${url}${endpoint}`)
  const json = await res.json()
  return json.result as Ticker[]
}

function resolveTickers(tickers: Ticker[], markets: Market[]): ResolvedTicker[] {
  const keydMarkets = _.keyBy(markets, 'MarketID')
  return _.map(tickers, t => {
    return { ...t, market: keydMarkets[t.MarketID] || null }
  })
}

function normalizeTicker(ticker: ResolvedTicker): T.NormalizedTicker|null {
  if (!ticker.market || !ticker.market.Active) {
    return null
  }

  const { LastPrice } = ticker
  const price = parseFloat(LastPrice)
  const { BaseCurrencyCode, MarketAssetCode } = ticker.market

  const normalizedTicker: T.NormalizedTicker = {
    symbolId: MarketAssetCode.toLowerCase(),
  }

  if (BaseCurrencyCode === 'BTC') {
    normalizedTicker.priceBTC = price
  } else if (BaseCurrencyCode === 'ETH') {
    normalizedTicker.priceETH = price
  } else {
    return null
  }

  return normalizedTicker
}