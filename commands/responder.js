const Discord = require('discord.js') 
const db = require("quick.db")

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const id = args[0];
  const hashID = args[1];
  
  if (id && hashID){
    const hash = await db.fetch(`Feeds_${id}.hash`);
    const botid = await db.fetch(`Feeds_${id}.bot`);
    const bot = client.users.cache.get(botid);
    const author = client.users.cache.get(id);
    
    if (hashID == hash){
      message.channel.send("Qual é a sua resposta?").then(msg => {
        const filter = (m) => m.content.startsWith("-");
  	    const collector = message.channel.createMessageCollector(filter, {time: 60000})

        var l = false;
        collector.on("collect", (m) => {
          const embed = new Discord.MessageEmbed()
          .setAuthor(message.author.username, message.author.displayAvatarURL({dynamic:true}))
          .setDescription(`O seu feedback ao bot **${bot.username}** foi respondido!\nFoi respondido pelo dev **${message.author.username}**\n\n${m.content.replace("-","")}`)
          .setColor(client.color)
          .setFooter("NexList - Feedback")
          author.send(embed)
          message.channel.send("Sua mensagem foi enviada com sucesso!");
          l = true;
        })
        if (l === true){
          collector.end;
        }
      })
    } else {
      message.channel.send("Hash inválida ou expirada!")
    }
  } else {
    message.channel.send("Diga o id e á hash!")
  }
};

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['reply', 'res'],
	permLevel: 0,
  manu: false
};

exports.help = {
	name: 'Responder',
	category: '🔧 Sistema',
	description: 'Responde um bot',
	usage: '*res id'
};