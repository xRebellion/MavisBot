const { Message } = require('discord.js');
const msgs = require('../../data/messages.js');
const MusicPlayer = require('./player.js');

const serverMap = new Map();

// async function execute(guildId, voiceChannel, requester, query)
async function execute(messageOrInteraction, query, queueNumber) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel
    const requester = messageOrInteraction.author

    let serverPlayer = serverMap.get(messageOrInteraction.guild.id)

    const permissions = voiceChannel.permissionsFor(messageOrInteraction.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return textChannel.send(msgs.NO_MUSIC_PERMISSION);
    }

    if (!serverPlayer) {
        serverPlayer = new MusicPlayer(
            textChannel,
            voiceChannel,
            1
        )
        serverMap.set(guildId, serverPlayer);
        serverPlayer.enqueue(query, requester, queueNumber);
    } else {
        serverPlayer.enqueue(query, requester, queueNumber);
    }
}

function skip(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.skip()
}


function leave(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.leave()
    serverMap.delete(guildId);
}

function move(messageOrInteraction, from, to) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    if (!from) {
        textChannel.send('Missing move arguments!')
    } else {
        from = parseInt(from) - 1
        if (to) {
            to = parseInt(args[1]) - 1
        } else {
            to = 0
        }
        serverPlayer.move(from, to)
    }
}

function shuffle(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    serverPlayer.shuffle()
}

function viewQueue(messageOrInteraction, page) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    if (!page) {
        page = 1
    }
    serverPlayer.viewQueue(page)
}

function nowPlaying(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return textChannel.send(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return textChannel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    serverPlayer.bumpPlayer()
}

module.exports = {
    execute,
    leave,
    skip,
    move,
    shuffle,
    viewQueue,
    nowPlaying

}