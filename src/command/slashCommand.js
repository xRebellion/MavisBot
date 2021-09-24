const { MessageEmbed } = require('discord.js');
const msgs = require('../../data/messages.js')
var music = require('../music/main.js')
var fun = require('../fun.js')

async function processSlashCmd(interaction) {
    if (!interaction.isCommand() || !interaction.guildId) return;
    const helpEmbed = new MessageEmbed()
        .setTitle('**Mavis here~**')
        .setColor(0x027059)
        .setDescription(msgs.HELP);
    try {
        switch (interaction.commandName) {
            case 'leave':
                music.leave(interaction);
                break;
            case 'move':
                music.move(
                    interaction,
                    interaction.options.getInteger('from'),
                    interaction.options.getInteger('to')
                );
                break;
            case 'np':
            case 'nowplaying':
                music.nowPlaying(interaction);
                break;
            case 'p':
            case 'play':
                music.execute(interaction, interaction.options.getString('song'), -1);
                break;
            case 'playtop':
                music.execute(interaction, interaction.options.getString('song'), 0);
                break;
            case 'q':
            case 'queue':
                music.viewQueue(interaction, interaction.options.getInteger('page'));
                break;
            case 'remove':
                music.remove(interaction, interaction.options.getInteger('position'));
                break;
            case 'shuffle':
                music.shuffle(interaction);
                break;
            case 'skip':
                music.skip(interaction);
                break;
            case 'help':
                interaction.channel.send({ embeds: [helpEmbed] })
                break;
            case 'me':
                fun.me(interaction, interaction.options.getString('id'));
                break;
            case 'sticker':
                fun.sticker(interaction, interaction.options.getString('id'));
                break;
        }
    } catch (err) {
        return console.error(`Error on command ${interaction.commandName} : ${err}`)
    }
}

module.exports = {
    processSlashCmd
}