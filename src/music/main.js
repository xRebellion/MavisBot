const { Interaction } = require('discord.js');
const msgs = require('../../data/messages.js');
const MusicPlayer = require('./player.js');

const serverMap = new Map();

// async function execute(guildId, voiceChannel, requester, query)
async function execute(messageOrInteraction, query, queueNumber) {
    if (messageOrInteraction instanceof Interaction)
        messageOrInteraction.deferReply();
    const guildId = messageOrInteraction.guild.id
    const textChannel = messageOrInteraction.channel
    const voiceChannel = messageOrInteraction.member.voice.channel
    const requester = messageOrInteraction.member.user

    let serverPlayer = serverMap.get(messageOrInteraction.guild.id)

    if (!voiceChannel) {
        if (messageOrInteraction instanceof Interaction)
            return messageOrInteraction.editReply(msgs.MUSIC_NO_ONE_IN_THE_ROOM)
        else
            return messageOrInteraction.reply(msgs.MUSIC_NO_ONE_IN_THE_ROOM)
    }
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
        serverPlayer.on('leave', () => { serverMap.delete(guildId) })
        serverMap.set(guildId, serverPlayer);

    }
    if (messageOrInteraction instanceof Interaction)
        messageOrInteraction.editReply(await serverPlayer.enqueue(query, requester, queueNumber));
    else
        messageOrInteraction.reply(await serverPlayer.enqueue(query, requester, queueNumber));
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

async function viewQueue(messageOrInteraction, page) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    if (!page) {
        page = 1
    }

    const queueMessage = await messageOrInteraction.reply(serverPlayer.viewQueue(page))

    serverPlayer.musicQueueEmbed.setEmbedMessage(queueMessage)
    const filter = i => {
        return i.message.id == queueMessage.id
            && (
                i.customId === "queueFirstPage"
                || i.customId === "queueNextPage"
                || i.customId === "queuePrevPage"
                || i.customId === "queueLastPage"
            )
    }
    const collector = queueMessage.channel.createMessageComponentCollector({ filter, idle: 15000 });
    collector.on('collect', async i => {
        switch (i.customId) {
            case "queueFirstPage":
                i.update(serverPlayer.viewFirstPageQueue())
                break;
            case "queuePrevPage":
                i.update(serverPlayer.viewPrevPageQueue())
                break;
            case "queueNextPage":
                i.update(serverPlayer.viewNextPageQueue())
                break;
            case "queueLastPage":
                i.update(serverPlayer.viewLastPageQueue())
                break;
        }
    })

    collector.on('end', async _ => {
        queueMessage.edit(serverPlayer.disableQueueButtons())
    })
}

function nowPlaying(messageOrInteraction) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    serverPlayer.bumpPlayer()
}

function remove(messageOrInteraction, position) {
    const guildId = messageOrInteraction.guild.id
    const voiceChannel = messageOrInteraction.member.voice.channel

    const serverPlayer = serverMap.get(guildId)
    if (!serverPlayer) return messageOrInteraction.reply(msgs.MUSIC_PLAYER_NOT_PLAYING);
    if (voiceChannel != serverPlayer.voiceChannel) return messageOrInteraction.reply(msgs.MUSIC_WRONG_VOICE_CHANNEL);

    serverPlayer.remove(position - 1)
}

function getMusicPlayer(guildId) {
    return serverMap.get(guildId)
}

module.exports = {
    execute,
    leave,
    skip,
    move,
    shuffle,
    viewQueue,
    nowPlaying,
    remove,
    getMusicPlayer,
}