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

const giveaways = new Map();

function parseDuration(str) {
  const match = str.match(/(\d+)(s|m|h|d)/);
  if (!match) return 60000;

  const value = parseInt(match[1]);
  const type = match[2];

  if (type === 's') return value * 1000;
  if (type === 'm') return value * 60000;
  if (type === 'h') return value * 3600000;
  if (type === 'd') return value * 86400000;
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

client.on('interactionCreate', async (interaction) => {

  /* -------- SLASH COMMANDS -------- */
  if (interaction.isChatInputCommand()) {

    /* GIVEAWAY */
    if (interaction.commandName === 'giveaway') {
      const duration = interaction.options.getString('duration');
      const prize = interaction.options.getString('prize');
      const winnersCount = interaction.options.getInteger('winners') || 1;

      const durationMs = parseDuration(duration);
      const endTime = Math.floor((Date.now() + durationMs) / 1000);

      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY')
        .setDescription(
          `Prize: **${prize}**\n` +
          `🏆 Winners: **${winnersCount}**\n` +
          `👥 Participants: **0**\n` +
          `⏰ Ends: <t:${endTime}:R>\n\n` +
          `Click the button to join!`
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
        active: true,
        endTime
      });

      setTimeout(async () => {
        const data = giveaways.get(msg.id);
        if (!data || !data.active) return;

        data.active = false;

        const winners = pickWinners(data.participants, data.winnersCount);

        const disabledRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(row.components[0]).setDisabled(true)
        );

        const endedEmbed = EmbedBuilder.from(embed)
          .setDescription(
            `Prize: **${data.prize}**\n` +
            `🏆 Winners: **${data.winnersCount}**\n` +
            `👥 Participants: **${data.participants.size}**\n` +
            `⏰ Ended\n\n` +
            `Giveaway finished.`
          );

        await msg.edit({
          embeds: [endedEmbed],
          components: [disabledRow]
        });

        if (winners.length === 0) {
          return interaction.followUp('❌ No participants joined.');
        }

        const text = winners.map(w => `<@${w}>`).join(', ');

        interaction.followUp(`🏆 Winner(s): ${text} won **${data.prize}** 🎉`);

      }, durationMs);
    }

    /* END */
    if (interaction.commandName === 'end') {
      await interaction.deferReply();

      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) {
        return interaction.editReply('❌ Giveaway not found.');
      }

      data.active = false;

      const winners = pickWinners(data.participants, data.winnersCount);

      if (winners.length === 0) {
        return interaction.editReply('❌ No participants.');
      }

      const text = winners.map(w => `<@${w}>`).join(', ');

      return interaction.editReply(`🏁 Giveaway ended! Winner(s): ${text} 🎉`);
    }

    /* REROLL */
    if (interaction.commandName === 'reroll') {
      const id = interaction.options.getString('message_id');
      const data = giveaways.get(id);

      if (!data) return interaction.reply('❌ Giveaway not found.');

      const winners = pickWinners(data.participants, data.winnersCount);

      if (winners.length === 0) {
        return interaction.reply('❌ No participants.');
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
        `👥 Participants: **${data.participants.size}**\n\n${list || "None"}`
      );
    }
  }

  /* -------- BUTTON -------- */
  if (interaction.isButton()) {

    if (interaction.customId === 'join_giveaway') {

      const giveaway = giveaways.get(interaction.message.id);

      if (!giveaway || !giveaway.active) {
        return interaction.reply({
          content: '❌ This giveaway is not active.',
          ephemeral: true
        });
      }

      if (interaction.user.bot) {
        return interaction.reply({
          content: '❌ Bots cannot join.',
          ephemeral: true
        });
      }

      if (giveaway.participants.has(interaction.user.id)) {
        return interaction.reply({
          content: '⚠️ You already joined.',
          ephemeral: true
        });
      }

      giveaway.participants.add(interaction.user.id);

      const updated = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription(
          `Prize: **${giveaway.prize}**\n` +
          `🏆 Winners: **${giveaway.winnersCount}**\n` +
          `👥 Participants: **${giveaway.participants.size}**\n` +
          `⏰ Ends: <t:${giveaway.endTime}:R>\n\n` +
          `Click the button to join!`
        );

      await interaction.message.edit({ embeds: [updated] });

      return interaction.reply({
        content: '✅ Joined giveaway!',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
