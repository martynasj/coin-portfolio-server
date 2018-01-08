import * as Tickers from './tickers'

const updateIntervalInMins = 10

// Process Starts Here
function main() {
  initRefetchingProcess()
}

function initRefetchingProcess() {
  Tickers.updateTickers()
  setInterval(() => {
    Tickers.updateTickers()
  }, updateIntervalInMins * 60 * 1000)
}

main()