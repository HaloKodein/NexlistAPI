const Discord = require('discord.js')
const currencyFormatter = require('currency-formatter');
function clean(text) {if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203)); else return text;};   


exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const content = "Cuzin pretin delicia plapla\n xurubebeu sei la fodase"
  
  const feedEmbed = new Discord.MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL({dynamic:true}))
    .addField(`FeedBack`, `O seu bot **Nekz** recebeu um feedback de **${message.author.username}**\n\n${content}`, false)
    .addField(`Author`, `Junin#1342(557746795543789568)`, true)
    .addField(`Hash`, `GjawdsjsWsdjasA`, true)
    .setColor(client.color)
    .setFooter("NexList Team - Feedback");
  message.channel.send(feedEmbed)
};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['dev', 'developer'],
	permLevel: 10,
  manu: false
};

exports.help = {
	name: 'Testar',
	category: '🔧 Sistema',
	description: 'Aprova um bot',
	usage: '*aprovar id'
};