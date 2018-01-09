import * as Tickers from './tickers'

const updateIntervalInMins = 10

// Process Starts Here
function main() {
  // initRefetchingProcess()
  Tickers.updateTickers().then(() => {
    console.log('tickers updated')
    console.log('exiting')
    process.exit(0)
  }).catch(err => {
    console.log('error: ', err)
    console.log('exiting')
    process.exit(1)
  })
}

function initRefetchingProcess() {
  Tickers.updateTickers({ limit: 500 })
  setInterval(() => {
    Tickers.updateTickers()
  }, updateIntervalInMins * 60 * 1000)
}

main()