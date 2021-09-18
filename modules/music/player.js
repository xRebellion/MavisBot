const helper = require('../helper')

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

        this.playerEmbed.send(this.musicQueue.nowPlaying);
        // Configure audio player
        this.audioPlayer.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
                // The queue is then processed to start playing the next track, if one is available.
                this.playerEmbed.stopProgressBar();
                void this.processQueue();
            } else if (newState.status === AudioPlayerStatus.Playing) {
                // If the Playing state has been entered, then a new track has started playback.
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

    async enqueue(message, queueNumber) {
        const args = message.content.split(' ');
        const q = args.splice(1).join(" ")

        let response = null
        if (q.startsWith(YOUTUBE_VIDEO_URL)) {
            const url = new URL(q)
            const videoId = url.searchParams.get('v')
            const song = await Song.from(videoId)
            song.owner = message.author
            this.musicQueue.addSongToIndex(song, queueNumber)

            if (!this.musicQueue.isEmpty()) {
                const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)
                this.textChannel.send({ embeds: [enqueueEmbed.build()] })
            }


        } else if (q.startsWith(YOUTUBE_PLAYLIST_URL)) {
            const url = new URL(q)
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
                key: process.env.YOUTUBE_API_KEY,
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
            try {
                const videoId = response.data.items[0].id.videoId
                const song = await Song.from(videoId)
                song.owner = message.author

                this.musicQueue.addSongToIndex(song, queueNumber)
                if (!this.musicQueue.isEmpty()) {
                    const enqueueEmbed = new EnqueueEmbed(song, this.musicQueue)

                    this.textChannel.send({ embeds: [enqueueEmbed.build()] })
                }
            } catch (err) {
                console.log(err)
                this.textChannel.send("Music Not Found!")
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

    bumpPlayer() {
        this.playerEmbed.updateProgressBar()
        this.playerEmbed.resend(this.musicQueue.nowPlaying)
    }

    skip() {
        helper.sendFadingMessage(
            this.textChannel,
            5000,
            `Skipping **${this.musicQueue.nowPlaying.title}**...`
        )
        this.audioPlayer.stop();
    }
    clear() {
        this.musicQueue.empty();
        this.playerEmbed.destroy();
        this.audioPlayer.stop(true);
    }

    leave() {
        this.queueLock = true;
        this.clear()
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
        if (this.queueLock || this.audioPlayer.state.status != AudioPlayerStatus.Idle) {
            return;
        }

        // Take the first item from the queue. This is NOT guaranteed to exist due to the nonexistent empty check above.
        const nextTrack = this.musicQueue.shift();
        if (!nextTrack) {
            this.leave()
            return;
        }
        // Lock the queue to guarantee safe access
        this.queueLock = true;



        try {
            // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
            this._resource = await nextTrack.createAudioResource();
            this.playerEmbed.setAudioResource(this._resource)
            this.playerEmbed.startProgressBar();
            this.audioPlayer.play(this._resource);
            this.queueLock = false;
        } catch (error) {
            console.log(error)
            this.queueLock = false;
        }

        return this.processQueue();
    }

}

module.exports = MusicPlayer