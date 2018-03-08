import { init as initFirebase } from '../src/firebase'
import firebase from 'firebase-admin'
const historicalData = require('../data/btc-historical-data.json')

initFirebase()

interface HistoryEntry {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number|null
  mcap: number
}

const parseNumber = (value) => {
  const replaced = value.replace(/,/g, '')
  const numb = Number(replaced)
  return isNaN(numb) ? null : numb
}

function getFormattedData(): HistoryEntry[] {
  const formatted = historicalData.data.map(entry => {
    const historyEntry: HistoryEntry = {
      date: new Date(entry.date),
      open: parseNumber(entry.open)!,
      high: parseNumber(entry.high)!,
      low: parseNumber(entry.low)!,
      close: parseNumber(entry.close)!,
      volume: parseNumber(entry.volume),
      mcap: parseNumber(entry.mcap)!
    }
    return historyEntry
  })
  return formatted
}

async function main() {
  const formattedData = getFormattedData().slice(1500, 2000) // firebase allows max 500 batch sizes
  const batch = firebase.firestore().batch()
  formattedData.forEach(entry => {
    const ref = firebase.firestore().collection('historical-data').doc()
    batch.set(ref, entry)
  })
  await batch.commit()
}

main().then(() => { 
  console.log('done') 
  process.exit(0)
}).catch(err => {
  console.log(err)
  process.exit(1)
})