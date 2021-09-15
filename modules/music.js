const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const auth = require('../data/auth.json');
const registered = require('../data/deprecated/registered.deprecated.json');
const client = new Discord.Client();
const axios = require('axios').default;
const queue = new Map();
const youtubeAPIURL = "https://www.googleapis.com/youtube/v3/search"
const msgs = require('../data/messages.js')

function delay(t, v) {
    return new Promise(function (resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}

async function execute(message, serverQueue) {
    const args = message.content.split(' ');

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
    const params = {
        part: "id",
        key: auth.youtube_api_key,
        q: args.splice(1).join(" "),
        type: "video",
        maxResults: 1
    }
    let response = null
    try {
        response = await axios.get(youtubeAPIURL, {
            params: params
        })
    } catch (err) {
        return console.error(err);
    }

    const songInfo = await ytdl.getInfo(response.data.items[0].id.videoId);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 1.5,
            playing: true,
        };

        queue.set(message.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`I've queued **${song.title}** for you! ~`).then();
    }
}

function skip(message, serverQueue) {
    if (!serverQueue) return message.channel.send(msgs.MUSIC_SKIP);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send(MUSIC_WRONG_VOICE_CHANNEL);
    message.channel.send(`Skipping ${serverQueue.songs[0].title}...`)
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
    serverQueue.textChannel.send(`Playing **${song.title}** ~`);
    const dispatcher = serverQueue.connection.play(ytdl(song.url))
        .on('finish', () => {
            console.log('Music ended!');
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on('error', error => {
            console.error(error);
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

module.exports = {
    queue: queue,
    execute: execute,
    leave: leave,
    skip: skip
}