const Discord = require('discord.js')


module.exports.run = async (client, message, args) => {
  
  const embed = new Discord.MessageEmbed()
  .setTitle("Help")
  .addField("Bot-list",` *responder <id-usuario> <hash-key>\n-<resposta>\n*info <pessoa>`,true)
  message.channel.send(embed)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['help', 'ajuda', 'hp', "ajd"],
	permLevel: 0,
  manu: false
};

exports.help = {
	name: 'Help',
	category: '🔧 Sistema',
	description: 'Lista dos comandos',
	usage: '*help'
};