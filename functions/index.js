const functions = require('firebase-functions')

exports.branchChannel = functions.https.onRequest((request, response) => {
    const channel = ""
    requestCreateChannel(channel)
})

function requestCreateChannel(channel) {
    console.log("request create channel")
    return null
}