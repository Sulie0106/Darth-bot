require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway')
    .addStringOption(o =>
      o.setName('duration')
        .setDescription('10s, 5m, 1h')
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('prize')
        .setDescription('Prize')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName('winners')
        .setDescription('Number of winners')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll winner(s)')
    .addStringOption(o =>
      o.setName('message_id')
        .setDescription('Giveaway message ID')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('End giveaway early')
    .addStringOption(o =>
      o.setName('message_id')
        .setDescription('Giveaway message ID')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('participants')
    .setDescription('View participants')
    .addStringOption(o =>
      o.setName('message_id')
        .setDescription('Giveaway message ID')
        .setRequired(true)
    )

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registering commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Commands registered!');
  } catch (err) {
    console.error(err);
  }
})();
