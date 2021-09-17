const helper = require('../helper.js')
const auth = require('../../data/auth.json');

const axios = require('axios').default;

const YOUTUBE_VIDEOS_API_URL = "https://www.googleapis.com/youtube/v3/videos"
class MusicQueue {

    constructor(songs) {
        this.songs = songs;
        this.nowPlaying = songs[0];
    }

    addSong(song) {
        this.songs.push(song);
    }

    addSongToIndex(song, index) {
        if (index < 0) this.addSong(song);
        else this.songs.splice(index, 0, song);
    }

    addSongsToIndex(songs, index) {
        this.songs.splice(index, 0, ...songs)
    }

    shuffle() {
        let currentIndex = this.songs.length, randomIndex;

        // While there remain elements to shuffle...
        while (currentIndex != 1) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [this.songs[currentIndex], this.songs[randomIndex]] = [
                this.songs[randomIndex], this.songs[currentIndex]];
        }
    }

    empty() {
        this.songs = [];
        this.nowPlaying = null;
    }

    shift() {
        this.nowPlaying = this.songs.shift()
        return this.nowPlaying
    }

    isEmpty() {
        return this.nowPlaying == null
    }

    async updateDurations() {
        let q = ""
        let i = 0
        let j = 0
        let details = []

        for (const song of this.songs) {

            let videoId = song.videoId
            q = q + videoId + ","
            i++;
            j++;
            if (i == 50 || j == this.songs.length) {
                let response = null
                q = q.slice(0, -1)
                const params = {
                    part: "contentDetails",
                    id: q,
                    key: auth.youtube_api_key
                }
                try {
                    response = await axios.get(YOUTUBE_VIDEOS_API_URL, {
                        params: params
                    })
                } catch (err) {
                    return console.error(err);
                }
                details = details.concat(response.data.items);
                q = ""
                i = 0

            }

        }

        for (let i = 0; i < this.songs.length; i++) {
            this.songs[i].duration = helper.ptToSeconds(details[i].contentDetails.duration)
        }
    }
}

module.exports = MusicQueue