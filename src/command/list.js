
module.exports = [
    {
        name: 'play',
        description: 'play a song on your voice channel',
        options: [
            {
                name: 'song',
                type: 'STRING',
                description: 'Song name or YouTube URL',
                required: true
            }
        ]
    },
    {
        name: 'playtop',
        description: 'play a song on top of queue',
        options: [
            {
                name: 'song',
                type: 'STRING',
                description: 'Song name or YouTube URL',
                required: true
            }
        ]
    },
    {
        name: 'queue',
        description: 'see the music queue',
        options: [
            {
                name: 'page',
                type: 'INTEGER',
                description: 'Queue page number'
            }
        ]
    },
    {
        name: 'move',
        description: 'move a song somewhere else',
        options: [
            {
                name: 'from',
                type: 'INTEGER',
                description: 'move a song from here'
            },
            {
                name: 'to',
                type: 'INTEGER',
                description: 'to here'
            }
        ]
    },
    {
        name: 'shuffle',
        description: 'shuffles queue',
    },
    {
        name: 'skip',
        description: 'skips what\'s playing right now'
    },
    {
        name: 'leave',
        description: 'just straight up leaving the voice room because you asked me to .w.'
    },
    {
        name: 'me',
        description: 'show me',
        options: [
            {
                name: 'id',
                type: 'STRING',
                description: 'image id',
            }
        ]
    },
    {
        name: 'sticker',
        description: 'giff sticker',
        options: [
            {
                name: 'id',
                type: 'STRING',
                description: 'sticker id',
            }
        ]
    }
]