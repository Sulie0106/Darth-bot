require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Example: 10s, 5m, 1h')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('What is being given away')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('winners')
        .setDescription('Number of winners (default is 1)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll giveaway winner(s)')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID of the giveaway message')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('End a giveaway early')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID of the giveaway message')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('participants')
    .setDescription('View giveaway participants')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID of the giveaway message')
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
