const functions = require('firebase-functions')
const { WebClient } = require('@slack/web-api')
const crypto = require('crypto');
const secureCompare = require('secure-compare');

const slack = new WebClient(functions.config().slack.api_key)

function getChannelName(branchName) {
    return branchName.replace('/', '_')
}

async function loadChannelId (branchName) {
    const list = await slack.channels.list()
    let channelId = ''
    list.channels.some((channel) => {
        if (channel.name === getChannelName(branchName)) {
            channelId = channel.id
            return true
        }
    })
    return channelId
}

function checkSignature(signature, body) {
    const cipher = 'sha1';
    const hmac = crypto.createHmac(cipher, functions.config().github.secret)
      .update(JSON.stringify(body, null, 0))
      .digest('hex');
    const expectedSignature = `${cipher}=${hmac}`;

    return secureCompare(signature, expectedSignature)
}

exports.createChannel = functions.https.onRequest(async (request, response) => {
    if (!checkSignature(request.headers['x-hub-signature'], request.body)) {
        response.status(403).send("not allowed access")
        return
    }

    if (request.headers["x-github-event"] === 'create'
        && request.body.ref_type === 'branch') {
        const channelName = getChannelName(request.body.ref)
        await slack.channels.create({
            name: channelName
        })
        response.status(200).send("create brach: " + channelName)
    } else {
        response.status(400).send("not support event")
    }
})

exports.archiveChannel = functions.https.onRequest(async (request, response) => {
    if (!checkSignature(request.headers['x-hub-signature'], request.body)) {
        response.status(403).send("not allowed access")
        return
    }

    if (request.headers["x-github-event"] === 'delete'
        && request.body.ref_type === 'branch') {
        const channelId = await loadChannelId(request.body.ref)
        if (channelId === '') {
            response.status(404).send("channel not found")
            return
        } 
        await slack.channels.archive({
            channel: channelId
        })
        response.status(200).send("create brach: " + channelId)    
    } else {
        response.status(400).send("not support event")
    }
})