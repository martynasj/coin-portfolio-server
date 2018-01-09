import * as cmdArgs from 'command-line-args'
import { updateTickers } from '../tickers'

const optionDefinitions = [
  { name: 'limit', alias: 'l', type: Number },
]

const args = cmdArgs(optionDefinitions)

const top = args.limit || 100

updateTickers({ limit: top }).then(() => {
  console.log(`Top tickers ${top} updated`)
  console.log('exiting')
  process.exit(0)
}).catch(err => {
  console.log('error: ', err)
  console.log('exiting')
  process.exit(1)
})