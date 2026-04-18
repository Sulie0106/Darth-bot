require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const giveaways = new Map();

function parseDuration(str) {
  const m = str.match(/(\d+)(s|m|h)/);
  if (!m) return 60000;
  const v = parseInt(m[1]);
  if (m[2] === 's') return v * 1000;
  if (m[2] === 'm') return v * 60000;
  return v * 3600000;
}

function pick(set) {
  const arr = [...set];
  return arr[Math.floor(Math.random() * arr.length)];
}

client.once('ready', () => {
  console.log("Bot online");
});

client.on('interactionCreate', async (i) => {

  if (i.isChatInputCommand()) {

    if (i.commandName === 'giveaway') {
      const duration = i.options.getString('duration');
      const prize = i.options.getString('prize');

      const embed = new EmbedBuilder()
        .setTitle('Giveaway')
        .setDescription(prize);

      const btn = new ButtonBuilder()
        .setCustomId('join')
        .setLabel('Join')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(btn);

      const msg = await i.reply({ embeds: [embed], components: [row], fetchReply: true });

      giveaways.set(msg.id, { prize, participants: new Set() });

      setTimeout(() => {
        const g = giveaways.get(msg.id);
        const winner = pick(g.participants);
        if (winner) i.followUp(`Winner: <@${winner}>`);
      }, parseDuration(duration));
    }

    if (i.commandName === 'reroll') {
      const id = i.options.getString('message_id');
      const g = giveaways.get(id);
      if (!g) return i.reply("Not found");
      const winner = pick(g.participants);
      i.reply(`<@${winner}> reroll win`);
    }

    if (i.commandName === 'participants') {
      const id = i.options.getString('message_id');
      const g = giveaways.get(id);
      i.reply([...g.participants].join(', ') || "none");
    }
  }

  if (i.isButton()) {
    if (i.customId === 'join') {
      const g = giveaways.get(i.message.id);
      if (!g.participants.has(i.user.id)) {
        g.participants.add(i.user.id);
        i.reply({ content: "Joined!", ephemeral: true });
      } else {
        i.reply({ content: "Already joined", ephemeral: true });
      }
    }
  }
});

client.login(process.env.TOKEN);
