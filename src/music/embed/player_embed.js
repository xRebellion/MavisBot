const helper = require('../../util/helper.js')

const { MessageEmbed } = require("discord.js")

class MusicPlayerEmbed {
    constructor(textChannel) {
        this.textChannel = textChannel
        this.embedMessage = null
        this.progressBar = ""
        this.song = null
        this.audioResource = null
        this.destroyed = false
        this._embedLock = false
    }
    build() {
        if (!this.song) return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor({
                name: "Music Player"
            })
            .setTitle("Waiting...") // Song Name
            .setURL("") // Song URL
            .setThumbnail("https://user-images.githubusercontent.com/32483348/133907757-37365e0f-3c97-4e0a-becb-6d57b82ce1d7.png")
        this.progressBar = helper.createProgressBar(this.audioResource.playbackDuration, this.song.duration * 1000, "░", "▓")
        let thumbnailUrl = null
        if (!this.song.thumbnail) {
            thumbnailUrl = "https://user-images.githubusercontent.com/32483348/133907757-37365e0f-3c97-4e0a-becb-6d57b82ce1d7.png"
        } else {
            thumbnailUrl = this.song.thumbnail.url
        }




        return new MessageEmbed()
            .setColor(0x027059)
            .setAuthor({
                name: "Now Playing"
            })
            .setTitle(":minidisc: " + this.song.title) // Song Name
            .setDescription(this.progressBar)
            .setURL(this.song.getVideoURL()) // Song URL
            .setImage(thumbnailUrl)
            .setFooter({
                text: `Requested by ${this.song.owner.tag}`,
                iconURL: this.song.owner.displayAvatarURL()
            })


    }
    setSong(song) {
        this.song = song
    }
    async send() {
        this.embedMessage = await this.textChannel.send({ embeds: [this.build()] })
    }
    async resend() {
        if (this.embedMessage && this.embedMessage.editable)
            this.embedMessage.delete()
        this.embedMessage = await this.textChannel.send({ embeds: [this.build()] })
    }
    update() {
        if (this.embedMessage && this.embedMessage.editable)
            this.embedMessage.edit({ embeds: [this.build()] })
    }
    setAudioResource(resource) {
        this.audioResource = resource
    }
    async startProgressBar() {
        if (this.timer) {
            this.stopProgressBar()
        }
        this.timer = setInterval(() => {
            this.updateProgressBar()
            this.update()
        }, 15000)
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
            this.embedMessage.delete()
            this.textChannel = null
            this.embedMessage = null
            this.progressBar = ""
            this.song = null
            this.audioResource = null
            this.destroyed = true
        }
    }
}

module.exports = MusicPlayerEmbed