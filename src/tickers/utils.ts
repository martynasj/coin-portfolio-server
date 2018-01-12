import * as _ from 'lodash'
import * as T from '../types'

export function normalizeTickers<T>(
  apiTickerArray: Array<T>,
  normalizer: (ticker: T) => T.NormalizedTicker|null,
): T.NormalizedTickersKeyed {
  const btc = {}
  const eth = {}
  const usd = {}

  apiTickerArray.forEach(t => {
    const normalized = normalizer(t)
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