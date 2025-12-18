const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("📝 Create and send embed messages")
  .setDMPermission(false)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("form")
      .setDescription("Create embed using an interactive form")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create embed using command options")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel to send the embed")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Embed title (supports markdown)")
          .setRequired(false)
          .setMaxLength(256)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Embed description (supports markdown)")
          .setRequired(false)
          .setMaxLength(4000)
      )
      .addStringOption((option) =>
        option
          .setName("footer")
          .setDescription("Embed footer text")
          .setRequired(false)
          .setMaxLength(2048)
      )
      .addStringOption((option) =>
        option
          .setName("thumbnail")
          .setDescription("Thumbnail image URL")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("image")
          .setDescription("Main image URL")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("color")
          .setDescription("Embed color in hex (e.g., #5865F2)")
          .setRequired(false)
          .setMaxLength(7)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("simple")
      .setDescription("Send a simple embed")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel to send the embed")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Message content (supports markdown)")
          .setRequired(true)
          .setMaxLength(4000)
      )
  );

module.exports = {
  data,
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
      const command = require(`./embed/embed_${subcommand}.js`);
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error loading embed subcommand ${subcommand}:`, error);
      await interaction.reply({
        content: "❌ An error occurred while executing this command.",
        ephemeral: true,
      });
    }
  },
};