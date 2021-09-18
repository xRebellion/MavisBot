var { Client } = require('discord.js');
var logger = require('winston');
var cmd = require('./modules/cmd');
var http = require('http');
const { time } = require('console');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

logger.level = 'debug';

// Initialize Discord client
var client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'], partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
client.on('ready', () => {
	client.user.setPresence({ activities: [{ name: 'm/help', type: 'WATCHING' }], status: 'online' });
	logger.info('Ready!~');

});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});



client.on('messageCreate', message => {
	cmd.processCmd(message)
});

client.login(process.env.MAVIS_BOT_TOKEN)

http.client((request, response) => {
	console.log("Received request to wake up! (" + Date.now() + ")")
}).listen(process.env.PORT || 6969)