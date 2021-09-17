
const Messages = {
    HELP: `
Here's a list of things you can do:

:question: │ m/help │ shows you this

▬▬▬▬▬▬▬ Fun Area ▬▬▬▬▬▬▬▬
:eyes: │ m/peekpicture <mention> │ take a peek on others 'w'

▬▬▬▬▬▬ Music (ALPHA) ▬▬▬▬▬▬
:arrow_forward: │ m/play <keyword> │ play a song on your voice channel
:arrow_up: │ m/playtop <keyword> │ play a song on top of queue
:notes: │ m/queue [page] │ view queue
:twisted_rightwards_arrows: │ m/shuffle │ shuffles queue
:fast_forward: │ m/skip │ skips what's playing right now
:leaves: │ m/leave │ just straight up leaving the voice room because you asked me to .w.

`,
    NO_MUSIC_PERMISSION: 'Ah~ I don\'t have permission to connect or speak ;~;',
    MUSIC_NO_ONE_IN_THE_ROOM: 'Wait a second... I can\'t find you in the room ._. I\'m leaving then~',
    MUSIC_SKIP: `What are you trying to do? I'm not playing any songs ~ 'w'`,
    MUSIC_WRONG_VOICE_CHANNEL: 'Wait a sec... You\'re not in the voice channel I\'m in ~_~'
}

module.exports = Messages