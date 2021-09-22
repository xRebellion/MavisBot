var helper = require("./util/helper.js")
var fs = require('fs');

function peekPicture(message, args) {
    var user = helper.getUserFromMention(args[0]);
    if (user) {
        message.channel.send("Peeking on others is not nice... But here it is\n", {
            files: [
                user.displayAvatarURL()
            ]
        })
    } else {
        message.channel.send("I can't find the user that you're trying to peek on...");
    }
}

function me(message, args) {
    var me = fs.readdirSync('./img/mavis/');
    var pick = null
    if (!args) {
        pick = me[Math.floor(Math.random() * me.length)]
    }
    else pick = args
    message.reply({
        files: [
            "./img/mavis/" + pick
        ]
    })
}
function sticker(message, args) {
    var emotes = fs.readdirSync('./img/sticker/')
    var pick = null
    for (const name of emotes) {
        if (name.startsWith(args)) {
            pick = name;
            break;
        }
    }
    if (!pick) {
        message.reply("I don't have that .w. ~");
        return;
    }
    message.reply({
        files: [
            "./img/sticker/" + pick
        ]
    })
}

module.exports = {
    peekPicture,
    me,
    sticker,
}

