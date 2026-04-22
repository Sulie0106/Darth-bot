require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("promote")
    .setDescription("Promote a staff member")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true))
    .addRoleOption(o =>
      o.setName("role").setDescription("New role").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)),

  new SlashCommandBuilder()
    .setName("demote")
    .setDescription("Demote a staff member")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true))
    .addRoleOption(o =>
      o.setName("role").setDescription("Role to remove").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(false)),

].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("🚀 Deploying commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Commands deployed!");
  } catch (error) {
    console.error(error);
  }
})();
