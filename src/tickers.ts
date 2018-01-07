import fetch from 'node-fetch'

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

interface Ticker {
  id: string
  name: string
  symbol: string
  priceUSD: number
  priceBTC: number
}

// partial interface
interface CoinmarketcapTicker {
  id: string
  name: string
  symbol: string
  price_usd: string
  price_btc: string
}

export async function updateTickers() {
  try {
    const cmcTickers = await fetchCoinmarketcapTickers()
    const normalizedTickers = cmcTickers.map(ticker => normalizeCoinmarketcapTicker(ticker))
    const res = await updateTickersWithOwnData(normalizedTickers)
    console.log(res)
  } catch (err) {
    console.log(err)
  }
}

export async function updateTickersWithOwnData(tickers: Ticker[]) {
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

async function fetchCoinmarketcapTickers(): Promise<CoinmarketcapTicker[]> {
  const url = 'https://api.coinmarketcap.com/v1/ticker'
  const res = await fetch(url)
  const data: CoinmarketcapTicker[] = await res.json()
  return data
}

function normalizeCoinmarketcapTicker(ticker: CoinmarketcapTicker): Ticker {
  return {
    id: ticker.symbol.toLowerCase(),
    name: ticker.name,
    symbol: ticker.symbol,
    priceBTC: parseFloat(ticker.price_btc),
    priceUSD: parseFloat(ticker.price_usd),
  }
}