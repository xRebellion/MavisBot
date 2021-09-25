const helper = require('../util/helper')

const MusicQueue = require("./queue");
const Song = require("./song.js");
const axios = require('axios').default;
const { MessageEmbed } = require("discord.js");
const MusicQueueEmbed = require('./embed/queue_embed');
const MusicPlayerEmbed = require('./embed/player_embed');
const EnqueueEmbed = require('./embed/enqueue_embed')
const { joinVoiceChannel, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, entersState, VoiceConnectionDisconnectReason } = require('@discordjs/voice');
const { EventEmitter } = require('events');

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"
const YOUTUBE_PLAYLIST_API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch"
const YOUTUBE_PLAYLIST_URL = "https://www.youtube.com/playlist"
// TODO: Create module for embed-type music player
class MusicPlayer extends EventEmitter {

    constructor(textChannel, voiceChannel, volume) {
        super()
        this.textChannel = textChannel
        this.voiceChannel = voiceChannel;
        this.audioPlayer = createAudioPlayer();
        this.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        this.volume = volume;
        this.musicQueue = new MusicQueue()
        this.playerEmbed = new MusicPlayerEmbed(textChannel)
        this.musicQueueEmbed = new MusicQueueEmbed(textChannel, this.musicQueue, 1)
        this.queueLock = false;
        this.readyLock = false;
        this._timeout = null;
        this._resource = null
        this._nextResource = null
        this.playerEmbed.send();
        // Configure audio player
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.playerEmbed.stopProgressBar()

                this._timeout = setTimeout(() => {
                    this.leave()
                }, 15 * 60 * 1000);
                this._resource = null;
                void this.processQueue();

            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
                clearTimeout(this._timeout);
                this.playerEmbed.resend(this.musicQueue.getNowPlaying())
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
                this.playerEmbed.destroy();
                this.emit('leave');
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

    }

    async enqueue(query, author, queueNumber) {
        let response = null
        let reply = "empty"

        if (query.startsWith(YOUTUBE_VIDEO_URL)) {
            const url = new URL(query)
            const videoId = url.searchParams.get('v')
            const song = await Song.from(videoId, author)
            const index = this.musicQueue.addSongToIndex(song, queueNumber - 1)

            const enqueueEmbed = new EnqueueEmbed(song, index + 1)
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
            if (!this.musicQueue.isPlaying()) {
                songs[0] = await Song.from(songs[0].videoId, author)
            }
            this.musicQueue.addSongsToIndex(songs, queueNumber - 1);
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
                const song = await Song.from(videoId, author)

                const index = this.musicQueue.addSongToIndex(song, queueNumber - 1)

                const enqueueEmbed = new EnqueueEmbed(song, index + 1)
                reply = { embeds: [enqueueEmbed.build()] }

            } catch (err) {
                console.log(err)
                reply = "Music Not Found!"
            }

        }
        if (queueNumber == 1) { // if play top, refresh the cache {
            this.cacheNextSong();
        }
        this.processQueue()
        return reply
    }

    move(from, to) {
        const reply = `Moved **${this.musicQueue.getSong(from).title}** to position **${to + 1}**!`
        this.musicQueue.move(from, to)
        this.cacheNextSong()
        const embed = new MessageEmbed()
            .setColor(0x027059)
            .setDescription(reply)
        return { embeds: [embed] }
    }

    remove(index) {

        const removed = this.musicQueue.remove(index)
        this.cacheNextSong()
        const reply = `Removed **${removed.title}** from queue!`
        const embed = new MessageEmbed()
            .setColor(0x027059)
            .setDescription(reply)
        return { embeds: [embed] }
    }

    bumpPlayer() {
        this.playerEmbed.updateProgressBar()
        this.playerEmbed.setSong(this.musicQueue.getNowPlaying())
        this.playerEmbed.resend()
    }

    skip() {
        const reply = `Skipping **${this.musicQueue.getNowPlaying().title}**...`
        this.audioPlayer.stop();
        const embed = new MessageEmbed()
            .setColor(0x027059)
            .setDescription(reply)
        return { embeds: [embed] }
    }

    clear() {
        this.musicQueue.empty();
        this._resource = null
        this._nextResource = null
        this.audioPlayer.stop(true);
    }

    leave() {
        const reply = `Alright... I'm heading out now ~`
        this.queueLock = true;
        this.emit('leave');
        this.voiceConnection.destroy()
        return reply
    }

    shuffle() {
        reply = `Shuffled **${this.musicQueue.songs.length}** songs!`
        this.musicQueue.shuffle()
        this.cacheNextSong()
        const embed = new MessageEmbed()
            .setColor(0x027059)
            .setDescription(reply)
        return { embeds: [embed] }
    }

    viewQueue(page) {
        this.musicQueueEmbed.setPage(page)
        if (this.musicQueueEmbed.embedMessage) {
            this.musicQueueEmbed.embedMessage.delete()
        }
        return this.musicQueueEmbed.build()
    }

    viewFirstPageQueue() {
        this.musicQueueEmbed.setPage(1)
        return this.musicQueueEmbed.build()
    }
    viewNextPageQueue() {
        this.musicQueueEmbed.nextPage()
        return this.musicQueueEmbed.build()
    }
    viewPrevPageQueue() {
        this.musicQueueEmbed.prevPage()
        return this.musicQueueEmbed.build()
    }
    viewLastPageQueue() {
        this.musicQueueEmbed.setPage(this.musicQueueEmbed.getMaxPage())
        return this.musicQueueEmbed.build()
    }

    disableQueueButtons() {
        this.musicQueueEmbed.disableQueueButtons()
        return this.musicQueueEmbed.build()
    }

    cacheNextSong() {
        if (this.musicQueue.nextSongExists()) {
            this.musicQueue.getNextSong().createAudioResource().then(resource => {
                this._nextResource = resource
            });
        } else {
            this._nextResource = null // and last song
        }
    }

    async processQueue() {
        // If the queue is locked (already being processed), is empty, or the audio player already cached the next song
        if (this.queueLock || (this.audioPlayer.state.status != AudioPlayerStatus.Idle && this._nextResource)) {
            return;
        }

        if (this.musicQueue.isEmpty()) {
            if (this.audioPlayer.state.status != AudioPlayerStatus.Idle) return;
            else {
                this.playerEmbed.stopProgressBar()
                this.playerEmbed.setSong(null);
                this.playerEmbed.update()
                return;
            }
        }

        if (this.audioPlayer.state.status != AudioPlayerStatus.Idle && !this._nextResource) {
            this.cacheNextSong();
            return;
        }

        // Lock the queue to guarantee safe access
        this.queueLock = true;

        // Take the first item from the queue
        const track = this.musicQueue.shift();
        this.playerEmbed.setSong(track)

        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            if (!this._resource && !this._nextResource) { // Queuing a playlist
                this._resource = await track.createAudioResource();
                this.cacheNextSong();
            } else if (!this._nextResource) { // first time requesting a song
                this._resource = await track.createAudioResource();
            } else { // on consequent (2+) requests.
                this._resource = this._nextResource;
                this.cacheNextSong();
            }
            this.playerEmbed.setAudioResource(this._resource)
            this.playerEmbed.startProgressBar();
            this.audioPlayer.play(this._resource);

        } catch (error) {
            console.log(error)
            return;
        }

        this.queueLock = false;
        return this.processQueue();
    }

}

module.exports = MusicPlayer