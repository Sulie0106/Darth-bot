require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 🧠 Giveaway storage
const giveaways = new Map();
// messageId -> { prize, participants: Set, active: true }

function parseDuration(str) {
  const match = str.match(/(\d+)(s|m|h)/);
  if (!match) return 60000;

  const value = parseInt(match[1]);
  const type = match[2];

  if (type === 's') return value * 1000;
  if (type === 'm') return value * 60000;
  if (type === 'h') return value * 3600000;
}

function pickWinner(set) {
  const arr = [...set];
  return arr[Math.floor(Math.random() * arr.length)];
}

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

/* ---------------- INTERACTIONS ---------------- */
client.on('interactionCreate', async (interaction) => {

  /* -------- SLASH COMMANDS -------- */
  if (interaction.isChatInputCommand()) {

    /* GIVEAWAY */
    if (interaction.commandName === 'giveaway') {
      const duration = interaction.options.getString('duration');
      const prize = interaction.options.getString('prize');

      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY')
        .setDescription(`Prize: **${prize}**\nClick the button below to join!`)
        .setColor('Gold');

      const button = new ButtonBuilder()
        .setCustomId('join_giveaway')
        .setLabel('🎟️ Join Giveaway')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      giveaways.set(msg.id, {
        prize,
        participants: new Set(),
        active: true
      });

      setTimeout(async () => {
        const data = giveaways.get(msg.id);
        if (!data || data.participants.size === 0) {
          return interaction.followUp('❌ No participants joined the giveaway.');
        }

        const winner = pickWinner(data.participants);

        interaction.followUp(`🏆 Winner: <@${winner}> won **${prize}**! 🎉`);

        data.active = false;

      }, parseDuration(duration));
    }

    /* END */
    if (interaction.commandName === 'end') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      data.active = false;

      const winner = pickWinner(data.participants);

      if (!winner) {
        return interaction.reply('❌ No participants to pick from.');
      }

      return interaction.reply(`🏁 Giveaway ended early. Winner: <@${winner}> 🎉`);
    }

    /* REROLL */
    if (interaction.commandName === 'reroll') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      const winner = pickWinner(data.participants);

      if (!winner) return interaction.reply('❌ No participants found.');

      return interaction.reply(`🔁 New winner: <@${winner}> 🎉`);
    }

    /* PARTICIPANTS */
    if (interaction.commandName === 'participants') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      const list = [...data.participants]
        .map(u => `<@${u}>`)
        .join('\n');

      return interaction.reply(`👥 Participants:\n${list || "No participants yet."}`);
    }
  }

  /* -------- BUTTON CLICK -------- */
  if (interaction.isButton()) {

    if (interaction.customId === 'join_giveaway') {

      if (interaction.user.bot) {
        return interaction.reply({
          content: '❌ Bots cannot join giveaways.',
          ephemeral: true
        });
      }

      const giveaway = giveaways.get(interaction.message.id);

      if (!giveaway) {
        return interaction.reply({
          content: '❌ This giveaway no longer exists.',
          ephemeral: true
        });
      }

      if (giveaway.participants.has(interaction.user.id)) {
        return interaction.reply({
          content: '⚠️ You already joined this giveaway.',
          ephemeral: true
        });
      }

      giveaway.participants.add(interaction.user.id);

      return interaction.reply({
        content: '✅ You joined the giveaway!',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
