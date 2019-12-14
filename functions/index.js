const functions = require('firebase-functions')
const { WebClient } = require('@slack/web-api')

const slack = new WebClient(functions.config().slack.api_key)

function getChannelName(branchName) {
    return branchName.replace('/', '_')
}

exports.branchChannel = functions.https.onRequest(async (request, response) => {
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