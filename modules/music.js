const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const auth = require('../data/auth.json');
const registered = require('../data/registered.json');
const client = new Discord.Client();
const axios = require('axios').default;
const queue = new Map();
const youtubeAPIURL = "https://www.googleapis.com/youtube/v3/search"

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
            return message.channel.send('Ah~ I don\'t have permission to connect or speak ;~;');
        }
        defaultVoiceChannel.join();
        return delay(5000).then(() => {
            message.channel.send('Wait a second... I can\'t find you in the room ._. I\'m leaving then~');
            return defaultVoiceChannel.leave()
        })
    }
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('Ah~ I don\'t have permission to connect or speak ;~;');
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
        title: songInfo.title,
        url: songInfo.video_url,
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
    if (!serverQueue) return message.channel.send(`What are you trying to do? I'm not playing any songs ~ 'w'`);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send('Wait a sec... You\'re not in the voice channel I\'m in ~_~');
    message.channel.send(`Skipping ${serverQueue.songs[0].title}...`)
    serverQueue.connection.dispatcher.end();

}

function leave(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverQueue.voiceChannel) return message.channel.send('Wait a sec... You\'re not in the voice channel I\'m in ~_~');
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

client.login(auth.token);

module.exports = {
    queue: queue,
    execute: execute,
    leave: leave,
    skip: skip
}