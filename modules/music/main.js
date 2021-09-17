const msgs = require('../../data/messages.js');
const MusicPlayer = require('./player.js');

const serverMap = new Map();

async function execute(message, queueNumber) {
    let serverPlayer = serverMap.get(message.guild.id)

    const voiceChannel = message.member.voice.channel;

    // if (!voiceChannel) {
    //     const defaultVoiceChannel = await client.channels.fetch(registered.default_voice_channels[message.guild.id]);
    //     const permissions = defaultVoiceChannel.permissionsFor(message.client.user);
    //     if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
    //         return message.channel.send(defaultMessage.NO_MUSIC_PERMISSION);
    //     }
    //     defaultVoiceChannel.join();
    //     return delay(5000).then(() => {
    //         message.channel.send(msgs.MUSIC_NO_ONE_IN_THE_ROOM);
    //         return defaultVoiceChannel.leave()
    //     })
    // }

    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send(msgs.NO_MUSIC_PERMISSION);
    }

    if (!serverPlayer) {
        serverPlayer = new MusicPlayer(
            message.channel,
            voiceChannel,
            1
        )
        serverMap.set(message.guild.id, serverPlayer);
        serverPlayer.enqueue(message, queueNumber);
    } else {
        serverPlayer.enqueue(message, queueNumber);
    }
}

function skip(message) {
    const serverPlayer = serverMap.get(message.guild.id)
    if (!serverPlayer) return message.channel.send(msgs.MUSIC_SKIP);
    if (message.member.voice.channel != serverPlayer.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.skip()
}


function leave(message) {
    const serverPlayer = serverMap.get(message.guild.id)
    if (!serverPlayer) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverPlayer.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.leave()
    serverMap.delete(message.guild.id);
}

function shuffle(message, serverQueue) {
    const serverPlayer = serverMap.get(message.guild.id)
    if (!serverPlayer) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverPlayer.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.shuffle()
}

function viewQueue(message) {
    const serverPlayer = serverMap.get(message.guild.id)
    if (!serverPlayer) return message.channel.send(`What are you trying to do? I'm not in any voice rooms ~ 'w'`);
    if (message.member.voice.channel != serverPlayer.voiceChannel) return message.channel.send(msgs.MUSIC_WRONG_VOICE_CHANNEL);
    serverPlayer.viewQueue(message)
}

module.exports = {
    execute,
    leave,
    skip,
    shuffle,
    viewQueue
}