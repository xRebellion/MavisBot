var { MessageEmbed } = require('discord.js');
var music = require('./music.js')
var fun = require('./fun.js')
const msgs = require('../data/messages.js')
const prefix = 'm/';
const registered = require('../data/deprecated/registered.deprecated.json');

function processCmd(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const serverQueue = music.queue.get(message.guild.id);
    const embed = new MessageEmbed()
        .setTitle('**Mavis here~**')
        .setColor(0x027059)
        .setDescription(msgs.HELP);
    if (message.content.substring(0, 2) == prefix) {
        var args = message.content.substring(2).split(' ');
        var cmd = args[0];
        args = args.splice(1)
        var commandList = ['ping', 'register', 'reactall', 'getid']
        if (registered.id.includes(message.author.id)) {
            switch (cmd) {
                // m/ping
                case 'ping':
                    message.channel.send('Pong!~');
                    break;
                case 'getid':
                    message.channel.send('Your ID is: ' + message.author.id)
                    break;
                case 'getChannelId':
                    message.channel.send(`This channel ID is ${message.channel.id}! ~`);
                    break;
                case 'getParentId':
                    message.channel.send(`This channel ParentID is ${message.channel.parentID}! ~`);
                    break;
                case 'getVoiceChannelId':
                    message.channel.send(`This voice channel ID is ${message.member.voice.channelID}`)
                    break;
                case 'getGuildId':
                    message.channel.send(`This Guild's ID is ${message.guild.id}`)
                    break;
                case 'registerDefaultVoiceChannel':
                    message.channel.send('Default Voice Channel set! ~');
                    setDefaultVoice(message.guild.id, message.member.voice.channelID);
                    break;
            }
        }
        if (commandList.includes(cmd) && !registered.id.includes(message.author.id)) {
            message.channel.send("You can't do that...")
        }
        switch (cmd) {
            case 'peekpicture':
                fun.peekPicture(message, args);
                break;
            case 'play':
                music.execute(message, serverQueue, -1);
                break;
            case 'playtop':
                music.execute(message, serverQueue, 1);
                break;
            case 'shuffle':
                music.shuffle(message, serverQueue);
                break;
            case 'skip':
                music.skip(message, serverQueue);
                break;
            case 'leave':
                music.leave(message, serverQueue);
                break;
            case 'help':
                message.channel.send(embed)
                break;
            case 'e':
                fun.me(message, args);
                break;
            case 'sticker':
                fun.sticker(message, args);
                break;
        }
    }
}

module.exports = {
    processCmd: processCmd,
}