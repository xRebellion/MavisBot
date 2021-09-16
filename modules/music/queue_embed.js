const { MessageEmbed } = require("discord.js")

class MusicQueueEmbed {
    constructor(musicQueue) {
        this.musicQueue = musicQueue
        this.description = ""
    }

    _queueToText(page) {
        let text = ""
        this.musicQueue.songs.slice(10 * (page - 1), 10 * page).forEach((song, index) => {
            let songInfo = song.flattenForQueue()
            text = text + (index + 1) + ". " + songInfo + "\n"
        })
        return text;

    }

    build(page) {
        const embed = new MessageEmbed()
            .setAuthor("In Queue")
            .setDescription(this._queueToText(page))
        return embed;
    }
}

module.exports = MusicQueueEmbed