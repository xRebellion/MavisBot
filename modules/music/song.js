const { AudioResource, demuxProbe, createAudioResource } = require("@discordjs/voice");
const ytdl = require("youtube-dl-exec").raw;

class Song {
    constructor(videoId, title, thumbnails, duration, channelName, onStart, onFinish, onError) {
        this.videoId = videoId;
        this.title = title;
        this.thumbnailUrl = thumbnails[((thumbnails.length - 2) < 0) ? 0 : thumbnails.length - 2];
        this.duration = duration;
        this.owner = channelName;
        this.onStart = onStart;
        this.onFinish = onFinish;
        this.onError = onError;
    }

    createAudioResource() {
        return new Promise((resolve, reject) => {
            const process = ytdl(
                this._getVideoURL(),
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

    _getVideoURL() {
        return "https://www.youtube.com/watch?v=" + this.videoId
    }

    _getReadableDuration() {
        if (this.duration < 0) {
            return undefined
        }

        if (this.duration < 3600) {
            return new Date(this.duration * 1000).toISOString().substr(14, 5)
        } else {
            return new Date(this.duration * 1000).toISOString().substr(11, 8)
        }
    }

    flattenForQueue() {
        let readableDuration = this._getReadableDuration()
        return `[${this.title}](${this._getVideoURL()}) ║ ${readableDuration}\n`
    }

}

module.exports = Song