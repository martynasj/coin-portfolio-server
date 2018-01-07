import * as Tickers from './tickers'

const updateIntervalInMins = 5

setInterval(() => {
  refetchTickers()
}, updateIntervalInMins * 60 * 1000)

function refetchTickers() {
  Tickers.updateTickers()
}