var { Client } = require('discord.js');
var logger = require('winston');
var auth = require('./data/auth.json');
var cmd = require('./modules/cmd')

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
	colorize: true
});

logger.level = 'debug';

// Initialize Discord client
var client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'], partials: ['MESSAGE', 'CHANNEL', 'REACTION'] })
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



client.on('messageCreate', message => {
	cmd.processCmd(message)
});

client.login(auth.token)