function toHHMMSS(ms) {
    var sec_num = parseInt(ms, 10); // don't forget the second param
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }

    if (hours === "00" && minutes === "00") {
        return seconds
    }

    if (hours === "00") {
        return minutes + ':' + seconds
    }

    return hours + ':' + minutes + ':' + seconds
}

function getUserFromMention(mention) {
    if (!mention) return

    if (mention.startsWith('<@') && mention.endsWith('>')) {
        mention = mention.slice(2, -1)

        if (mention.startsWith('!')) {
            mention = mention.slice(1)
        }

        return client.users.cache.get(mention)
    }
    return false
}

function setDefaultVoice(guildID, voiceChannelID) {
    registered.default_voice_channels[guildID] = voiceChannelID
    JSON.stringify(registered)
    fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}

function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    })
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
    if (!durationStr.endsWith('S')) {
        if (!durationStr.endsWith('M')) {
            durationStr += "0M0S"
        } else {
            durationStr += "0S"
        }
    }
    durationStr = durationStr.slice(2, -1)

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

module.exports = {
    toHHMMSS,
    getUserFromMention,
    setDefaultVoice,
    delay,
    ptToSeconds,
    sendFadingMessage,
    createProgressBar
}