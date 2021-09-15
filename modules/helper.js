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