const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require('ytdl-core');
const axios = require('axios').default;

const auth = require('../data/auth.json');
const registered = require('../data/deprecated/registered.deprecated.json');
const msgs = require('../data/messages.js')
const MusicQueue = require('./music/queue.js')
const Song = require('./music/song.js')

const youtubeAPIURL = "https://www.googleapis.com/youtube/v3/search"
const youtubePlaylistAPIURL = "https://www.googleapis.com/youtube/v3/playlistItems"
const youtubeWatchURL = "https://www.youtube.com/watch?v="
const youtubePlaylistURL = "https://www.youtube.com/playlist?list="

const queue = new Map();

function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

async function execute(message, serverQueue, queueNumber) {
    const args = message.content.split(' ');
    const q = args.splice(1).join(" ")

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
        const defaultVoiceChannel = await client.channels.fetch(registered.default_voice_channels[message.guild.id]);
        const permissions = defaultVoiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send(defaultMessage.NO_MUSIC_PERMISSION);
        }
        defaultVoiceChannel.join();
        return delay(5000).then(() => {
            message.channel.send(msgs.MUSIC_NO_ONE_IN_THE_ROOM);
            return defaultVoiceChannel.leave()
        })
    }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send(defaultMessage.NO_MUSIC_PERMISSION);
    }
    let musicQueue = null
    if (!serverQueue) {
        musicQueue = new MusicQueue(
            message.channel,
            voiceChannel,
            null,
            [],
            1
        )
    } else {
        musicQueue = serverQueue
    }

    if (q.startsWith(youtubeWatchURL)) {
        const videoId = q.slice(youtubeWatchURL.length)
        const songInfo = await ytdl.getInfo(videoId);
        musicQueue.addSongToIndex(new Song(
            videoId,
            songInfo.videoDetails.title,
            songInfo.videoDetails.thumbnails,
            songInfo.videoDetails.lengthSeconds
        ), queueNumber)
    } else if (q.startsWith(youtubePlaylistURL)) {
        playlistId = q.slice(youtubePlaylistURL.length)
        tempSongs = []

        let params = {
            part: "snippet",
            key: auth.youtube_api_key,
            playlistId: playlistId,
            maxResults: 50,
            pageToken: null
        }

        do {
            try {
                response = await axios.get(youtubePlaylistAPIURL, {
                    params: params
                })
            } catch (err) {
                return console.error(err);
            }
            for (const item of response.data.items) {
                tempSongs.push(new Song(
                    item.snippet.resourceId.videoId,
                    item.snippet.title,
                    item.snippet.thumbnails,
                    -1,
                    item.snippet.videoOwnerChannelTitle,
                ))
            }
            params.pageToken = response.data.nextPageToken
        } while (response.data.nextPageToken)

        musicQueue.addSongsToIndex(tempSongs, queueNumber);
    } else {
        const params = {
            part: "id",
            key: auth.youtube_api_key,
            q: q,
            type: "video",
            maxResults: 1
        }

        try {
            response = await axios.get(youtubeAPIURL, {
                params: params
            })
        } catch (err) {
            return console.error(err);
        }
        const videoId = response.data.items[0].id.videoId
        const songInfo = await ytdl.getInfo(videoId);

        musicQueue.addSongToIndex(new Song(
            videoId,
            songInfo.videoDetails.title,
            songInfo.videoDetails.thumbnails,
            songInfo.videoDetails.lengthSeconds,
            songInfo.videoDetails.ownerChannelName
        ), queueNumber)
    }

    if (!serverQueue) {
        queue.set(message.guild.id, musicQueue);
        try {
            var connection = await voiceChannel.join();
            musicQueue.connection = connection;
            play(message.guild, musicQueue.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
}

function skip(message, serverQueue) {
    if (!serverQueue) return message.channel.send(msgs.MUSIC_SKIP);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send(MUSIC_WRONG_VOICE_CHANNEL);
    message.channel.send(`Skipping ${serverQueue.nowPlaying.title}...`)
    serverQueue.connection.dispatcher.end();
}


function leave(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverQueue.songs = [];
    message.channel.send(`Alright... I'm heading out now ~`)
    if (serverQueue.connection.dispatcher != null) serverQueue.connection.dispatcher.end();
    serverQueue.voiceChannel.leave();
    queue.delete(message.guild.id);
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        if (serverQueue != null) {
            serverQueue.textChannel.send(`That's all the songs ~w~`).then(() => {
                serverQueue.textChannel.send(`I'm gonna go get some rest now... Byebye~`);
            })
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
        }
        return;
    }
    serverQueue.nowPlaying = song
    serverQueue.textChannel.send(`Playing **${song.title}** ~`);
    const dispatcher = serverQueue.connection.play(ytdl(song.videoId), { filter: 'audioonly', quality: 'highestaudio' })
        .on('finish', () => {
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        });
    serverQueue.songs.shift();
    dispatcher.setVolume(serverQueue.volume * 1);
}

function shuffle(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverQueue.shuffleQueue()
}

module.exports = {
    queue,
    execute,
    leave,
    skip,
    shuffle
}