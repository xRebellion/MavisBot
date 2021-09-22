const helper = require('../util/helper')

const MusicQueue = require("./queue");
const Song = require("./song.js");
const axios = require('axios').default;
const MusicQueueEmbed = require('./embed/queue_embed');
const MusicPlayerEmbed = require('./embed/player_embed');
const EnqueueEmbed = require('./embed/enqueue_embed')
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, entersState, VoiceConnectionDisconnectReason } = require('@discordjs/voice');

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"
const YOUTUBE_PLAYLIST_API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch"
const YOUTUBE_PLAYLIST_URL = "https://www.youtube.com/playlist"
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
        this.readyLock = false;
        this.timeout = null;

        this.playerEmbed.send(this.musicQueue.nowPlaying);
        // Configure audio player
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                if (this.musicQueue.isEmpty()) {
                    this.playerEmbed.song = null
                    this.playerEmbed.update()
                }
                this.timeout = setTimeout(() => {
                    this.leave()
                }, 300000);
                this.playerEmbed.stopProgressBar();
                console.time('audioPlayerStateChange.processQueue')
                void this.processQueue();
                console.timeEnd('audioPlayerStateChange.processQueue')
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                clearTimeout(this.timeout);
                this.playerEmbed.resend(this.musicQueue.nowPlaying)
            }
        });

        this.voiceConnection.on('stateChange', async (_, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    /*
                        If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
                        but there is a chance the connection will recover itself if the reason of the disconnect was due to
                        switching voice channels. This is also the same code for the bot being kicked from the voice channel,
                        so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
                        the voice connection.
                    */

                    try {
                        await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
                        // Probably moved voice channel
                    } catch {
                        this.voiceConnection.destroy();
                        // Probably removed from voice channel
                    }
                } else if (this.voiceConnection.rejoinAttempts < 5) {
                    /*
                        The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
                    */
                    await helper.delay((this.voiceConnection.rejoinAttempts + 1) * 5_000);
                    this.voiceConnection.rejoin();
                } else {
                    /*
                        The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
                    */
                    this.voiceConnection.destroy();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                /*
                    Once destroyed, stop the subscription
                */
                this.clear();
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
            ) {
                /*
                    In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
                    before destroying the voice connection. This stops the voice connection permanently existing in one of these
                    states.
                */
                this.readyLock = true;
                try {
                    await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 20_000);
                } catch {
                    if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                        this.voiceConnection.destroy();
                    }
                } finally {
                    this.readyLock = false;
                }
            }
        })

        this.voiceConnection.subscribe(this.audioPlayer)
        this._resource = null
    }

    async enqueue(query, author, queueNumber) {
        console.time('enqueue')

        let response = null
        let reply = "empty"

        if (query.startsWith(YOUTUBE_VIDEO_URL)) {
            const url = new URL(query)
            const videoId = url.searchParams.get('v')
            const song = await Song.from(videoId)
            song.owner = author
            this.musicQueue.addSongToIndex(song, queueNumber)

            const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)
            reply = { embeds: [enqueueEmbed.build()] }

        } else if (query.startsWith(YOUTUBE_PLAYLIST_URL)) {
            const url = new URL(query)
            let playlistId = url.searchParams.get('list')
            let songs = []

            let params = {
                part: "snippet",
                key: process.env.YOUTUBE_API_KEY,
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
                        author
                    )

                    songs.push(song)
                }
                params.pageToken = response.data.nextPageToken
            } while (response.data.nextPageToken)

            this.musicQueue.addSongsToIndex(songs, queueNumber);
            this.musicQueue.updateDurations();
            reply = `Queued **${songs.length}** songs!`

        } else {
            const params = {
                part: "id",
                key: process.env.YOUTUBE_API_KEY,
                q: query,
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
            try {
                const videoId = response.data.items[0].id.videoId
                const song = await Song.from(videoId)
                song.owner = author

                this.musicQueue.addSongToIndex(song, queueNumber)

                const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)
                reply = { embeds: [enqueueEmbed.build()] }

            } catch (err) {
                console.log(err)
                reply = "Music Not Found!"
            }

        }

        this.processQueue()
        console.timeEnd('enqueue')
        return reply
    }

    move(from, to) {
        this.musicQueue.move(from, to)
        return `Moved **${this.musicQueue.songs[to].title}** to position **${to + 1}**!`
    }

    bumpPlayer() {
        this.playerEmbed.updateProgressBar()
        this.playerEmbed.resend(this.musicQueue.nowPlaying)
    }

    skip() {
        this.audioPlayer.stop();
        return `Skipping **${this.musicQueue.nowPlaying.title}**...`
    }

    clear() {
        this.musicQueue.empty();
        this.playerEmbed.destroy();
        this.audioPlayer.stop(true);
    }

    leave() {
        this.queueLock = true;
        this.clear()
        this.voiceConnection.disconnect()
        return `Alright... I'm heading out now ~`
    }

    shuffle() {
        this.musicQueue.shuffle()
        return `Shuffled **${this.musicQueue.songs.length}** songs!`
    }

    viewQueue(page) {

        let embed = new MusicQueueEmbed(this.musicQueue)

        return { embeds: [embed.build(page)] }

    }

    async processQueue() {
        console.time('processQueue')
        // If the queue is locked (already being processed), is empty, or the audio player is already caching
        if (this.queueLock || (this.audioPlayer.state.status != AudioPlayerStatus.Idle && this._nextResource) || !this.musicQueue.songs[0]) {
            console.timeEnd('processQueue')
            return;
        }

        // Lock the queue to guarantee safe access
        this.queueLock = true;

        if (this._resource && !this._nextResource) { // second time queue, cache the next song
            console.log("2")
            this._nextResource = await this.musicQueue.songs[0].createAudioResource();
            console.timeEnd('processQueue')
            this.queueLock = false;
            return;
        }

        // Take the first item from the queue
        const track = this.musicQueue.shift();
        if (!track) {
            this.playerEmbed.song = track // null
            this.playerEmbed.update();
            console.timeEnd('processQueue')
            this.queueLock = false;
            return;
        }


        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            if (!this._resource && !this._nextResource) { // first time queue
                this._resource = await track.createAudioResource();
            } else { // on consequent (2+) and last song.
                this._resource = this._nextResource;
                if (this.musicQueue.songs[0]) {
                    this.musicQueue.songs[0].createAudioResource().then(resource => {
                        this._nextResource = resource
                    });
                } else {
                    this._nextResource = null
                }
            }
            this.playerEmbed.setAudioResource(this._resource)
            this.playerEmbed.startProgressBar();
            this.audioPlayer.play(this._resource);
            this.queueLock = false;
        } catch (error) {
            console.log(error)
            this.queueLock = false;
        }

        console.timeEnd('processQueue')
        return this.processQueue();
    }

}

module.exports = MusicPlayer