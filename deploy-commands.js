require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start een giveaway')
    .addStringOption(o =>
      o.setName('duration').setRequired(true))
    .addStringOption(o =>
      o.setName('prize').setRequired(true)),

  new SlashCommandBuilder()
    .setName('reroll')
    .setDescription('Reroll winnaar')
    .addStringOption(o =>
      o.setName('message_id').setRequired(true)),

  new SlashCommandBuilder()
    .setName('end')
    .setDescription('Eindig giveaway')
    .addStringOption(o =>
      o.setName('message_id').setRequired(true)),

  new SlashCommandBuilder()
    .setName('participants')
    .setDescription('Bekijk deelnemers')
    .addStringOption(o =>
      o.setName('message_id').setRequired(true))

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash commands geregistreerd");
})();
