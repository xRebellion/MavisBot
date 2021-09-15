var { Client, MessageEmbed } = require('discord.js');
var logger = require('winston');
var auth = require('./data/auth.json');
var fs = require('fs');
var message = require('./data/messages')
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

client.on('message', message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;
	const serverQueue = music.queue.get(message.guild.id);

	processCmd(message)
});

client.login(auth.token)