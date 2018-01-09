import * as Tickers from './tickers'

const updateIntervalInMins = 10

// Process Starts Here
function main() {
  // initRefetchingProcess()
  Tickers.updateTickers()
}

function initRefetchingProcess() {
  Tickers.updateTickers({ limit: 500 })
  setInterval(() => {
    Tickers.updateTickers()
  }, updateIntervalInMins * 60 * 1000)
}

main()