import axios from 'axios'
import * as admin from 'firebase-admin'
import * as firebase from 'firebase'
import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import * as Jimp from 'jimp'
const rimraf = require('rimraf-promise')
const urlData = require('./urls.json')
import { init } from '../src/firebase'

const projectId = 'shit-coin-portfolio'
const cwd = path.resolve(__dirname)
const tempImgDir = path.resolve(cwd, 'icons')

interface CoinToFetch {
  id: string
  url: string
}

interface CoinToUpdate {
  id: string
  thumbUrl: string
  imgUrl: string
}

async function main() {
  init()
  const ourCoins = await getTickersWithoutIcons()
  const coinsToFill = await getCoinInfoFromApi(ourCoins)

  if (coinsToFill.length === 0) {
    console.log('Nothing to update')
    return
  } else {
    console.log(`Found ${coinsToFill.length} without icons`)
  }

  for (const chunk of _.chunk(coinsToFill, 10)) {
    await Promise.all(chunk.map(coin => processImgAndSave(coin)))
  }

  await rimraf(tempImgDir)
}

async function processImgAndSave(coin: CoinToFetch) {
  console.log('processing: ', coin.id)
  try {
    const { originalPath, thumbPath } = await fetchAndMakeThumbnails(coin)
    const [imgUrl, thumbUrl] = await Promise.all([
      uploadImage(originalPath),
      uploadImage(thumbPath),
    ])
    await saveUrlsToDb({ id: coin.id, thumbUrl, imgUrl })
    console.log('urls uploaded and refs saved: ', coin.id)
  } catch (err) {
    console.log(err)
  }
}

async function saveUrlsToDb(coin: CoinToUpdate) {
  await admin
    .firestore()
    .collection('tickers')
    .doc(coin.id)
    .update({
      thumbUrl: coin.thumbUrl,
      imgUrl: coin.imgUrl,
    })
}

async function fetchAndMakeThumbnails(coin: CoinToFetch) {
  const fullName = _.last(coin.url.split('/'))!
  const name = _.first(fullName.split('.'))
  const img = await Jimp.read(coin.url)
  const originalPath = path.resolve(tempImgDir, fullName)
  const thumbPath = path.resolve(
    tempImgDir,
    name + '_thumb.' + img.getExtension()
  )
  const thumb = img.clone().resize(Jimp.AUTO, 64)
  await Promise.all([writeFile(img, originalPath), writeFile(thumb, thumbPath)])
  return {
    originalPath,
    thumbPath,
  }
}

function writeFile(img: Jimp, dir) {
  return new Promise((resolve, reject) => {
    img.write(dir, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}

async function uploadImage(localPath: string) {
  const iconsDir = 'icons'
  const fileName = _.last(localPath.split('/'))
  const destination = `${iconsDir}/${fileName}`
  const file = await admin
    .storage()
    .bucket()
    .upload(localPath, {
      destination,
    })
  await _.first(file)!.makePublic()
  const storageURL = `https://storage.googleapis.com/${projectId}.appspot.com/${destination}`
  return storageURL
}

async function getCoinInfoFromApi(
  filterCoins
): Promise<CoinToFetch[]> {
  const url = 'https://www.cryptocompare.com/api/data/coinlist/'
  const mediaPrefix = 'https://www.cryptocompare.com'
  const result = await axios.get(url)
  return _.chain(result.data.Data)
    .pick(filterCoins.map(coin => coin.symbol))
    .map((val, key) => ({
      url: mediaPrefix + val.ImageUrl,
      id: key.toLowerCase(),
    }))
    .value()
}

async function getTickersWithoutIcons() {
  const snap = await admin
    .firestore()
    .collection('tickers')
    .get()
  return _.chain(snap.docs)
    .map(doc => ({ ...doc.data(), id: doc.id }))
    .filter((ticker: any) => !ticker.imgUrl)
    .value()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
