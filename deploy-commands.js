require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start een giveaway')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Tijd zoals 10s, 5m, 1h')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('Wat wordt er weggegeven?')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll een winnaar van een giveaway')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID van het giveaway bericht')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('Stop een giveaway direct')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID van het giveaway bericht')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('participants')
    .setDescription('Bekijk deelnemers van een giveaway')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('ID van het giveaway bericht')
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔄 Slash commands registreren...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash commands succesvol geregistreerd!');
  } catch (error) {
    console.error(error);
  }
})();
