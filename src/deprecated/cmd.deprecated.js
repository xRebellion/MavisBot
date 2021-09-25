switch (cmd) {
    // m/register
    case 'register':
        message.channel.send('Channel Registered!~')
        addChannel(message.channel.id)
        break

    case 'reactall':
        reactToAllMessage(message.channel)
        break
    case 'initRoleMessage':
        roles.initRoleMessage(message.guild.id, args[0])
        console.log(args[1])
        break
    case 'initRole':
        roles.initRole(message.guild.id, args[0])
        console.log(args[1])
}
