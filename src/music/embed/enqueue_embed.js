const { MessageEmbed } = require("discord.js")

class EnqueueEmbed {
    constructor(song, musicQueue) {
        this.user = song.owner
        this.title = song.title
        this.thumbnail = song.thumbnail
        this.channelName = song.channelName
        this.videoURL = song.getVideoURL()
        this.position = musicQueue.indexOf(song) + 1
    }

    build() {
        return new MessageEmbed()
            .setColor(0x027059)
            .setTitle(this.title)
            .setURL(this.videoURL)
            .setAuthor("Added to queue", this.user.displayAvatarURL())
            .setThumbnail(this.thumbnail.url)
            .addFields(
                { name: "Channel", value: this.channelName, inline: true },
                { name: "Position", value: String(this.position), inline: true },
                { name: "Requested by", value: "<@" + this.user.id + ">" }
            )

    }


}

module.exports = EnqueueEmbed