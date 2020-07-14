var { Client, MessageEmbed } = require('discord.js');
var logger = require('winston');
var auth = require('./data/auth.json');
var fs = require('fs');
const pathToRegistered = './data/registered.json'
var registered = require(pathToRegistered)
var music = require('./modules/music.js')
var message = require('./data/messages')
var roles = require('./modules/roles');
const { initRoleMessage, initRole } = require('./modules/roles');
const prefix = 'm/';


const embed = new MessageEmbed()
	// Set the title of the field
	.setTitle('**Mavis here~**')
	// Set the color of the embed
	.setColor(0x01a59c)
	// Set the main content of the embed
	.setDescription(message.help);
// Send the embed to the same channel as the message


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});
logger.level = 'debug';
// Initialize Discord client
var client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
client.on('ready', () => {
	client.user.setPresence({ activity: { name: 'm/help', type: 'LISTENING' } });
	logger.info('Ready!~');

});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('message', message => {
	if (registered.channels.includes(message.channel.id)) {
		addReaction(message);
	}
});
client.on('messageReactionAdd', roles.onReactEmoji);
client.on('messageReactionRemove', roles.onDisreactEmoji);



function addChannel(channelID) {
	if (!registered.channels.includes(channelID))
		registered.channels.push(channelID);
	JSON.stringify(registered);
	fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
		if (err) {
			console.error(err);
			return;
		};
	});
}
function addReaction(message) {
	message.react('👍').then(() => {
		message.react('👎')
	})
}

function reactToAllMessage(channel) {
	channel.messages.fetch().then(messages => {
		for (const [snowflake, message] of messages) {
			addReaction(message);
		}
		console.log(`Reacted to ${messages.size} messages!`)
	});

}

function getUserFromMention(mention) {
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
	return false;
}
function setDefaultVoice(guildID, voiceChannelID) {
	registered.default_voice_channels[guildID] = voiceChannelID;
	JSON.stringify(registered);
	fs.writeFileSync(pathToRegistered, JSON.stringify(registered, null, 4), (err) => {
		if (err) {
			console.error(err);
			return;
		};
	});

}
client.on('channelCreate', channel => {
	if (channel.guild.id != "617189159345586215") return; // Kampung MC
	if (channel.parentID != "618825049608028160") return; // Has to be on the refund channel
	let roles = channel.guild.roles.cache;
	let roleStaff = null;
	let roleSpecial = null;
	let roleRobot = null;
	for (const [snowflake, role] of roles) {
		if (role.name === "Staff") roleStaff = role;
		if (role.name === "Special") roleSpecial = role;
		if (role.name === "Robot") roleRobot = role;
		if (roleStaff != null && roleSpecial != null && roleRobot != null) break;
	}
	let warga = [];
	if (channel.name.startsWith('ticket-')) {
		members = channel.members;
		for (const [snowflake, member] of members) {
			if (!(member.roles.cache.has(roleStaff.id) || member.roles.cache.has(roleSpecial.id) || member.roles.cache.has(roleRobot.id))) {
				warga.push(member);
			}
		}
		for (w of warga) {
			channel.send(`<@${w.id}>`);
		}
		channel.send(message.refundFormat);
	}
});
client.on('message', message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;
	const serverQueue = music.queue.get(message.guild.id);

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

				// m/register
				case 'register':
					message.channel.send('Channel Registered!~');
					addChannel(message.channel.id)
					break;

				case 'reactall':
					reactToAllMessage(message.channel)
					break;
				case 'initRoleMessage':
					roles.initRoleMessage(message.guild.id, args[0]);
					console.log(args[1]);
					break;
				case 'initRole':
					roles.initRole(message.guild.id, args[0]);
					console.log(args[1]);
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
					message.channel.send("Peeking on others is not nice... But here it is =w=' \n", {
						files: [
							user.displayAvatarURL()
						]
					})
				} else {
					message.channel.send("I can't find the user that you're trying to peek on... ._.");
				}
				break;
			case 'helpkomporpls':
				message.channel.send("\"Bang kok ore grinderku jadi kompor bang?\"", {
					files: [
						"./img/kampung/kompor.gif"
					]
				})
				break;
			case 'helpaugmentpls':
				message.channel.send("\"Bang gimana caranya bikin augment mancing bang?\"", {
					files: [
						"./img/kampung/augment.gif"
					]
				}).then(() => {
					message.channel.send("Jangan lupa cek dulu syarat bikin augment sama `/fish stats` mu ya~");
				})
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
});

client.login(auth.token)