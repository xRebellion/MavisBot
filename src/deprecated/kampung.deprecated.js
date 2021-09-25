client.on('channelCreate', channel => {
	if (channel.guild.id != "617189159345586215") return; // Kampung MC
	if (channel.parentID != "618825049608028160") return; // Has to be on the refund channel
	let roles = channel.guild.roles.cache
	let roleStaff = null
	let roleSpecial = null
	let roleRobot = null
	for (const [snowflake, role] of roles) {
		if (role.name === "Staff") roleStaff = role
		if (role.name === "Special") roleSpecial = role
		if (role.name === "Robot") roleRobot = role
		if (roleStaff != null && roleSpecial != null && roleRobot != null) break
	}
	let warga = []
	if (channel.name.startsWith('ticket-')) {
		members = channel.members
		for (const [snowflake, member] of members) {
			if (!(member.roles.cache.has(roleStaff.id) || member.roles.cache.has(roleSpecial.id) || member.roles.cache.has(roleRobot.id))) {
				warga.push(member)
			}
		}
		for (w of warga) {
			channel.send(`<@${w.id}>`)
		}
		channel.send(message.refundFormat)
	}
});