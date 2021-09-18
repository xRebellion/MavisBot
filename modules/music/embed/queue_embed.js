const { MessageEmbed } = require("discord.js")

class MusicQueueEmbed {
    constructor(musicQueue) {
        this.musicQueue = musicQueue
    }

    _queueToText(page) {
        let text = ""
        let songs = this.musicQueue.songs
        for (let i = 10 * (page - 1); i < 10 * page && i < songs.length; i++) {
            let songInfo = songs[i].flattenForQueue()
            text = text + (i + 1) + ". " + songInfo + "\n"
        }

        return text;

    }

    build(page) {
        let description = this._queueToText(page)
        const embed = new MessageEmbed()
            .setAuthor("In Queue")
            .setDescription(description)
        return embed;
    }
}

module.exports = MusicQueueEmbed