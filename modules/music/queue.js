class MusicQueue {
    constructor(textChannel, voiceChannel, connection, songs, volume) {
        this.textChannel = textChannel;
        this.voiceChannel = voiceChannel;
        this.connection = connection;
        this.songs = songs;
        this.nowPlaying = null;
        this.volume = volume;
        this.playing = true;
    }

    addSong(song) {
        this.songs.push(song);
    }
    addSongToIndex(song, index) {
        if (index < 0) this.addSong(song);
        else this.songs.splice(index, 0, song);
        this.textChannel.send(`I've queued **${song.title}** for you! ~`)
    }
    addSongsToIndex(songs, index) {
        this.songs.splice(index, 0, ...songs)
        this.textChannel.send(`Queued ${songs.length} songs!`)
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

}

module.exports = MusicQueue