const { demuxProbe, createAudioResource } = require("@discordjs/voice")
const ytdl = require("youtube-dl-exec").exec
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
        return new Promise((resolve, reject) => {
            const process = ytdl(
                this.videoId,
                {
                    o: '-',
                    q: '',
                    f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
                },
            )
            if (!process.stdout) {
                reject(new Error('No stdout'))
                return
            }
            const stream = process.stdout
            const onError = (error) => {
                if (!process.killed) process.kill()
                stream.resume()
                reject(error)
            }
            process.once('spawn', () => {
                demuxProbe(stream)
                    .then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
                    .catch(onError)
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