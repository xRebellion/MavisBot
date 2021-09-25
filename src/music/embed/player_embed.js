const helper = require('../../util/helper.js')

const { MessageEmbed } = require("discord.js");

class MusicPlayerEmbed {
    constructor(textChannel) {
        this.textChannel = textChannel
        this.embedMessage = null
        this.progressBar = ""
        this.song = null
        this.audioResource = null
        this.destroyed = false;
    }
    build() {
        if (!this.song) return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Music Player")
            .setTitle("Waiting...") // Song Name
            .setURL("") // Song URL
        this.progressBar = helper.createProgressBar(this.audioResource.playbackDuration, this.song.duration * 1000, "░", "▓")
        return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor("Now Playing")
            .setTitle(":minidisc: " + this.song.title) // Song Name
            .setDescription(this.progressBar)
            .setURL(this.song.getVideoURL()) // Song URL
            .setImage(this.song.thumbnail.url)
            .setFooter(`Requested by ${this.song.owner.tag}`, this.song.owner.displayAvatarURL())
    }
    setSong(song) {
        this.song = song
    }
    async send() {
        this.embedMessage = await this.textChannel.send({ embeds: [this.build()] });
    }
    async resend() {
        this.embedMessage.delete()
        this.embedMessage = await this.textChannel.send({ embeds: [this.build()] });
    }
    update() {
        if (this.embedMessage)
            this.embedMessage.edit({ embeds: [this.build()] });
    }
    setAudioResource(resource) {
        this.audioResource = resource
    }
    async startProgressBar() {
        this.timer = setInterval(() => {
            this.updateProgressBar()
            this.update()
        }, 8000)
    }
    stopProgressBar() {
        clearInterval(this.timer)
    }
    updateProgressBar() {
        this.progressBar = helper.createProgressBar(this.audioResource.playbackDuration, this.song.duration * 1000, "░", "▓")
    }
    destroy() {
        if (!this.destroyed) {
            this.stopProgressBar()
            this.embedMessage.delete();
            this.textChannel = null
            this.embedMessage = null
            this.progressBar = ""
            this.song = null
            this.audioResource = null
            this.destroyed = true;
        }
    }
}

module.exports = MusicPlayerEmbed