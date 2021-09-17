const auth = require('../../data/auth.json');
const helper = require('../helper')

const MusicQueue = require("./queue");
const Song = require("./song.js");
const axios = require('axios').default;
const MusicQueueEmbed = require('./embed/queue_embed');
const MusicPlayerEmbed = require('./embed/player_embed');
const EnqueueEmbed = require('./embed/enqueue_embed')
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"
const YOUTUBE_PLAYLIST_API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v="
const YOUTUBE_PLAYLIST_URL = "https://www.youtube.com/playlist?list="
// TODO: Create module for embed-type music player
class MusicPlayer {

    constructor(textChannel, voiceChannel, volume) {
        this.textChannel = textChannel
        this.voiceChannel = voiceChannel;
        this.audioPlayer = createAudioPlayer();
        this.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        this.volume = volume;
        this.musicQueue = new MusicQueue([])
        this.playerEmbed = new MusicPlayerEmbed(textChannel)
        this.queueLock = false;

        this.playerEmbed.send(this.musicQueue.nowPlaying);
        // Configure audio player
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                void this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                this.playerEmbed.resend(this.musicQueue.nowPlaying)
            }
        });

        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                this.playerEmbed.destroy();
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                this.playerEmbed.destroy();
            }
        })
        this.voiceConnection.subscribe(this.audioPlayer)
    }

    async enqueue(message, queueNumber) {
        const args = message.content.split(' ');
        const q = args.splice(1).join(" ")

        let response = null
        if (q.startsWith(YOUTUBE_VIDEO_URL)) {
            const videoId = q.slice(YOUTUBE_VIDEO_URL.length)
            const song = await Song.from(videoId)
            song.owner = message.author
            this.musicQueue.addSongToIndex(song, queueNumber)

            if (!this.musicQueue.isEmpty()) {
                const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)
                this.textChannel.send({ embeds: [enqueueEmbed.build()] })
            }


        } else if (q.startsWith(YOUTUBE_PLAYLIST_URL)) {
            let playlistId = q.slice(YOUTUBE_PLAYLIST_URL.length)
            let songs = []

            let params = {
                part: "snippet",
                key: auth.youtube_api_key,
                playlistId: playlistId,
                maxResults: 50,
                pageToken: null
            }

            do {
                try {
                    response = await axios.get(YOUTUBE_PLAYLIST_API_URL, {
                        params: params
                    })
                } catch (err) {
                    return console.error(err);
                }
                for (const item of response.data.items) {
                    const song = new Song(
                        item.snippet.resourceId.videoId,
                        item.snippet.title,
                        item.snippet.thumbnails.standard,
                        -1,
                        item.snippet.videoOwnerChannelTitle,
                        message.author
                    )

                    songs.push(song)
                }
                params.pageToken = response.data.nextPageToken
            } while (response.data.nextPageToken)

            this.musicQueue.addSongsToIndex(songs, queueNumber);
            this.musicQueue.updateDurations();
            helper.sendFadingMessage(
                this.textChannel,
                5000,
                `Queued **${songs.length}** songs!`
            )
        } else {
            const params = {
                part: "id",
                key: auth.youtube_api_key,
                q: q,
                type: "video",
                maxResults: 1
            }

            try {
                response = await axios.get(YOUTUBE_API_URL, {
                    params: params
                })
            } catch (err) {
                return console.error(err);
            }
            const videoId = response.data.items[0].id.videoId
            const song = await Song.from(videoId)
            song.owner = message.author

            this.musicQueue.addSongToIndex(song, queueNumber)
            if (!this.musicQueue.isEmpty()) {
                const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)

                this.textChannel.send({ embeds: [enqueueEmbed.build()] })
            }
        }

        this.processQueue()
    }

    move(message) {
        let args = message.content.split(' ');
        args = args.splice(1)
        let from = parseInt(args[0]) - 1
        let to = 0
        if (args[1]) {
            to = parseInt(args[1]) - 1
        }
        this.musicQueue.move(from, to)
        helper.sendFadingMessage(
            this.textChannel,
            5000,
            `Moved ${this.musicQueue.songs[to].title} to position ${to + 1}!`
        )
    }

    skip() {
        helper.sendFadingMessage(
            this.textChannel,
            5000,
            `Skipping **${this.musicQueue.nowPlaying.title}**...`
        )
        this.audioPlayer.stop();
    }

    leave() {
        this.queueLock = true;
        this.musicQueue.empty();
        this.audioPlayer.stop(true);
        this.textChannel.send(`Alright... I'm heading out now ~`)
        this.voiceConnection.disconnect()
    }

    shuffle() {
        this.musicQueue.shuffle()
        helper.sendFadingMessage(
            this.textChannel,
            5000,
            `Shuffled **${this.musicQueue.songs.length}** songs!`
        )
    }

    viewQueue(message) {
        const args = message.content.split(' ');
        let page = 1
        if (args.length > 1) {
            page = args.splice(1).join(" ");
        }
        let embed = new MusicQueueEmbed(this.musicQueue)

        helper.sendFadingMessage(
            this.textChannel,
            30000,
            { embeds: [embed.build(page)] }
        )
    }

    async processQueue() {
        // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
        if (this.queueLock || this.audioPlayer.state.status != AudioPlayerStatus.Idle || this.musicQueue.songs.length == 0) {
            return;
        }
        // Lock the queue to guarantee safe access
        this.queueLock = true;

        // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
        const nextTrack = this.musicQueue.shift();
        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            const resource = await nextTrack.createAudioResource();
            this.audioPlayer.play(resource);
            this.queueLock = false;
        } catch (error) {
            console.log(error)
            this.queueLock = false;
        }

        return this.processQueue();
    }
}

module.exports = MusicPlayer