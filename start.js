var { Client } = require('discord.js');
var logger = require('winston');
var command = require('./src/command/command');
var slashCommand = require('./src/command/slashCommand');

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



client.on('messageCreate', command.processCmd)
client.on('interactionCreate', slashCommand.processSlashCmd)

client.login(process.env.MAVIS_BOT_TOKEN)

// I'll leave this here just in case in need of a ping target
// http.createServer((request, response) => {
// 	console.log("Received request to wake up! (" + new Date(Date.now()).toLocaleString("en-US", { timezone: 'Asia/Jakarta' }) + ")")
// 	response.writeHead(200)
// 	response.end('Pong!')
// }).listen(process.env.PORT || 6969)