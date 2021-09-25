function addChannel(channelID) {
    if (!registered.channels.includes(channelID))
        registered.channels.push(channelID)
    JSON.stringify(registered)
    fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}
function addReaction(message) {
    message.react('👍').then(() => {
        message.react('👎')
    })
}

function reactToAllMessage(channel) {
    channel.messages.fetch().then(messages => {
        for (const [snowflake, message] of messages) {
            addReaction(message)
        }
        console.log(`Reacted to ${messages.size} messages!`)
    })

}

// DEPRECATED on start.js
// client.on('message', message => {
// 	if (registered.channels.includes(message.channel.id)) {
// 		addReaction(message)
// 	}
// })

// DEPRECATED on start.js
// client.on('messageReactionAdd', roles.onReactEmoji)
// client.on('messageReactionRemove', roles.onDisreactEmoji);