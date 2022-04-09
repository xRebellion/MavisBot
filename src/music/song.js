const { createAudioResource } = require("@discordjs/voice")
const playdl = require("play-dl")
const { getInfo } = require('ytdl-core')
const helper = require('../util/helper')


class Song {
    constructor(videoId, title, thumbnail, duration, channelName, requestedBy) {
        this.videoId = videoId
        this.title = title
        this.thumbnail = thumbnail
        this.duration = duration
        this.channelName = channelName
        this.owner = requestedBy
    }

    createAudioResource() {
        return new Promise((resolve) => {
            playdl.stream(this.getVideoURL()).then(stream => {
                resolve(createAudioResource(stream.stream, { metadata: this, inputType: stream.type }))
            })
        })
    }

    getVideoURL() {
        return "https://www.youtube.com/watch?v=" + this.videoId
    }

    flattenForQueue() {
        let readableDuration = helper.toHHMMSS(this.duration)
        return `[${this.title}](${this.getVideoURL()}) ║ ${readableDuration}\n`
    }

    static async from(videoId, requester) {
        const info = await getInfo(videoId)
        return new Song(
            videoId,
            info.videoDetails.title,
            info.videoDetails.thumbnails.slice(-1)[0],
            info.videoDetails.lengthSeconds,
            info.videoDetails.ownerChannelName,
            requester
        )
    }
}

module.exports = Song