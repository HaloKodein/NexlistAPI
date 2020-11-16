const url = require('url');
const path = require('path');
const fs = require('fs');
const owners = '557746795543789568';
const clientPerms = "2113404159";
const Discord = require('discord.js');
const db = require('quick.db');
const ms = require('ms');
const cF = require('currency-formatter');
const express = require('express');
const app = express();
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const md = require('marked');
const morgan = require('morgan');
const moment = require('moment');
var queue = new Map();
const config = require('./config.js')

require('moment-duration-format');

module.exports = (client) => {
  client.db = require('quick.db');
  //const DBL = require("dblapi.js");
  //const dbl = new DBL(process.env.DBLTOKEN, client);

	if (client.config.dashboard.enabled !== 'true') return console.log('LOG', 'Dashboard está desativada', 'INFO');

	const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);

	const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

	app.set('trust proxy', 5);

	app.use('/public', express.static(path.resolve(`${dataDir}${path.sep}public`), { maxAge: '10h' }));
  app.use('/content', express.static(path.resolve(`${dataDir}${path.sep}content`), { maxAge: '10h' }));
  app.use('/js', express.static(path.resolve(`${dataDir}${path.sep}js`), { maxAge: '10h' }));
  app.use('/assets', express.static(path.resolve(`${dataDir}${path.sep}assets`), { maxAge: '10h' }));
	app.use(morgan('combined'));

	passport.serializeUser((user, done) => {
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});

	var protocol;

	if (client.config.dashboard.secure === 'true') {
		client.protocol = 'https://';
	} else {
		client.protocol = 'http://';
	}

	protocol = client.protocol;

	if (client.config.dashboard.secure === 'true') {
		client.protocol = 'https://';
	} else {
		client.protocol = 'http://';
	}

	protocol = client.protocol;

	client.callbackURL = `https://nexlist.glitch.me/callback`;
	console.log('[LOG]', `Callback URL: ${client.callbackURL}`, '[INFO]');
	passport.use(new Strategy({
		clientID: client.user.id,
		clientSecret: client.config.dashboard.oauthSecret,
		callbackURL: client.callbackURL,
		scope: ['identify', 'guilds', 'email', 'connections', 'guilds.join']
	},
	(accessToken, refreshToken, profile, done) => {
		process.nextTick(() => done(null, profile));
	}))

app.use(session({
		secret: client.config.dashboard.sessionSecret,
		resave: true,
		saveUninitialized: false,
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	app.locals.domain = client.config.dashboard.domain;

	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	var bodyParser = require('body-parser');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	function checkAuth(req, res, next) {
		if (req.isAuthenticated()) return next();
		req.session.backURL = req.url;
		res.redirect('/login');
	}

	function cAuth(req, res) {
		if (req.isAuthenticated()) return;
		req.session.backURL = req.url;
		res.redirect('/login');
	}

	function checkAdmin(req, res, next) {
    const ids = db.fetch(`Admins_dashboard.ids`)
		if (req.isAuthenticated() && ids.includes(req.user.id)) return next();
		req.session.backURL = req.originalURL;
		res.redirect('/');
	}
  
  function checkGuild(req, res, next) {
    const ids = db.fetch(`Admins_dashboard.ids`)
    if (req.isAuthenticated() && ids.includes(req.user.id)) return next();
		req.session.backURL = req.originalURL;
		res.redirect('/');
  }

  var documentation = '';
	fs.readFile(`${process.cwd()}${path.sep}dashboard${path.sep}public${path.sep}documentacao.md`, function(err, data) {
		if (err) {
			console.log(err);
			documentation = 'Error';
			return;
		}
		documentation = data.replace(/\{\{botName\}\}/g, client.user.username).replace(/\{\{email\}\}/g, client.config.dashboard.legalTemplates.contactEmail);
		if (client.config.dashboard.secure !== 'true') {
			documentation = documentation.replace('Sensitive and private data exchange between the Site and its Users happens over a SSL secured communication channel and is encrypted and protected with digital signatures.', '');
		}
	});

app.get('/', (req, res) => {
    const user = req.isAuthenticated() ? req.user : null;
    console.log(user)
    //dbl.getBot(client.user.id).then(bot => {
     res.render(path.resolve(`${templateDir}${path.sep}index.ejs`), {
			bot: client,
      db: db,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
       stats: {
		   members: client.users.cache.size,
       guilds: client.guilds.cache.size,
			 uptime:  moment.duration(client.uptime).format(' D[d], H[h], m[m], s[s]'),
		   commands: client.commandsNumber,
       channels: client.channels.cache.size
		 	},
      dbl: client,
     });
   //});
	});
  
  app.get('/bots', (req, res) => {
   const guild = client.guilds.cache.get(client.guildList);
    res.render(path.resolve(`${templateDir}${path.sep}bots.ejs`), {
      bot: client,
      auth: req.isAuthenticated() ? true : false,
      user: req.isAuthenticated() ? req.user : null,
      guild: guild,
      moment: moment,
      db: db
     });
  });
  
  app.get('/add/bot', checkAuth, async (req,res) => {
    const user = req.isAuthenticated() ? req.user : null;
    
    res.render(path.resolve(`${templateDir}${path.sep}add.ejs`), {
      bot: client,
      auth: req.isAuthenticated() ? true : false,
      user: user,
      moment: moment,
      db: db
     });
  })
  
  app.get('/edit/:id', checkAuth, async (req,res) => {
    const user = req.isAuthenticated() ? req.user : null;
    const usuario = client.users.cache.get(req.params.id)
    
    res.render(path.resolve(`${templateDir}${path.sep}edit.ejs`), {
      bot: client,
      auth: req.isAuthenticated() ? true : false,
      user: user,
      usuario: usuario,
      db: db
     });
  })
  
  app.post('/edit/:id', checkAuth, async (req, res) => {
    const user = req.isAuthenticated() ? req.user : null;
    const channel = client.channels.cache.get(config.list.channelid);
    const log = client.channels.cache.get(config.list.privatelog);
    var { id } = req.params;
    var { desc,prefix,siteURL,descMIN,feedback } = req.body;

    if (!desc || desc == null){
      console.log("[DASHBOARD] desc nulo partiu do usuario " + user.id)
      db.set(`BotDesc_${id}`, "Sem descrição")
    } else {
      db.set(`BotDesc_${id}`, desc)
    };

    if (!prefix || prefix == null){
      console.log("[DASHBOARD] prefix nulo partiu do usuario " + user.id)
      db.set(`BotPrefix_${id}`, "!")
    } else {
      db.set(`BotPrefix_${id}`, prefix)
    };

    if (!siteURL || siteURL == null){
      console.log("[DASHBOARD] site nulo partiu do usuario " + user.id)
      db.set(`BotSite_${id}`, "null")
    } else {
      db.set(`BotSite_${id}`, siteURL)
    }

    if (!descMIN || descMIN == null){
      console.log("[DASHBOARD] desmin nulo partiu do usuario " + user.id)
      db.set(`BotDescmin_${id}`, "Sem descrição")
    } else {
      db.set(`BotDescmin_${id}`, descMIN)
    };
    
    if (!feedback || feedback == null){
      console.log("[DASHBOARD] feedback nulo partiu do usuario " + user.id)
      db.set(`FeedBackOPS_${id}`, "on")
    } else {
      db.set(`FeedBackOPS_${id}`, feedback)
    };

    const logEmbed = new Discord.MessageEmbed()
    .setAuthor("Dashboard Log", client.user.displayAvatarURL({format: "png"}))
    .addField("Bot Editado",`ID: ${id}\nAuthor: ${user.username}\nPrefixo: ${prefix}\nLink: [adicione](https://discord.com/oauth2/authorize?client_id=${id}&permissions=4700192718&scope=bot)\n\nDescrição:${desc}`)
    .setColor(client.color)
    .setFooter(user.username)
    log.send(logEmbed)

    const embed = new Discord.MessageEmbed()
    .setTitle("Dashboard Log")
    .setColor(client.color)
    .setDescription(`O <@${user.id}> editou o bot **(${id})**`)
    channel.send(embed);

    const bot = client.users.cache.get(id);

    const botObject = [];
    
    botObject.push({
      bots: [{
        id: [bot.id],
        username: [bot.username],
        displayAvatarURL: [bot.displayAvatarURL({dynamic:true, format:"png", size: 1024})]
      }]
    });
    
    user.options = botObject;

    db.set(`UserOptions_${user.id}`, botObject)

    res.status(200).redirect('/bots')
  })
  
  app.post('/add/bot', checkAuth, async (req,res) => {
    const user = req.isAuthenticated() ? req.user : null;
    const channel = client.channels.cache.get(config.list.channelid);
    const log = client.channels.cache.get(config.list.privatelog);
    
    var { id,desc,prefix,siteURL,descMIN,library } = req.body;
    
    if (!id || id == null){ console.log("[DASHBOARD] id nulo partiu do usuario " + user.id) } else {
      db.set(`BotID_${user.id}`, `${id}`) 
      db.set(`BotOwner_${id}`, `${user.id}`);
      db.set(`FeedBackOPS_${id}`, "on");
    };
    if (!desc || desc == null){
      console.log("[DASHBOARD] desc nulo partiu do usuario " + user.id)
      db.set(`BotDesc_${id}`, "Sem descrição")
    } else {
      db.set(`BotDesc_${id}`, desc)
    };
    
    if (!prefix || prefix == null){
      console.log("[DASHBOARD] prefix nulo partiu do usuario " + user.id)
      db.set(`BotPrefix_${id}`, "!")
    } else {
      db.set(`BotPrefix_${id}`, prefix)
    };
    
    if (!siteURL || siteURL == null){
      console.log("[DASHBOARD] site nulo partiu do usuario " + user.id)
      db.set(`BotSite_${id}`, "null")
    } else {
      db.set(`BotSite_${id}`, siteURL)
    }
    
    if (!descMIN || descMIN == null){
      console.log("[DASHBOARD] desmin nulo partiu do usuario " + user.id)
      db.set(`BotDescmin_${id}`, "Sem descrição")
    } else {
      db.set(`BotDescmin_${id}`, descMIN)
    };
    
    if (!library || library == null){
      console.log("[DASHBOARD] library nulo partiu do usuario " + user.id)
      db.set(`BotLibrary_${id}`, library)
    } else {
      db.set(`BotLibrary_${id}`, library)
    }
    
    const logEmbed = new Discord.MessageEmbed()
    .setAuthor("Dashboard Log", client.user.displayAvatarURL({format: "png"}))
    .addField("Bot Adicionado",`ID: ${id}\nAuthor: ${user.username}\nPrefixo: ${prefix}\nLink: [adicione](https://discord.com/oauth2/authorize?client_id=${id}&permissions=4700192718&scope=bot)\n\nDescrição:${desc}`)
    .setColor(client.color)
    .setFooter(user.username)
    log.send(logEmbed)
    
    const embed = new Discord.MessageEmbed()
    .setTitle("Dashboard Log")
    .setColor(client.color)
    .setDescription(`O <@${user.id}> adicionou o bot **(${id})**\nEle ira passar por uma verificação humana`)
    channel.send(embed);
    
    const bot = client.users.cache.get(id);
    
    user.options = {
      bots: [{
        id: [bot.id],
        username: [bot.username],
        displayAvatarURL: [bot.displayAvatarURL({dynamic:true, format:"png", size: 1024})]
      },]
    }
    
    db.set(`UserOptions_${user.id}`, {
      bots: [{
        id: [bot.id],
        username: [bot.username],
        displayAvatarURL: [bot.displayAvatarURL({dynamic:true, format:"png", size: 1024})]
      },]})
    
    res.status(200).redirect('/')
  })
  
  async function accept(id, reason, req){
    const bot = client.users.cache.get(id);
    const channel = client.channels.cache.get(config.list.channelid);
    const user = req.isAuthenticated() ? req.user : null;
    const member = client.guilds.cache.get(config.list.guildid).members.cache.get(id);
    const ownerId = await db.fetch(`BotOwner_${id}`)
    const owner = client.users.cache.get(ownerId);
    
    db.set(`Verfield_${id}`, 'true');
    
    member.roles.add(config.list.botroleid)
    
    const botSucess = new Discord.MessageEmbed()
    .setTitle("Dashboard Log")
    .setDescription(`O bot ${bot.username} foi aprovado por ${user.username}`)
    .setColor(client.color)

    const botSucessOwner = new Discord.MessageEmbed()
    .setAuthor("NexList", client.user.displayAvatarURL({dynamic:true}))
    .setDescription(`O seu bot foi aprovador por ${user.username}\nFeed: ${reason}`)
    .setColor(client.color)
    .setFooter("NexList Team")
    
    owner.send(botSucessOwner)
    channel.send(botSucess)
  }
  
  async function reject(id, reason, user){
    const bot = client.users.cache.get(id);
    const channel = client.channels.cache.get(config.list.channelid);
    const ownerId = await db.fetch(`BotOwner_${id}`)
    const owner = client.users.cache.get(ownerId);
    
    console.log(user.username)
    
    const botReprove = new Discord.MessageEmbed()
    .setTitle("Dashboard Log")
    .setDescription(`O bot ${bot.username} foi reprovado por ${user.username}`)
    .setColor(client.color);
    
    const feedBack = new Discord.MessageEmbed()
    .setAuthor(bot.username, bot.displayAvatarURL({dynamic:true,format: "png",size: 1024}))
    .addField("Bot Reprovado", `Seu bot foi reprovado pela nossa equipe!\nMotivo:\n\n${reason}`, true)
    .setColor(client.color)
    .setFooter("Equipe NexList")
    
    owner.send(feedBack)
    channel.send(botReprove)
  }
  
  async function remove(id, user){
    db.delete(`BotID_${user.id}`) 
    db.delete(`BotOwner_${id}`);
    db.delete(`BotDesc_${id}`);
    db.delete(`BotPrefix_${id}`);
    db.delete(`BotSite_${id}`);
    db.delete(`BotDescmin_${id}`);
    db.delete(`Verfield_${id}`);
  }
  
  app.get('/admin/remove/:id', checkAdmin, (req, res) => {
    const { id } = req.params;
    const user = req.isAuthenticated() ? req.user : null;
    remove(id, user)
    
    res.redirect("/admin")
  });
  
  app.post('/admin/accept/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    accept(id, reason, req);
    console.log("[DASHBOARD] Bot aprovado ID: ", id)
    res.redirect('/admin')
	});
  
  app.post('/admin/reject/:id', checkAdmin, async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.isAuthenticated() ? req.user : null;
    reject(id, reason, user);
    console.log("[DASHBOARD] Bot reprovado ID: ", id)
    res.redirect('/admin')
	});
  
  app.get('/admin/:id', checkAdmin, (req, res) => {
    const { id } = req.params;
    let usuario = client.users.cache.get(id);
    
    res.render(path.resolve(`${templateDir}${path.sep}sendadmin.ejs`), {
      bot: client,
      auth: true,
      user: req.user,
      usuario: usuario,
      moment: moment,
      db: db
    });
  });

  app.get('/bot/:userID', async (req, res) => {
    let usuario = client.users.cache.get(req.params.userID)
    const moment = require('moment')
    if (req.isAuthenticated()) {
      res.render(path.resolve(`${templateDir}${path.sep}user.ejs`), {
      bot: client,
      auth: true,
      user: req.user,
      usuario: usuario,
      moment: moment,
      db: db
    });
    } else {
     res.render(path.resolve(`${templateDir}${path.sep}user.ejs`), {
       bot: client,
       auth: false,
       user: null,
       usuario: usuario,
       moment: moment,
       db: db
       });
      };
  });
  
  async function sendFeed(userID, content, user){
    const author = client.users.cache.get(user.id);
    const ownerID = await db.fetch(`BotOwner_${userID}`);
    const owner = client.users.cache.get(ownerID);
    const botuser = client.users.cache.get(userID)
    
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
    for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    db.set(`Feeds_${user.id}`, { hash: text, bot: userID });
    
    const feedEmbed = new Discord.MessageEmbed()
    .setAuthor(author.username, author.displayAvatarURL({dynamic:true}))
    .addField(`Feedback`, `O seu bot **${botuser.username}** recebeu um feedback de **${author.username}**\n\n${content}`, false)
    .addField(`Author`, `${user.username} (${user.id})`, true)
    .addField(`Hash`, `${text}`, true)
    .setColor(client.color)
    .setFooter("NexList Team - Feedback");
    
    owner.send(feedEmbed)
  }
  
  app.post('/bot/:userID', checkAuth, async (req, res) => {
    const { userID } = req.params;
    const { content } = req.body;
    const user = req.isAuthenticated() ? req.user : null;
    
    sendFeed(userID, content, user);
    
    res.redirect('/bot/' + userID);
  })

  app.get('/add/:id', async (req, res) => {
    const id = req.params.id;
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${id}&scope=bot&response_type=code&permissions=8`)
  });

  app.get('/user/:userID', async (req, res) => {
    let usuario = client.users.cache.get(req.params.userID);
    
    if (req.isAuthenticated()) {
      res.render(path.resolve(`${templateDir}${path.sep}devs.ejs`), {
      bot: client,
      auth: true,
      user: req.user,
      usuario: usuario,
      moment: moment,
      db: db
    });
   } else {
   res.render(path.resolve(`${templateDir}${path.sep}devs.ejs`), {
     bot: client,
     auth: false,
     user: null,
     usuario: usuario,
     moment: moment,
     db: db
     });
    };
  });

  app.get('/user' && '/user/', (req, res) => {
    res.redirect('/')
  });


  const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
  };

 app.get("/autherror", (req, res) => {
    res.render(path.resolve(`${templateDir}${path.sep}autherror.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
    });
  });

	app.get('/guide', function (req, res) {
    var showdown	= require('showdown');
		var	converter = new showdown.Converter(),
			textPr			= documentation,
			htmlPr			= converter.makeHtml(textPr),
			textTe			= documentation,
			htmlTe			= converter.makeHtml(textTe);
		res.render(path.resolve(`${templateDir}${path.sep}documentacao.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
			commands: htmlPr.replace(/\\'/g, `'`),
			manage: htmlTe.replace(/\\'/g, `'`),
			edited: client.config.dashboard.legalTemplates.lastEdited
		})
  });

app.get('/guilds',async (req, res) => {
    const db = require("quick.db")
      // if (partner == true) {return true} else {return false};
    //client.guilds.cache.map(async guild => {
    //const description = await db.fetch(`guildSettings_${guild.id}_description`);
		res.render(path.resolve(`${templateDir}${path.sep}guilds.ejs`),{
			bot: client,
      db: db,
      //description: description,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
		 });
    //});
});
  
   app.get('/users', (req, res) => {
		res.render(path.resolve(`${templateDir}${path.sep}users.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
      owners: owners
		 });
	});

  app.get('/guild/:guildID', (req, res) => {
   const guild = client.guilds.cache.get(req.params.guildID);
    res.render(path.resolve(`${templateDir}${path.sep}guild.ejs`), {
      bot: client,
      auth: req.isAuthenticated() ? true : false,
      user: req.isAuthenticated() ? req.user : null,
      guild: guild,
      moment: moment,
      owners: owners,
      serverList: client.guilds.cache.get(req.params.guildID).options,
      invite: guild.options,
      createdAt: moment.utc(client.guilds.cache.get(req.params.guildID).createdAt).format('LLLL').replace('January', 'Janeiro').replace('February', 'Fevereiro').replace('March', 'Março').replace('April', 'Abril').replace('May', 'Maio').replace('June', 'Junho').replace('July', 'Julho').replace('August', 'Agosto').replace('September', 'Setembro').replace('October', 'Outubro').replace('November', 'Novembro').replace('December', 'Dezembro').replace('Sunday', 'Domingo').replace('Monday', 'Segunda-Feira').replace('Tuesday', 'Terça-Feira').replace('Wednesday', 'Quarta-Feira').replace('Thursday', 'Quinta-Feira').replace('Friday', 'Sexta-Feira').replace('Saturday', 'Sábado')
     });
  });

  app.get('/support', (req, res) => {
    res.redirect("https://discord.gg/nNBB3TP")
  });

	app.get('/login', (req, res, next) => {
		if (req.session.backURL) {
			req.session.backURL = req.session.backURL;
		} else if (req.headers.referer) {
			const parsed = url.parse(req.headers.referer);
			if (parsed.hostname === app.locals.domain) {
				req.session.backURL = parsed.path;
			}
		} else {
			req.session.backURL = '/me';
		}
		next();
	},
	passport.authenticate('discord'));


  app.get('/login/default', (req, res) => {
   res.render(path.resolve(`${templateDir}${path.sep}loginDefault.ejs`), {
	  bot: client,
    auth: req.isAuthenticated() ? true : false,
    user: req.isAuthenticated() ? req.user : null,
	 });
  });

  app.post('/login/default', (req, res) => {

  });

  
	app.get('/callback', passport.authenticate('discord', {
		failureRedirect: '/autherror'
	}), (req, res) => {
		if (req.session.backURL) {
			res.redirect(req.session.backURL);
			req.session.backURL = null;
		} else {
			res.redirect('/');
		}
	});

  app.get('/manage/project', checkAdmin, async (req, res) => {
		res.render(path.resolve(`${templateDir}${path.sep}project.ejs`), {
			bot: client,
			user: req.user,
      db: db,
			auth: true
		});
	});
  
	app.get('/admin', checkAdmin, async (req, res) => {
    const perms = Discord.Permissions;
    const user = req.user;
		res.render(path.resolve(`${templateDir}${path.sep}admin.ejs`), {
			bot: client,
			user: req.user,
      perms: perms,
      db: db,
			auth: true
		});
	});
  
  app.get('/rmpartner/:guildID', checkAdmin, (req, res) => {
    db.set(`GuildPartner_${req.params.guildID}`, false)
    res.redirect("/admin")
  })
  
  app.get('/addpartner/:guildID', checkAdmin, (req, res) => {
    db.set(`GuildPartner_${req.params.guildID}`, true)
    res.redirect("/admin")
  })

  app.get('/me', checkAuth, async (req, res) => {
    const perms = Discord.Permissions;
    const user = req.user;
    const ops = await db.fetch(`UserOptions_${user.id}`)

    if (!ops || ops == null){
      var coptions = false;
    } else {
      coptions = ops;
    }
    
    user.options = coptions;

    res.render(path.resolve(`${templateDir}${path.sep}dashboard.ejs`), {
      perms: perms,
      bot: client,
      user: user,
      auth: true,
      moment: moment,
      db: db
    });
  });

	app.get('/add/:guildID', checkAuth, (req, res) => {
		req.session.backURL = '/me';
		var invitePerm = client.config.dashboard.invitePerm;
		var inviteURL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&guild_id=${req.params.guildID}&response_type=code&redirect_uri=${encodeURIComponent(`${client.callbackURL}`)}&permissions=${invitePerm}`;
		if (client.guilds.cache.has(req.params.guildID)) {
			res.send('<p>Dark já está neste servidor <script>setTimeout(function () { window.location="/me"; }, 1000);</script><noscript><meta http-equiv="refresh" content="1; url=/dashboard" /></noscript>');
		} else {
			res.redirect(inviteURL);
		}
	});

	app.post('/manage/:guildID', checkAuth, (req, res) => {
		const guild = client.guilds.cache.get(req.params.guildID);
		if (!guild) return res.status(404);
		const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has('MANAGE_GUILD') : false;
		if (req.user.id === client.config.ownerID) {} else if (!isManaged) {
			res.redirect('/');
		}
   const guildSettings = {
      welcomeChannel: req.body.welcomeChannel,
      byeChannel: req.body.byeChannel,
      welcomeMessage: req.body.welcomeMessage,
      byeMessage: req.body.byeMessage,
      welcomeAutoRole: req.body.welcomeAutoRole,
   };
    
   client.guilds.cache.get(guild.id).options = guildSettings;
   let welcome = req.body.welcomeChannel;
    if (!welcome){ welcome = null };
   let bye = req.body.byeChannel;
    if (!bye){ bye = null };
   let welcomeMessage = req.body.welcomeMessage;
    if (!welcomeMessage){ welcomeMessage = null };
   let byeMessages = req.body.byeMessage;
    if (!byeMessages){ byeMessages = null };
   let role = req.body.welcomeAutoRole;
    if (!role){ role = null };
    console.log(role)
    
   db.set(`guildSettings_${guild.id}_welcomeChannel`, welcome);
   db.set(`guildSettings_${guild.id}_byeChannel`, bye);
   db.set(`guildSettings_${guild.id}_welcomeMessage`, welcomeMessage);
   db.set(`guildSettings_${guild.id}_byeMessage`, byeMessages);
   db.set(`guildSettings_${guild.id}_welcomeAutoRole`, role);
		res.redirect(`/manage/${req.params.guildID}`);
	});

	app.get('/manage/:guildID', checkAuth, (req, res) => {
		const guild = client.guilds.cache.get(req.params.guildID);
		if (!guild) return res.status(404);
    
		const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has('MANAGE_GUILD') : false;
		if (req.user.id === client.config.ownerID) {
			console.log(``);
		} else if (!isManaged) {
			res.redirect('/me');
		};
		res.render(path.resolve(`${templateDir}${path.sep}manage.ejs`), {
			bot: client,
			guild: guild,
			user: req.user,
			auth: true,
      packs: {
       moment: moment,
       db: db
      },
		});
	});
  
	app.get('/commands', (req, res) => {
		if (req.isAuthenticated()) {
			res.render(path.resolve(`${templateDir}${path.sep}commands.ejs`), {
				bot: client,
				auth: true,
				user: req.user,
				md: md
			});
		} else {
			res.render(path.resolve(`${templateDir}${path.sep}commands.ejs`), {
				bot: client,
				auth: false,
				user: null,
				md: md
			});
		}
	});

  app.get('/i/:guildID', (req, res) => {
    let guild = client.guilds.cache.get(req.params.guildID);
    guild.fetchInvites().then(invites => {
     var oxone = invites.filter(inv => inv.inviter.id == client.user.id)
     guild.channels.cache.random().createInvite().then(a => res.redirect(a))
    })
  });

  app.get('/remove/:guildID', checkAdmin, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    if (!guild || guild == undefined) return;
    guild.leave()
    res.redirect('/admin')
  });
  
  app.get('/genkey', checkAdmin, (req, res) => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
    for (var i = 0; i < 28; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    db.set(`PremiumKeys`, { keys: text })
    res.redirect('/admin')
  });
  
  app.get('/reskey', async (req, res) => {
    const premium = req.body.premium;
    const validade = await db.has(`PremiumKeys.keys`, premium);
    console.log(req.body.premium)
    if (validade == true){
      client.users.cache.get('557746795543789568').send("Key TGY-nmyZhwzFqgvO3j2AyGzU3K4t\nFoi resgatada por Codein")
    } else {
      res.redirect('/');
    }
  })
  
  // Anti raid URL, completa assim que fazer uma function para checkar admin
  
  /*app.get('/raidon/:guildID', checkAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    db.set(`AntiRaid_${req.params.guildID}`, true)
    res.redirect('/guild/' + req.params.guildID);
  });
  
  app.get('/raidoff/:guildID', checkAuth, (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildID);
    db.set(`AntiRaid_${req.params.guildID}`, undefined)
    res.redirect('/guild/' + req.params.guildID);
  });*/
  
	app.get('/premium',function (req, res) {

		md.setOptions({
			renderer: new md.Renderer(),
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: false,
			sanitize: false,
			smartLists: true,
			smartypants: false
		});

		res.render(path.resolve(`${templateDir}${path.sep}premium.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
			premium: md(documentation),
			edited: client.config.dashboard.legalTemplates.lastEdited
		});
	});
  
  app.post('/premium', async (req, res) => {
    if (req.isAuthenticated() == true){
      const key = req.body.key;
      const validade = await db.has(`PremiumKeys.keys`, key);
      if (validade == true){
        res.redirect('/premium')
        res.status(200)
        db.delete(`PremiumKeys`)
        db.add(`userBalance_${req.user.id}`, 10000)
        db.add(`userRep1_${req.user.id}`, 1)
        db.add(`level_${req.user.id}`, 1)
        db.set(`Premium_${req.user.id}`, true)
      } else {
        res.redirect('/');
      }
    } else {
      res.redirect('/login')
    }
	});

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

  app.get('/contributors', (req, res) => {
    res.render(path.resolve(`${templateDir}${path.sep}contributors.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
    });
  });
  
  app.get('/add', (req, res) => {
   res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=${clientPerms}`);
  });

  app.get('/generateToken', checkAuth, (req, res ) => {
   function generateToken() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";

    for (var i = 0; i < 10; i++)
     text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
   }
  
    var token = generateToken()
    client.db.set(`userToken_${req.user.id}`, token);
    client.users.cache.get(req.user.id).options.token = token;
    
   res.redirect('/edit');
  });

  app.get('/watch/:videoID', (req, res) => {
     res.render(path.resolve(`${templateDir}${path.sep}video.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
      videoID: req.params.videoID
   });
  });

  app.get('/clip/:clipID', (req, res) => {
     res.render(path.resolve(`${templateDir}${path.sep}clip.ejs`), {
			bot: client,
			auth: req.isAuthenticated() ? true : false,
			user: req.isAuthenticated() ? req.user : null,
      clipID: req.params.clipID
   });
  });

	app.get('*', function(req, res) { // Catch-all 404
		res.send('<link href="/public/theme-dark.css" rel="stylesheet" id="theme"> <h1 style="font-family: "Pacifico", cursive; text-transform: none;"> 404 Página não encontrada...</h1> <script>setTimeout(function () { window.location = "/"; }, 1000);</script><noscript><meta http-equiv="refresh" content="1; url=/" /></noscript>');
	});

	client.site = app.listen(client.config.dashboard.port, function() {
		console.log('[LOG]', `Painel em execução na porta ${client.config.dashboard.port}`, '[INFO]');
	}).on('error', (err) => {
		console.log('[ERROR]', `Erro ao iniciar o painel: ${err.code}`);
		return process.exit(0);
	});
};
