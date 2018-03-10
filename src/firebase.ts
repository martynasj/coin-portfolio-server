const admin = require('firebase-admin')
const atob = require('atob')
// locally we read from .env but on heroku env everything should be set in env variables
require('dotenv').config()

const firebaseCred = JSON.parse(atob(process.env.FIREBASE_CRED))

export function init() {
  const config = {
    credential: admin.credential.cert(firebaseCred),
    databaseURL: 'https://shit-coin-portfolio.firebaseio.com',
    storageBucket: 'shit-coin-portfolio.appspot.com',
  }
  admin.initializeApp(config)
}
