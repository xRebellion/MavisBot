const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js")
class MusicQueueEmbed {

    constructor(textChannel, musicQueue, page) {
        this.textChannel = textChannel
        this.musicQueue = musicQueue
        this.page = page
        this.embedMessage = null
        this.disabled = false
        this.firstPageButton = new MessageButton()
            .setCustomId("queueFirstPage")
            .setLabel("◄◄")
            .setStyle("SECONDARY")
        this.prevPageButton = new MessageButton()
            .setCustomId("queuePrevPage")
            .setLabel("◄")
            .setStyle("PRIMARY")
        this.nextPageButton = new MessageButton()
            .setCustomId("queueNextPage")
            .setLabel("►")
            .setStyle("PRIMARY")
        this.lastPageButton = new MessageButton()
            .setCustomId("queueLastPage")
            .setLabel("►►")
            .setStyle("SECONDARY")
    }

    _queueToText(page) {
        let text = ""

        for (let i = 10 * (page - 1); i < 10 * page && i < this.musicQueue.songs.length; i++) {
            let songInfo = this.musicQueue.getSong(i).flattenForQueue()
            text = text + (i + 1) + ". " + songInfo + "\n"
        }

        return text

    }

    build() {
        let description = ""
        if (this.musicQueue.isEmpty()) {
            description = "**... There's nothing to see here**"
        } else {
            description = this._queueToText(this.page)
        }
        const embed = new MessageEmbed()
            .setAuthor("In Queue")
            .setDescription(description)

        return { embeds: [embed], components: [this.actionRow], fetchReply: true }
    }

    async send() {
        this.embedMessage = await this.textChannel.send(this.build())
    }

    async resend() {
        this.embedMessage.delete()
        this.embedMessage = await this.textChannel.send(this.build())
    }
    update() {
        if (this.embedMessage)
            this.embedMessage.edit(this.build())
    }
    nextPage() {
        if (this.page <= this.getMaxPage()) {
            this.page++
        }
        this.updateQueueButtons()
    }
    prevPage() {
        if (this.page > 1) {
            this.page--
        }
        this.updateQueueButtons()
    }
    setPage(index) {
        if (index < 1) {
            this.page = 1
        } else if (index > this.getMaxPage()) {
            this.page = this.getMaxPage()
        } else {
            this.page = index
        }
        this.updateQueueButtons()
    }
    setEmbedMessage(message) {
        this.embedMessage = message
    }
    getEmbedMessage() {
        return this.embedMessage
    }
    getMaxPage() {
        let maxPage = Math.ceil(this.musicQueue.songs.length / 10)
        if (maxPage == 0) {
            maxPage = 1
        }
        return maxPage
    }
    updateQueueButtons() {
        this.firstPageButton.setDisabled(this.page == 1)
        this.prevPageButton.setDisabled(this.page == 1)
        this.nextPageButton.setDisabled(this.page == this.getMaxPage())
        this.lastPageButton.setDisabled(this.page == this.getMaxPage())
        this.actionRow = new MessageActionRow()
            .addComponents(
                this.firstPageButton,
                this.prevPageButton,
                this.nextPageButton,
                this.lastPageButton
            )
    }
    disableQueueButtons() {
        this.firstPageButton.setDisabled(true)
        this.prevPageButton.setDisabled(true)
        this.nextPageButton.setDisabled(true)
        this.lastPageButton.setDisabled(true)
        this.actionRow.spliceComponents(0, 4, [
            this.firstPageButton,
            this.prevPageButton,
            this.nextPageButton,
            this.lastPageButton,
        ])
    }
}

module.exports = MusicQueueEmbed