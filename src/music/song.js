const { demuxProbe, createAudioResource } = require("@discordjs/voice");
const ytdl = require("youtube-dl-exec").raw;
const { getInfo } = require('ytdl-core')

class Song {
    constructor(videoId, title, thumbnail, duration, channelName, requestedBy) {
        this.videoId = videoId;
        this.title = title;
        this.thumbnail = thumbnail;
        this.duration = duration;
        this.channelName = channelName;
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
                    r: '100K',
                },
                { stdio: ['ignore', 'pipe', 'ignore'] },
            );
            if (!process.stdout) {
                reject(new Error('No stdout'));
                return;
            }
            const stream = process.stdout;
            const onError = (error) => {
                if (!process.killed) process.kill();
                stream.resume();
                reject(error);
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
    getReadableDuration() {

        if (this.duration < 3600) {
            return new Date(this.duration * 1000).toISOString().substr(14, 5)
        } else {
            return new Date(this.duration * 1000).toISOString().substr(11, 8)
        }
    }

    flattenForQueue() {
        let readableDuration = this.getReadableDuration()
        return `[${this.title}](${this.getVideoURL()}) ║ ${readableDuration}\n`
    }

    static async from(videoId) {
        const info = await getInfo(videoId)
        return new Song(
            videoId,
            info.videoDetails.title,
            info.videoDetails.thumbnails.slice(-1)[0],
            info.videoDetails.lengthSeconds,
            info.videoDetails.ownerChannelName,
        )
    }
}

module.exports = Song