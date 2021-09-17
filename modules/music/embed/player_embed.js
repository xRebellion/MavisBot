const helper = require('../../helper.js')

const { MessageEmbed } = require("discord.js");

class MusicPlayerEmbed {
    constructor(textChannel) {
        this.textChannel = textChannel
        this.embedMessage = null
        this.progressBar = ""
        this.song = null
        this.audioResource = null
    }
    buildEmbed() {

        if (!this.song) return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Music Player")
            .setTitle("No song playing right now") // Song Name
            .setURL("") // Song URL
        this.progressBar = helper.createProgressBar(this.audioResource.playbackDuration, this.song.duration * 1000, "░", "▓")
        return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Music Player")
            .setTitle(this.song.title) // Song Name
            .setDescription(this.progressBar)
            .setURL(this.song.getVideoURL()) // Song URL

            .setImage(this.song.thumbnail.url)
    }
    async send(song) {
        this.song = song
        this.embedMessage = await this.textChannel.send({ embeds: [this.buildEmbed()] });
    }
    async resend(song) {
        this.song = song
        this.embedMessage.delete()
        this.embedMessage = await this.textChannel.send({ embeds: [this.buildEmbed()] });
    }
    update() {
        this.embedMessage.edit({ embeds: [this.buildEmbed()] });
    }
    setAudioResource(resource) {
        this.audioResource = resource
    }
    async startProgressBar() {
        this.timer = setInterval(() => {
            this.updateProgressBar()
            this.embedMessage.edit({ embeds: [this.buildEmbed()] });
        }, 8000)
    }
    stopProgressBar() {
        clearInterval(this.timer)
    }
    updateProgressBar() {
        this.progressBar = helper.createProgressBar(this.audioResource.playbackDuration, this.song.duration * 1000, "░", "▓")
    }
    destroy() {
        this.embedMessage.delete();
    }
}

module.exports = MusicPlayerEmbed