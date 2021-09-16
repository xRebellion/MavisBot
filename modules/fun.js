var helper = require("./helper.js")
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
    if (args[0] > me.length || args[0] <= 0) {
        message.channel.send("I don't have that .w. ~");
        return;
    }
    if (!args[0]) pick = me[Math.floor(Math.random() * me.length)]
    else pick = me[args[0] - 1]
    message.channel.send(null, {
        files: [
            "./img/mavis/" + pick
        ]
    })
}
function sticker(message, args) {
    var emotes = fs.readdirSync('./img/sticker/')
    var pick = null
    for (const name of emotes) {
        if (name.startsWith(args[0])) {
            pick = name;
            break;
        }
    }
    if (!pick) {
        message.channel.send("I don't have that .w. ~");
        return;
    }
    message.channel.send(null, {
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

