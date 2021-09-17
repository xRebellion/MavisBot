const { MessageEmbed } = require("discord.js");

class MusicPlayerEmbed {
    constructor(textChannel) {
        this.textChannel = textChannel
        this.embedMessage = null
    }
    buildEmbed(song, nextSong) {

        if (!song) return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Music Player")
            .setTitle("No song playing right now") // Song Name
            .setURL("") // Song URL

        return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Music Player")
            .setTitle(song.title) // Song Name
            .setURL(song.getVideoURL()) // Song URL
            .setImage(song.thumbnail.url)
    }
    async send(song, nextSong) {
        this.embedMessage = await this.textChannel.send({ embeds: [this.buildEmbed(song, nextSong)] });
    }
    async resend(song, nextSong) {
        this.embedMessage.delete()
        this.embedMessage = await this.textChannel.send({ embeds: [this.buildEmbed(song, nextSong)] });
    }
    update(song, nextSong) {
        this.embedMessage.edit({ embeds: [this.buildEmbed(song, nextSong)] });
    }
    destroy() {
        this.embedMessage.delete();
    }
}

module.exports = MusicPlayerEmbed