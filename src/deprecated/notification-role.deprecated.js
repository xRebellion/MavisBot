var { MessageEmbed } = require("discord.js")
var path = require('path')
const pathToRegistered = path.join(__dirname, '..', 'data', 'registered.json')
var registered = require(pathToRegistered)
var fs = require('fs')
const roleEmbed = new MessageEmbed()
    .setTitle("**Get Notified Here!~**")
    .setColor(0x7dd3ff)
    .attachFiles(["./img/mavis/2.png"])
    .setThumbnail("attachment://2.png")
    .setDescription("If you want to get notified for updates, sign up by clicking the :exclamation: button!")


function initRoleMessage(guildId, id) {
    registered.role_message[guildId] = id
    JSON.stringify(registered)
    fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })

}

function initRole(guildId, id) {
    registered.role[guildId] = id
    JSON.stringify(registered)
    fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
        if (err) {
            console.error(err)
            return
        }
    })
}
// function addRole
function onReactEmoji(reaction, user) {
    if (user.bot) return
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            reaction.fetch()
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error)
            // Return as `reaction.message.author` may be undefined/null
            return
        }
    }
    if (reaction.emoji.name == '❗') {
        let role = reaction.message.guild.roles.fetch(registered.role[reaction.message.guild.id]).then(role => {
            reaction.message.guild.members.fetch(user.id).then(member => {
                if (!member.roles.cache.has(role.id)) {
                    member.roles.add(role)
                }
            })
        })
    }
}

function onDisreactEmoji(reaction, user) {
    if (user.bot) return
    if (reaction.partial) {
        // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
        try {
            reaction.fetch()
        } catch (error) {
            console.log('Something went wrong when fetching the message: ', error)
            // Return as `reaction.message.author` may be undefined/null
            return
        }
    }
    if (reaction.emoji.name == '❗') {
        let role = reaction.message.guild.roles.fetch(registered.role[reaction.message.guild.id]).then(role => {
            reaction.message.guild.members.fetch(user.id).then(member => {
                if (member.roles.cache.has(role.id)) {
                    member.roles.remove(role)
                }
            })
        })
    }
}

module.exports = {
    roleEmbed: roleEmbed,
    onReactEmoji: onReactEmoji,
    onDisreactEmoji: onDisreactEmoji,
    initRole: initRole,
    initRoleMessage: initRoleMessage
}
