
class Song {
    constructor(id, title, thumbnails, duration, channelName) {
        this.videoId = id;
        this.title = title;
        this.thumbnailUrl = thumbnails[((thumbnails.length - 2) < 0) ? 0 : thumbnails.length - 2];
        this.duration = duration;
        this.owner = channelName;
    }

}

module.exports = Song