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

    shuffleQueue() {
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

}

module.exports = MusicQueue