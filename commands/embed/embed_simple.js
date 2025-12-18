const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");

    if (!channel.isTextBased()) {
      return interaction.editReply({
        content: "❌ Selected channel must be a text-based channel.",
      });
    }

    const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
    if (!channel.permissionsFor(botMember).has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.editReply({
        content: "❌ I don't have permission to send messages in that channel.",
      });
    }

    const colors = [
      "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", 
      "#F37F31", "#9B59B6", "#3498DB", "#1ABC9C", "#E91E63"
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const embed = new EmbedBuilder()
      .setDescription(message)
      .setColor(randomColor);
    // Removed .setTimestamp()

    try {
      await channel.send({ embeds: [embed] });
      await interaction.editReply({
        content: `✅ Simple embed sent to ${channel}!`,
      });
    } catch (error) {
      console.error("Error sending simple embed:", error);
      await interaction.editReply({
        content: "❌ Failed to send embed. Please check my permissions.",
      });
    }
  },
};