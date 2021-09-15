var { MessageEmbed } = require('discord.js');
var music = require('./music.js')
var fs = require('fs');
const msgs = require('../data/messages.js')
const prefix = 'm/';
const registered = require('../data/deprecated/registered.deprecated.json');

function processCmd(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const serverQueue = music.queue.get(message.guild.id);
    const embed = new MessageEmbed()
        .setTitle('**Mavis here~**')
        .setColor(0x01a59c)
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
                var user = getUserFromMention(args[0]);
                if (user) {
                    message.channel.send("Peeking on others is not nice... But here it is\n", {
                        files: [
                            user.displayAvatarURL()
                        ]
                    })
                } else {
                    message.channel.send("I can't find the user that you're trying to peek on...");
                }
                break;

            case 'play':
                music.execute(message, serverQueue);
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
                var me = fs.readdirSync('./img/mavis/');
                var pick = null
                if (args[0] > me.length || args[0] <= 0) {
                    message.channel.send("I don't have that .w. ~");
                    break;
                }
                if (!args[0]) pick = me[Math.floor(Math.random() * me.length)]
                else pick = me[args[0] - 1]
                message.channel.send(null, {
                    files: [
                        "./img/mavis/" + pick
                    ]
                })
                break;
            case 'sticker':
                var emote = fs.readdirSync('./img/sticker/')
                var pick = null
                for (name of emote) {
                    if (name.startsWith(args[0])) {
                        pick = name;
                        break;
                    }
                }
                if (!pick) {
                    message.channel.send("I don't have that .w. ~");
                    break;
                }
                message.channel.send(null, {
                    files: [
                        "./img/sticker/" + pick
                    ]
                })

        }

    }

}

module.exports = {
    processCmd: processCmd,
}