const { createAudioResource } = require("@discordjs/voice")
const playdl = require("play-dl")
const { getInfo } = require('ytdl-core')

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
    getReadableDuration() {

        if (this.duration < 3600) {
            return new Date(this.duration * 1000).toISOString().substring(14, 5)
        } else {
            return new Date(this.duration * 1000).toISOString().substring(11, 8)
        }
    }

    flattenForQueue() {
        let readableDuration = this.getReadableDuration()
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