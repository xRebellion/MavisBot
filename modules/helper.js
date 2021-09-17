
function getUserFromMention(mention) {
    if (!mention) return;

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1);

        if (mention.startsWith('!')) {
            mention = mention.slice(1);
        }

        return client.users.cache.get(mention);
    }
    return false;
}

function setDefaultVoice(guildID, voiceChannelID) {
    registered.default_voice_channels[guildID] = voiceChannelID;
    JSON.stringify(registered);
    fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
    });
}

function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

function sendFadingMessage(textChannel, waitDelay, message) {
    textChannel.send(message).then(msg => {
        delay(waitDelay).then(() => {
            msg.delete()
        })
    })
}

function ptToSeconds(durationStr) {
    if (!durationStr.startsWith('PT')) {
        return -1
    }
    durationStr = durationStr.slice(2, -1) // removes PT and S

    let durationArray = durationStr.split(/H|M/)

    // Padding
    while (durationArray.length < 3) {
        durationArray.unshift("0")
    }

    return parseInt(durationArray[0]) * 3600 + parseInt(durationArray[1]) * 60 + parseInt(durationArray[2])
}

module.exports = {
    getUserFromMention,
    setDefaultVoice,
    delay,
    ptToSeconds,
    sendFadingMessage
}