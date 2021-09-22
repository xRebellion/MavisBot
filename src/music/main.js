const msgs = require('../../data/messages.js');
const MusicPlayer = require('./player.js');

const serverMap = new Map();

// async function execute(guildId, voiceChannel, requester, query)
async function execute(messageOrInteraction, query, queueNumber) {
    messageOrInteraction.deferReply();
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel
    const requester = messageOrInteraction.member.user

    let serverPlayer = serverMap.get(messageOrInteraction.guild.id)

    const permissions = voiceChannel.permissionsFor(messageOrInteraction.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return messageOrInteraction.editReply(msgs.NO_MUSIC_PERMISSION);
    }

    if (!serverPlayer) {
        serverPlayer = new MusicPlayer(
            textChannel,
            voiceChannel,
            1
        )
        serverMap.set(guildId, serverPlayer);

        messageOrInteraction.editReply(await serverPlayer.enqueue(query, requester, queueNumber));
    } else {
        messageOrInteraction.editReply(await serverPlayer.enqueue(query, requester, queueNumber));
    }
}

function skip(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    messageOrInteraction.reply(serverPlayer.skip())
}


function leave(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    messageOrInteraction.reply(serverPlayer.leave());
    serverMap.delete(guildId);
}

function move(messageOrInteraction, from, to) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    if (!from) {
        messageOrInteraction.reply('Missing move arguments!')
    } else {
        from = from - 1
        if (to) {
            to = args[1] - 1
        } else {
            to = 0
        }
        messageOrInteraction.reply(serverPlayer.move(from, to))
    }
}

function shuffle(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    messageOrInteraction.reply(serverPlayer.shuffle());
}

function viewQueue(messageOrInteraction, page) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    if (!page) {
        page = 1
    }
    messageOrInteraction.reply(serverPlayer.viewQueue(page))
}

function nowPlaying(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

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