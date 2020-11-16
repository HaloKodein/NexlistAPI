const Discord = require('discord.js')
const db = require('quick.db')

module.exports.run = async (client, message, args) => {
   
    
    
    
  let user = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || message.author;
  let id = await db.fetch(`BotID_${user.id}`);
   let ower = await   db.fetch(`BotOwner_${id}`);
   let desc = await db.fetch(`BotDesc_${id}`);
   let prefix = await db.fetch(`BotPrefix_${id}`);
   let site = await db.fetch(`BotSite_${id}`);
   let descmim = await db.fetch(`BotDescmin_${id}`);
   let vews = await db.fetch(`BotViews_${id}`);
  
   const err = new Discord.MessageEmbed()
   .setColor("RED")
  .setTitle("<:v2:773993754519404574> Erro")
   .setDescription(`${user} Não possui conta na Nex\n[Clique aqui para criar sua conta](https://discord.com/oauth2/authorize?response_type=code&redirect_uri=https%3A%2F%2Fnexlist.glitch.me%2Fcallback&scope=identify%20guilds%20email%20connections%20guilds.join&client_id=747251137421377546)`)
if(prefix === null){ return message.reply(err)
  
}
  
  const embed = new Discord.MessageEmbed()
  .setColor("GREEN")
  .setTitle(`<:info:772831223601037343> Info de: ${user.username}`)
    .addField("<:pc:773367601933058078> Prefix:",`\`\`\`js\n\n${prefix}\n\`\`\``,true)
    .addField("<:ping:774004873115992115> Vews:",`\`\`\`js\n\n${vews}\n\`\`\``,true)
    .addField("<:nuvem:773363688907997194> Nome do bot:",`<@${id}>`,true)
      .addField("<:ajuda:773367600822353942> Desc:",`${descmim}`,true)
  message.channel.send(embed)
}

exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: ['info', 'inf', 'i'],
	permLevel: 0,
  manu: false
};

exports.help = {
	name: 'info',
	category: '🔧 Sistema',
	description: 'informações das pessoas',
	usage: '*info <pessoa>'
};