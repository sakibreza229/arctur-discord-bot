const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.editReply({
        content: "❌ You need the **Manage Messages** permission to use this command.",
      });
    }

    const channel = interaction.options.getChannel("channel");
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const footer = interaction.options.getString("footer");
    const thumbnail = interaction.options.getString("thumbnail");
    const image = interaction.options.getString("image");
    const color = interaction.options.getString("color");

    if (!description && !title) {
      return interaction.editReply({
        content: "❌ You must provide at least a title or description.",
      });
    }

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

    if (thumbnail && !isValidUrl(thumbnail)) {
      return interaction.editReply({
        content: "❌ Invalid thumbnail URL provided.",
      });
    }

    if (image && !isValidUrl(image)) {
      return interaction.editReply({
        content: "❌ Invalid image URL provided.",
      });
    }

    if (color && !isValidHexColor(color)) {
      return interaction.editReply({
        content: "❌ Invalid color format. Use hex format (e.g., #5865F2).",
      });
    }

    const embedColor = color || getRandomColor();
    const embed = new EmbedBuilder();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: footer });
    if (thumbnail && isValidUrl(thumbnail)) embed.setThumbnail(thumbnail);
    if (image && isValidUrl(image)) embed.setImage(image);
    
    embed.setColor(embedColor);
    // Removed .setTimestamp() - No time shown

    try {
      await channel.send({ embeds: [embed] });
      await interaction.editReply({
        content: `✅ Embed sent to ${channel}!`,
        embeds: [embed],
      });
    } catch (error) {
      console.error("Error sending embed:", error);
      await interaction.editReply({
        content: "❌ Failed to send embed. Please check my permissions.",
      });
    }
  },
};

function getRandomColor() {
  const colors = [
    "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", 
    "#F37F31", "#9B59B6", "#3498DB", "#1ABC9C", "#E91E63"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidHexColor(color) {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}