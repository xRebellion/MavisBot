
async function processSlashCmd(interaction) {
    const helpEmbed = new MessageEmbed()
        .setTitle('**Mavis here~**')
        .setColor(0x027059)
        .setDescription(msgs.HELP);
    if (!interaction.isCommand() || !interaction.guildId) return;
    try {
        switch (interaction.commandName) {
            case 'leave':
                music.leave(interaction);
                break;
            case 'move':
                music.move(interaction);
                break;
            case 'np':
            case 'nowplaying':
                music.nowPlaying(interaction);
                break;
            case 'p':
            case 'play':
                music.execute(interaction, -1);
                break;
            case 'playtop':
                music.execute(interaction, 0);
                break;
            case 'q':
            case 'queue':
                music.viewQueue(interaction);
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
        }
    } catch (err) {
        return console.error(`Error on command ${cmd} : ${err}`)
    }
}

module.exports = {
    processSlashCmd
}