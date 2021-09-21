var { MessageEmbed } = require('discord.js');
var music = require('../music/main.js')
var fun = require('../fun.js')
const msgs = require('../../data/messages.js')
const prefix = 'm/';
const registered = require('../../data/deprecated/registered.deprecated.json');



async function processCmd(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const helpEmbed = new MessageEmbed()
        .setTitle('**Mavis here~**')
        .setColor(0x027059)
        .setDescription(msgs.HELP);
    if (message.content.substring(0, 2) == prefix) {
        try {
            var args = message.content.substring(2).split(' ');
            var cmd = args[0];
            let songQuery = args.splice(1).join(" ")
            args = args.splice(1)


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
                    case 'getGuildList':
                        fetchGuild(message)
                        break;
                }
            }

            switch (cmd) {
                case 'peekpicture':
                    fun.peekPicture(message, args);
                    break;

                case 'leave':
                    music.leave(message);
                    break;
                case 'move':
                    music.move(message, args[0], args[1]);
                    break;
                case 'np':
                case 'nowplaying':
                    music.nowPlaying(message);
                    break;
                case 'p':
                case 'play':
                    music.execute(message, songQuery, -1);
                    break;
                case 'playtop':
                    music.execute(message, songQuery, 0);
                    break;
                case 'q':
                case 'queue':
                    music.viewQueue(message, args[0]);
                    break;
                case 'shuffle':
                    music.shuffle(message);
                    break;
                case 'skip':
                    music.skip(message);
                    break;
                case 'help':
                    message.channel.send({ embeds: [helpEmbed] })
                    break;
                case 'e':
                    fun.me(message, args);
                    break;
                case 'sticker':
                    fun.sticker(message, args);
                    break;
            }
        } catch (err) {
            return console.error(`Error on command ${cmd} : ${err}`)
        }
    }
}

async function fetchGuild(m) {
    m.client.guilds.fetch().then((a) => {
        console.log(a)
    })

}

module.exports = {
    processCmd,
}