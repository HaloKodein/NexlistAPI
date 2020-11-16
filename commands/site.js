const Discord = require('discord.js')


module.exports.run = async (client, message, args) => {
  
  const embed = new Discord.MessageEmbed()
  .setTitle("Nex")
  .addField("Nosso site",`[Clique aqui}(https://nexlist.glitch.me/bots)`,true)
  message.channel.send(embed)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['site',"nex"],
	permLevel: 0,
  manu: false
};

exports.help = {
	name: 'site',
	category: '🔧 Sistema',
	description: 'mostra o site .-.',
	usage: 'site'
};