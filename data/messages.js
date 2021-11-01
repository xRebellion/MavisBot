
const Messages = {
    HELP: `
Here's a list of things you can do:

:question: │ m/help │ shows you this

▬▬▬▬▬▬▬ Fun Area ▬▬▬▬▬▬▬▬
:eyes: │ m/peekpicture <mention> │ take a peek on others 'w'

▬▬▬▬▬▬ Music (BETA) ▬▬▬▬▬▬
:arrow_forward: │ m/play <keyword> │ play a song on your voice channel
:arrow_up: │ m/playtop <keyword> │ play a song on top of queue
:x: | m/remove <index> | removes a song from queue
:arrow_heading_up: | m/move <from> [to] | moves a song from a position to somewhere else. moves to top if only one argument in specified.
:notes: │ m/q [page] │ view queue
:twisted_rightwards_arrows: │ m/shuffle │ shuffles queue
:fast_forward: │ m/skip │ skips what's playing right now
:door: | m/join | enters the voice channel you're in
:leaves: │ m/leave │ just straight up leaving the voice room because you asked me to .w.
:link: | m/lm | activates link mode - you can play songs just by pasting the youtube url link in that text channel

`,
    NO_MUSIC_PERMISSION: 'Ah~ I don\'t have permission to connect or speak ;~;',
    MUSIC_NO_ONE_IN_THE_ROOM: 'Wait a second... I can\'t find you in the room ._.',
    MUSIC_PLAYER_NOT_PLAYING: `What are you trying to do? I'm not playing any songs ~ 'w'`,
    MUSIC_WRONG_VOICE_CHANNEL: 'Wait a sec... You\'re not in the voice channel I\'m in ~_~'
}

module.exports = Messages