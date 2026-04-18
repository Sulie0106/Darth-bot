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
// messageId -> { prize, winnersCount, participants: Set, active }

function parseDuration(str) {
  const match = str.match(/(\d+)(s|m|h)/);
  if (!match) return 60000;

  const value = parseInt(match[1]);
  const type = match[2];

  if (type === 's') return value * 1000;
  if (type === 'm') return value * 60000;
  if (type === 'h') return value * 3600000;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWinners(set, count) {
  const arr = [...set];
  const winners = [];

  const copy = [...arr];

  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(Math.random() * copy.length);
    winners.push(copy[index]);
    copy.splice(index, 1);
  }

  return winners;
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
      const winnersCount = interaction.options.getInteger('winners') || 1;

      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY')
        .setDescription(
          `Prize: **${prize}**\n` +
          `🏆 Winners: **${winnersCount}**\n` +
          `👥 Participants: **0**\n\n` +
          `Click the button below to join!`
        )
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
        winnersCount,
        participants: new Set(),
        active: true
      });

      setTimeout(async () => {
        const data = giveaways.get(msg.id);
        if (!data) return;

        const participants = [...data.participants];

        if (participants.length === 0) {
          return interaction.followUp('❌ No participants joined the giveaway.');
        }

        const winners = pickWinners(data.participants, data.winnersCount);

        const winnerText = winners.map(w => `<@${w}>`).join(', ');

        interaction.followUp(
          `🏆 Winner(s): ${winnerText} won **${data.prize}** 🎉`
        );

        data.active = false;

      }, parseDuration(duration));
    }

    /* REROLL */
    if (interaction.commandName === 'reroll') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      const winners = pickWinners(data.participants, data.winnersCount);

      if (winners.length === 0) {
        return interaction.reply('❌ No participants found.');
      }

      const text = winners.map(w => `<@${w}>`).join(', ');

      return interaction.reply(`🔁 New winner(s): ${text} 🎉`);
    }

    /* PARTICIPANTS */
    if (interaction.commandName === 'participants') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      const list = [...data.participants]
        .map(u => `<@${u}>`)
        .join('\n');

      return interaction.reply(
        `👥 Participants: **${data.participants.size}**\n\n${list || "No participants yet."}`
      );
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

      // 🔥 LIVE UPDATE (participant count in embed)
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(
          `Prize: **${giveaway.prize}**\n` +
          `🏆 Winners: **${giveaway.winnersCount}**\n` +
          `👥 Participants: **${giveaway.participants.size}**\n\n` +
          `Click the button below to join!`
        );

      await interaction.message.edit({ embeds: [updatedEmbed] });

      return interaction.reply({
        content: '✅ You joined the giveaway!',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
