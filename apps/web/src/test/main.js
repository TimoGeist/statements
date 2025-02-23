const express = require('express')
const app = express()
const fs = require("fs")
const https = require("https")
const http = require("http")
const sslSettings = require("./ssl.json")

app.use(express.static("./static-shared/"))
app.get('/', function (req, res) {
    console.log(req.url)
    res.send("hi")
    return
})

const base64cert = sslSettings.letsencrypt.Certificates[0].certificate;
const base64key = sslSettings.letsencrypt.Certificates[0].key;
const cert = new Buffer.alloc(Math.ceil(base64cert.length * 0.75), base64cert, 'base64').toString(); // Ta-da
const key = new Buffer.alloc(Math.ceil(base64key.length * 0.75), base64key, 'base64').toString(); // Ta-da
// const cert =
// const cert = "-----BEGIN CERTIFICATE-----\r\n" + sslSettings.letsencrypt.Certificates[0].certificate + "\r\n-----END CERTIFICATE-----"
// const key = "-----BEGIN PRIVATE KEY-----\r\n" + sslSettings.letsencrypt.Certificates[0].key + "\r\n-----END PRIVATE KEY-----"
// const key2 = "-----BEGIN PRIVATE KEY-----\r\n" + sslSettings.letsencrypt.Account.PrivateKey + "\r\n-----END PRIVATE KEY-----"

const options = {
    key,
    cert,
    checkServerIdentity: () => { return null; }, // Necessary only if the server's cert isn't for "localhost".
    // ca: [ fs.readFileSync('ssl/chain.pem') ],
}
http.createServer(app).listen(9080)
https.createServer(options, app).listen(9443, () => console.log("listening"))