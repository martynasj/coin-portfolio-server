var admin = require('firebase-admin')

var serviceAccount = require('../fb-key.json')

export function init() {
  const config = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://shit-coin-portfolio.firebaseio.com',
    storageBucket: 'shit-coin-portfolio.appspot.com',
  }
  admin.initializeApp(config)
}
