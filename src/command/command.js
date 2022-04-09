var { MessageEmbed } = require('discord.js')
var music = require('../music/main.js')
var fun = require('../fun.js')
const msgs = require('../../data/messages.js')
const prefix = 'm/'
const slashCommandList = require('./list.js')


const YOUTUBE_URL = "https://www.youtube.com/"

const helpEmbed = new MessageEmbed()
    .setTitle('**Mavis here~**')
    .setColor(0x027059)
    .setDescription(msgs.HELP)


function _preprocessCmd(message) {
    if (message.author.bot) return false
    if (message.content.substring(0, 2) == prefix) {
        var args = message.content.substring(2).split(' ')
        var cmd = args[0]
        args = args.slice(1)
        let joinedArgs = args.join(" ")
        return {
            cmd: cmd,
            args: args,
            joinedArgs: joinedArgs
        }
    } else return false
}

// TODO: use slices instead of switch case
// use cmd[m], then separate the "instructions" to another file
async function processCmd(message) {
    const m = _preprocessCmd(message)
    if (m) {
        if (message.author.id == "258267713384742913") {
            switch (m.cmd) {
                // m/ping
                case 'ping':
                    message.channel.send('Pong!~')
                    break
                case 'getid':
                    message.channel.send('Your ID is: ' + message.author.id)
                    break
                case 'getChannelId':
                    message.channel.send(`This channel ID is ${message.channel.id}! ~`)
                    break
                case 'getParentId':
                    message.channel.send(`This channel ParentID is ${message.channel.parentID}! ~`)
                    break
                case 'getVoiceChannelId':
                    message.channel.send(`This voice channel ID is ${message.member.voice.channelID}`)
                    break
                case 'getGuildId':
                    message.channel.send(`This Guild's ID is ${message.guild.id}`)
                    break
                case 'registerDefaultVoiceChannel':
                    message.channel.send('Default Voice Channel set! ~')
                    setDefaultVoice(message.guild.id, message.member.voice.channelID)
                    break
                case 'getGuildList':
                    fetchGuild(message)
                    break
                case 'deployCommands':
                    message.guild.commands.set(slashCommandList)
                    message.reply('Deployed!')
                    break
            }
        }

        switch (m.cmd) {
            case 'peekpicture':
                fun.peekPicture(message, m.args)
                break

            case 'join':
                music.join(message)
                break;
            case 'leave':
                music.leave(message)
                break
            case 'lm':
            case 'linkmode':
                music.toggleLinkMode(message)
                break
            case 'move':
                music.move(message, m.args[0], m.args[1])
                break
            case 'np':
            case 'nowplaying':
                music.nowPlaying(message)
                break
            case 'p':
            case 'play':
                music.execute(message, m.joinedArgs, -1)
                break
            case 'playtop':
                music.execute(message, m.joinedArgs, 1)
                break
            case 'q':
            case 'queue':
                music.viewQueue(message, m.args[0])
                break
            case 'remove':
                music.remove(message, m.args[0])
                break
            case 'shuffle':
                music.shuffle(message)
                break
            case 'skip':
                music.skip(message)
                break
            case 'help':
                message.reply({ embeds: [helpEmbed] })
                break
            case 'e':
                fun.me(message, m.joinedArgs)
                break
            case 'sticker':
                fun.sticker(message, m.joinedArgs)
                break
        }
    } else {
        if (music.isLinkMode(message)
            && message.content.startsWith(YOUTUBE_URL)
            && message.channel.id == music.getLinkModeChannel(message).id
        ) {
            music.execute(message, message.content, -1)
        }

    }




}

async function fetchGuild(m) {
    m.client.guilds.fetch().then((a) => {
        console.log(a)
    })

}

module.exports = {
    processCmd
}