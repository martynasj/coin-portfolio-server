var admin = require("firebase-admin");

var serviceAccount = require("../fb-key.json");

export function init() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://shit-coin-portfolio.firebaseio.com"
  });
}