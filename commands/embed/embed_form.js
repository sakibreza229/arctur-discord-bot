const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelSelectMenuBuilder } = require("discord.js");

module.exports = {
  async execute(interaction) {
    if (!interaction.member.permissions.has("ManageMessages")) {
      return interaction.reply({
        content: "❌ You need the **Manage Messages** permission to use this command.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("embedForm")
      .setTitle("Create Embed");

    const titleInput = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("Title (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(256);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("Description (markdown supported)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const footerInput = new TextInputBuilder()
      .setCustomId("footer")
      .setLabel("Footer (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(2048);

    const imageInput = new TextInputBuilder()
      .setCustomId("image")
      .setLabel("Image URL (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const colorInput = new TextInputBuilder()
      .setCustomId("color")
      .setLabel("Color (hex e.g., #5865F2) optional")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("#5865F2 or leave empty for random")
      .setRequired(false)
      .setMaxLength(7);

    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(footerInput);
    const fourthActionRow = new ActionRowBuilder().addComponents(imageInput);
    const fifthActionRow = new ActionRowBuilder().addComponents(colorInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

    await interaction.showModal(modal);

    try {
      const modalResponse = await interaction.awaitModalSubmit({
        time: 300000,
        filter: i => i.user.id === interaction.user.id,
      });

      await handleModalResponse(modalResponse, interaction);
    } catch (error) {
      if (error.code === "InteractionCollectorError") {
        console.log("Modal timeout");
      }
    }
  },
};

async function handleModalResponse(modalInteraction, originalInteraction) {
  await modalInteraction.deferReply({ ephemeral: true });

  const title = modalInteraction.fields.getTextInputValue("title");
  const description = modalInteraction.fields.getTextInputValue("description");
  const footer = modalInteraction.fields.getTextInputValue("footer");
  const image = modalInteraction.fields.getTextInputValue("image");
  const colorInputValue = modalInteraction.fields.getTextInputValue("color");

  if (!description) {
    return modalInteraction.editReply({
      content: "❌ Description is required!",
      ephemeral: true,
    });
  }

  // Validate color if provided
  let embedColor;
  if (colorInputValue && colorInputValue.trim() !== "") {
    if (isValidHexColor(colorInputValue)) {
      embedColor = colorInputValue;
    } else {
      return modalInteraction.editReply({
        content: "❌ Invalid color format. Use hex format (e.g., #5865F2).",
        ephemeral: true,
      });
    }
  } else {
    // Use random color if none provided
    const colors = [
      "#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", 
      "#F37F31", "#9B59B6", "#3498DB", "#1ABC9C", "#E91E63"
    ];
    embedColor = colors[Math.floor(Math.random() * colors.length)];
  }

  const embed = new EmbedBuilder()
    .setDescription(description)
    .setColor(embedColor);

  if (title) embed.setTitle(title);
  if (footer) embed.setFooter({ text: footer });
  if (image && isValidUrl(image)) embed.setImage(image);

  // Create channel select menu
  const channelSelectRow = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("embed_channel_select")
        .setPlaceholder("Select a channel to send embed...")
        .setChannelTypes([0, 5, 10, 11, 12]) // Text channels: GUILD_TEXT, GUILD_ANNOUNCEMENT, GUILD_MEDIA, ANNOUNCEMENT_THREAD, PUBLIC_THREAD
    );

  await modalInteraction.editReply({
    content: "✅ Embed created! Please select a channel to send it to:",
    embeds: [embed],
    components: [channelSelectRow],
    ephemeral: true,
  });

  const collector = modalInteraction.channel.createMessageComponentCollector({
    time: 60000,
    filter: i => i.user.id === modalInteraction.user.id,
  });

  collector.on("collect", async i => {
    if (i.customId === "embed_channel_select") {
      await i.deferUpdate();
      
      const channelId = i.values[0];
      const channel = originalInteraction.guild.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return modalInteraction.followUp({
          content: "❌ Invalid channel selected!",
          ephemeral: true,
        });
      }

      // Check bot permissions
      const botMember = originalInteraction.guild.members.cache.get(originalInteraction.client.user.id);
      if (!channel.permissionsFor(botMember).has("SendMessages")) {
        return modalInteraction.followUp({
          content: "❌ I don't have permission to send messages in that channel.",
          ephemeral: true,
        });
      }

      try {
        await channel.send({ embeds: [embed] });
        await modalInteraction.editReply({
          content: `✅ Embed sent to ${channel}!`,
          embeds: [],
          components: [],
        });
      } catch (error) {
        console.error("Error sending embed:", error);
        await modalInteraction.followUp({
          content: "❌ Failed to send embed. Check bot permissions!",
          ephemeral: true,
        });
      }
      collector.stop();
    }
  });

  collector.on("end", (collected, reason) => {
    if (reason === "time" && collected.size === 0) {
      modalInteraction.editReply({
        content: "⏰ Channel selection timed out.",
        embeds: [],
        components: [],
      });
    }
  });
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