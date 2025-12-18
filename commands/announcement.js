// commands/announcement.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

// Database setup
let db;
(async () => {
  try {
    db = await open({
      filename: "./database/announcements.db",
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS announcement_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        set_by TEXT NOT NULL,
        set_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("📢 Announcement Database Initialized");
  } catch (err) {
    console.error("Announcement Database Error:", err);
  }
})();

// Memory cache for faster access
const channelCache = new Map();

// Command data - FIXED: Required options before optional ones
const data = new SlashCommandBuilder()
  .setName("announcement")
  .setDescription("📢 Manage and send server announcements")
  .setDMPermission(false)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("channel")
      .setDescription("Set the announcement channel")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Channel for announcements")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("declare")
      .setDescription("Send an announcement")
      // REQUIRED options first
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("Type of announcement")
          .setRequired(true)
          .addChoices(
            { name: "📝 Normal Message", value: "normal" },
            { name: "📋 Embed Message", value: "embed" }
          )
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("Announcement message")
          .setRequired(true)
          .setMaxLength(4000)
      )
      .addStringOption((option) =>
        option
          .setName("mention")
          .setDescription("Role to mention")
          .setRequired(true)
          .addChoices(
            { name: "No Mention", value: "none" },
            { name: "@everyone", value: "everyone" },
            { name: "@here", value: "here" }
          )
      )
      // OPTIONAL options after required ones
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Title (for embed only)")
          .setRequired(false)
          .setMaxLength(256)
      )
      .addStringOption((option) =>
        option
          .setName("style")
          .setDescription("Embed style (for embed only)")
          .setRequired(false)
          .addChoices(
            { name: "🔵 Primary (Blue)", value: "primary" },
            { name: "🟢 Success (Green)", value: "success" },
            { name: "🟡 Warning (Yellow)", value: "warning" },
            { name: "🔴 Danger (Red)", value: "danger" }
          )
      )
      .addStringOption((option) =>
        option
          .setName("image")
          .setDescription("Image URL (optional)")
          .setRequired(false)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Specific role to mention (overrides mention option)")
          .setRequired(false)
      )
  );

// Helper functions
function getEmbedColor(style) {
  const colors = {
    primary: "#5865F2", // Discord blue
    success: "#57F287", // Green
    warning: "#FEE75C", // Yellow
    danger: "#ED4245",  // Red
  };
  return colors[style] || colors.primary;
}

function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor("#57F287");
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor("#ED4245");
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Check if user has admin permissions
function hasAdminPermission(member) {
  return member.permissions.has([
    PermissionsBitField.Flags.ManageRoles,
    PermissionsBitField.Flags.Administrator,
  ]);
}

// Get channel data with cache
async function getChannelData(guildId) {
  // Check memory cache first
  if (channelCache.has(guildId)) {
    return channelCache.get(guildId);
  }
  
  // If not in cache, check database
  const dbData = await db.get(
    "SELECT channel_id, set_by FROM announcement_channels WHERE guild_id = ?",
    [guildId]
  );
  
  if (dbData) {
    // Cache the data for future use
    const cachedData = {
      channelId: dbData.channel_id,
      setBy: dbData.set_by
    };
    channelCache.set(guildId, cachedData);
    return cachedData;
  }
  
  return null;
}

// Clear invalid channel data
async function clearInvalidChannel(guildId) {
  channelCache.delete(guildId);
  await db.run("DELETE FROM announcement_channels WHERE guild_id = ?", [guildId]);
}

// Main execute function
async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const { guild, user, member } = interaction;

  // Check if user has admin permissions (Manage Roles or Administrator)
  if (!hasAdminPermission(member)) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        "Permission Denied", 
        "You need **Manage Roles** or **Administrator** permission to use this command."
      )],
      ephemeral: true,
    });
  }

  try {
    switch (subcommand) {
      case "channel":
        await handleChannelSubcommand(interaction);
        break;
      case "declare":
        await handleDeclareSubcommand(interaction);
        break;
    }
  } catch (error) {
    console.error("Announcement Command Error:", error);
    await interaction.reply({
      embeds: [createErrorEmbed("Unexpected Error", "An error occurred while processing your request.")],
      ephemeral: true,
    });
  }
}

// Handle channel subcommand
async function handleChannelSubcommand(interaction) {
  const channel = interaction.options.getChannel("channel");
  const { guild, user } = interaction;

  if (!channel.isTextBased()) {
    return interaction.reply({
      embeds: [createErrorEmbed("Invalid Channel", "Please select a text-based channel.")],
      ephemeral: true,
    });
  }

  // Check bot permissions in the channel
  const botMember = guild.members.cache.get(interaction.client.user.id);
  if (!channel.permissionsFor(botMember).has("SendMessages")) {
    return interaction.reply({
      embeds: [createErrorEmbed("Permission Issue", "I don't have permission to send messages in that channel.")],
      ephemeral: true,
    });
  }

  try {
    // Save to database
    await db.run(
      `INSERT OR REPLACE INTO announcement_channels (guild_id, channel_id, set_by) VALUES (?, ?, ?)`,
      [guild.id, channel.id, user.id]
    );

    // Also cache in memory for faster access
    channelCache.set(guild.id, {
      channelId: channel.id,
      setBy: user.id
    });

    await interaction.reply({
      embeds: [createSuccessEmbed("Channel Set", `Announcement channel has been set to ${channel}.`)],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Database Error:", error);
    throw error;
  }
}

// Handle declare subcommand
async function handleDeclareSubcommand(interaction) {
  const { guild, user } = interaction;
  
  // Get channel data using cache
  const channelData = await getChannelData(guild.id);

  if (!channelData) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        "No Announcement Channel",
        "Please set an announcement channel first using `/announcement channel`."
      )],
      ephemeral: true,
    });
  }

  const channel = guild.channels.cache.get(channelData.channelId);
  if (!channel) {
    // Clean up invalid data
    await clearInvalidChannel(guild.id);
    
    return interaction.reply({
      embeds: [createErrorEmbed(
        "Channel Not Found",
        "The announcement channel no longer exists. Please set a new one."
      )],
      ephemeral: true,
    });
  }

  // Check bot permissions in the channel
  const botMember = guild.members.cache.get(interaction.client.user.id);
  if (!channel.permissionsFor(botMember).has("SendMessages")) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        "Permission Issue",
        "I don't have permission to send messages in the announcement channel."
      )],
      ephemeral: true,
    });
  }

  // Get options - ORDER MATTERS!
  const type = interaction.options.getString("type");
  const message = interaction.options.getString("message");
  const mentionOption = interaction.options.getString("mention");
  const title = interaction.options.getString("title");
  const style = interaction.options.getString("style") || "primary";
  const imageUrl = interaction.options.getString("image");
  const specificRole = interaction.options.getRole("role");

  // Validate embed-specific options
  if (type === "embed" && !title) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        "Title Required",
        "Title is required for embed announcements."
      )],
      ephemeral: true,
    });
  }

  // Validate image URL if provided
  if (imageUrl && !isValidUrl(imageUrl)) {
    return interaction.reply({
      embeds: [createErrorEmbed(
        "Invalid Image URL",
        "Please provide a valid image URL starting with http:// or https://"
      )],
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    let mentionContent = "";
    
    // Handle mentions based on options
    if (specificRole) {
      // Use specific role if provided
      mentionContent = `${specificRole}`;
    } else {
      // Use the mention option
      switch (mentionOption) {
        case "everyone":
          mentionContent = "@everyone";
          break;
        case "here":
          mentionContent = "@here";
          break;
        case "none":
          // No mention
          break;
      }
    }

    if (type === "normal") {
      // Send normal message
      let announcementText = "";
      if (mentionContent) announcementText += `${mentionContent}\n\n`;
      announcementText += message;
      
      await channel.send(announcementText);
      
      await interaction.editReply({
        embeds: [createSuccessEmbed(
          "Announcement Sent",
          `Your announcement has been sent to ${channel}.`
        )],
      });
    } else if (type === "embed") {
      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(getEmbedColor(style));

      // Add image if provided
      if (imageUrl && isValidUrl(imageUrl)) {
        embed.setImage(imageUrl);
      }

      // Send embed with optional mention
      if (mentionContent) {
        await channel.send({ content: mentionContent, embeds: [embed] });
      } else {
        await channel.send({ embeds: [embed] });
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(
          "Embed Announcement Sent",
          `Your embed announcement has been sent to ${channel}.`
        )],
      });
    }
  } catch (error) {
    console.error("Error sending announcement:", error);
    await interaction.editReply({
      embeds: [createErrorEmbed(
        "Failed to Send",
        "Could not send the announcement. Please check my permissions in that channel."
      )],
    });
  }
}

// Export
module.exports = {
  data,
  execute,
};