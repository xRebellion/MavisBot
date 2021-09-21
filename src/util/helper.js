
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

function createProgressBar(min, max, empty, filled) {
    let placeholder = "[]"
    let bar = ""
    let timeProgress = `(${_msToReadableDuration(min)} / ${_msToReadableDuration(max)})`

    const maxBars = 20
    let currentProgress = (min / max) * maxBars
    for (let i = 0; i < currentProgress && i < maxBars; i++) {
        bar = bar + filled
    }
    for (let i = currentProgress; i < maxBars; i++) {
        bar = bar + empty
    }
    bar = placeholder[0] + bar + placeholder[1] + " " + timeProgress
    return bar
}
function _msToReadableDuration(ms) {
    if (ms == 0) return "00:00"
    if (ms < 3600 * 1000) {
        return new Date(ms).toISOString().substr(14, 5)
    } else {
        return new Date(ms).toISOString().substr(11, 8)
    }
}
function handleReply(messageOrInteraction, text) {
    if (messageOrInteraction instanceof Message) {
        messageOrInteraction.channel.send(text);
    } else {
        messageOrInteraction.reply(text)
    }
}

module.exports = {
    getUserFromMention,
    setDefaultVoice,
    delay,
    ptToSeconds,
    sendFadingMessage,
    createProgressBar,
    handleReply
}