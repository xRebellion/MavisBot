const auth = require('../../data/auth.json');

const ytdl = require('ytdl-core');
const MusicQueue = require("./queue");
const Song = require("./song.js");
const axios = require('axios').default;

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search"
const YOUTUBE_PLAYLIST_API_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v="
const YOUTUBE_PLAYLIST_URL = "https://www.youtube.com/playlist?list="
// TODO: Create module for embed-type music player
class MusicPlayer {

    constructor(textChannel, voiceChannel, connection, volume) {
        this.textChannel = textChannel
        this.voiceChannel = voiceChannel;
        this.connection = connection;
        this.volume = volume;
        this.musicQueue = new MusicQueue([])
    }

    async playOrQueue(message, queueNumber) {
        const args = message.content.split(' ');
        const q = args.splice(1).join(" ")

        let response = null
        if (q.startsWith(YOUTUBE_VIDEO_URL)) {
            const videoId = q.slice(YOUTUBE_VIDEO_URL.length)
            const songInfo = await ytdl.getInfo(videoId);
            const song = new Song(
                videoId,
                songInfo.videoDetails.title,
                songInfo.videoDetails.thumbnails,
                songInfo.videoDetails.lengthSeconds
            )
            this.musicQueue.addSongToIndex(song, queueNumber)
            this.textChannel.send(`I've queued **${song.title}** for you! ~`)
        } else if (q.startsWith(YOUTUBE_PLAYLIST_URL)) {
            playlistId = q.slice(YOUTUBE_PLAYLIST_URL.length)
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
                    songs.push(new Song(
                        item.snippet.resourceId.videoId,
                        item.snippet.title,
                        item.snippet.thumbnails,
                        -1,
                        item.snippet.videoOwnerChannelTitle,
                    ))
                }
                params.pageToken = response.data.nextPageToken
            } while (response.data.nextPageToken)

            this.musicQueue.addSongsToIndex(songs, queueNumber);
            this.textChannel.send(`Queued ${songs.length} songs!`)
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
            const songInfo = await ytdl.getInfo(videoId);

            this.musicQueue.addSongToIndex(new Song(
                videoId,
                songInfo.videoDetails.title,
                songInfo.videoDetails.thumbnails,
                songInfo.videoDetails.lengthSeconds,
                songInfo.videoDetails.ownerChannelName
            ), queueNumber)
        }
        if (!this.connection) {
            try {
                var connection = await this.voiceChannel.join();
                this.connection = connection;
                this._play(this.musicQueue.songs[0]);
            } catch (err) {
                console.log(err);
                return this.textChannel.send(err);
            }
        }
    }

    skip() {
        this.textChannel.send(`Skipping ${this.musicQueue.nowPlaying.title}...`)
        this.connection.dispatcher.end();
    }

    leave() {
        this.textChannel.send(`Alright... I'm heading out now ~`)
        if (this.connection.dispatcher != null) this.connection.dispatcher.end();
        this.voiceChannel.leave();
    }

    _play(song) {
        if (!song) {
            if (this.textChannel != null) {
                this.textChannel.send(`That's all the songs ~w~`).then(() => {
                    this.textChannel.send(`I'm gonna go get some rest now... Byebye~`);
                })
                this.voiceChannel.leave();
                //destroy self from map
            }
            return;
        }
        this.musicQueue.nowPlaying = song
        this.textChannel.send(`Playing **${song.title}** ~`);
        const dispatcher = this.connection.play(ytdl(song.videoId), { filter: 'audioonly', quality: 'highestaudio' })
            .on('finish', () => {
                this._play(this.musicQueue.songs[0]);
            })
            .on('error', error => {
                console.error(error);
            });
        this.musicQueue.songs.shift();
        dispatcher.setVolume(this.volume * 1);
    }
    shuffle() { }
    listSongs() { }


}

module.exports = MusicPlayer