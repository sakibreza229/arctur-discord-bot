// commands/server/about.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

let db;
(async () => {
  try {
    db = await open({
      filename: "./database/server_about.db",
      driver: sqlite3.Database,
    });

    const tableInfo = await db.all(`PRAGMA table_info(server_about)`);
    if (tableInfo.length === 0) {
      await db.exec(`
        CREATE TABLE server_about (
          guild_id TEXT PRIMARY KEY,
          about_text TEXT NOT NULL,
          thumbnail_url TEXT,
          image_url TEXT,
          author_id TEXT NOT NULL,
          embed_color TEXT
        )
      `);
    } else {
      const columns = tableInfo.map((col) => col.name);
      if (!columns.includes("thumbnail_url")) {
        await db.exec(`ALTER TABLE server_about ADD COLUMN thumbnail_url TEXT`);
      }
      if (!columns.includes("image_url")) {
        await db.exec(`ALTER TABLE server_about ADD COLUMN image_url TEXT`);
      }
      if (!columns.includes("embed_color")) {
        await db.exec(`ALTER TABLE server_about ADD COLUMN embed_color TEXT`);
      }
    }

    await db.exec(`CREATE INDEX IF NOT EXISTS idx_guild_id ON server_about(guild_id)`);
    console.log("📊 Server About Database Initialized");
  } catch (err) {
    console.error("Database Initialization Error:", err);
    throw err;
  }
})();

function isValidUrl(string) {
  if (!string || string.trim() === "") return false;
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function isValidHexColor(color) {
  if (!color || color.trim() === "") return false;
  const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
  return hexRegex.test(color);
}

function createSuccessEmbed(title, description, options = {}) {
  const embed = new EmbedBuilder()
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setColor("#43B581")
    .setTimestamp();
  if (options.fields) embed.addFields(...options.fields);
  return embed;
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setColor("#FF4444")
    .setTimestamp();
}

const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("📋 Manage and view server information")
  .setDMPermission(false)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set")
      .setDescription("Set the server description")
      .addStringOption((opt) =>
        opt
          .setName("description")
          .setDescription("Description (max 1500 chars)")
          .setRequired(true)
          .setMaxLength(1500)
      )
      .addStringOption((opt) =>
        opt
          .setName("thumbnail")
          .setDescription("Thumbnail URL (must be direct image link)")
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption((opt) =>
        opt
          .setName("image")
          .setDescription("Main Image URL (must be direct image link)")
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption((opt) =>
        opt
          .setName("color")
          .setDescription("Embed color in hex format (e.g., #5865F2)")
          .setRequired(false)
          .setMaxLength(7)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("server").setDescription("View server description")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("edit")
      .setDescription("Edit server description")
      .addStringOption((opt) =>
        opt
          .setName("description")
          .setDescription("New description")
          .setRequired(true)
          .setMaxLength(1500)
      )
      .addStringOption((opt) =>
        opt
          .setName("thumbnail")
          .setDescription('New thumbnail URL (type "clear" to remove, leave empty to keep)')
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption((opt) =>
        opt
          .setName("image")
          .setDescription('New image URL (type "clear" to remove, leave empty to keep)')
          .setRequired(false)
          .setMaxLength(500)
      )
      .addStringOption((opt) =>
        opt
          .setName("color")
          .setDescription('New embed color in hex format (type "clear" for default, leave empty to keep)')
          .setRequired(false)
          .setMaxLength(7)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("clear").setDescription("Delete server description and all media")
  );

async function execute(interaction) {
  if (!db) {
    return interaction.reply({
      embeds: [createErrorEmbed("Database Error", "Database not ready. Please try again later.")],
      ephemeral: true,
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const { guild, user } = interaction;

  const checkOwner = () => {
    if (guild.ownerId !== user.id) {
      interaction.reply({
        embeds: [createErrorEmbed("Permission Denied", "Only the server owner can use this command.")],
        ephemeral: true,
      });
      return false;
    }
    return true;
  };

  try {
    switch (subcommand) {
      case "server": {
        const result = await db.get("SELECT * FROM server_about WHERE guild_id = ?", [guild.id]);
        if (!result) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`📋 About ${guild.name}`)
                .setDescription("*No description has been set for this server yet.*\n\nUse `/about set` to add a description.")
                .setColor("#7289DA")
                .setFooter({ text: "Server Information" }),
            ],
          });
        }

        const embedColor = result.embed_color || "#5865F2";
        const embed = new EmbedBuilder()
          .setTitle(`📋 About ${guild.name}`)
          .setDescription(result.about_text)
          .setColor(embedColor)
          .setFooter({ text: "Server Description" });

        if (result.thumbnail_url) embed.setThumbnail(result.thumbnail_url);
        if (result.image_url) embed.setImage(result.image_url);

        return interaction.reply({ embeds: [embed] });
      }

      case "set": {
        if (!checkOwner()) return;
        const desc = interaction.options.getString("description");
        const thumb = interaction.options.getString("thumbnail");
        const img = interaction.options.getString("image");
        const color = interaction.options.getString("color");

        if (thumb && !isValidUrl(thumb)) {
          return interaction.reply({
            embeds: [createErrorEmbed("Invalid URL", "Please provide a valid thumbnail URL (must start with http:// or https://).")],
            ephemeral: true,
          });
        }
        if (img && !isValidUrl(img)) {
          return interaction.reply({
            embeds: [createErrorEmbed("Invalid URL", "Please provide a valid image URL (must start with http:// or https://).")],
            ephemeral: true,
          });
        }
        if (color && !isValidHexColor(color)) {
          return interaction.reply({
            embeds: [createErrorEmbed("Invalid Color", "Please provide a valid hex color (e.g., #5865F2).")],
            ephemeral: true,
          });
        }

        const existing = await db.get("SELECT 1 FROM server_about WHERE guild_id = ?", [guild.id]);
        if (existing) {
          return interaction.reply({
            embeds: [createErrorEmbed("Already Exists", "A description already exists. Use `/about edit` to modify it.")],
            ephemeral: true,
          });
        }

        await db.run(
          "INSERT INTO server_about (guild_id, about_text, thumbnail_url, image_url, author_id, embed_color) VALUES (?, ?, ?, ?, ?, ?)",
          [guild.id, desc, thumb || null, img || null, user.id, color || null]
        );

        const fields = [{ name: "Description", value: desc.length > 100 ? `${desc.substring(0, 100)}...` : desc }];
        if (thumb) fields.push({ name: "Thumbnail", value: "✅ Added", inline: true });
        if (img) fields.push({ name: "Image", value: "✅ Added", inline: true });
        if (color) fields.push({ name: "Color", value: color, inline: true });

        return interaction.reply({
          embeds: [createSuccessEmbed("Description Set", "Server description has been saved successfully.", { fields })],
          ephemeral: true,
        });
      }

      case "edit": {
        if (!checkOwner()) return;
        const newDesc = interaction.options.getString("description");
        const newThumb = interaction.options.getString("thumbnail");
        const newImg = interaction.options.getString("image");
        const newColor = interaction.options.getString("color");

        const existing = await db.get("SELECT * FROM server_about WHERE guild_id = ?", [guild.id]);
        if (!existing) {
          return interaction.reply({
            embeds: [createErrorEmbed("Nothing to Edit", "No description found. Use `/about set` first.")],
            ephemeral: true,
          });
        }

        let finalThumb = existing.thumbnail_url;
        if (newThumb === "clear") {
          finalThumb = null;
        } else if (newThumb && newThumb.trim() !== "") {
          if (!isValidUrl(newThumb)) {
            return interaction.reply({
              embeds: [createErrorEmbed("Invalid URL", "Please provide a valid thumbnail URL.")],
              ephemeral: true,
            });
          }
          finalThumb = newThumb;
        }

        let finalImg = existing.image_url;
        if (newImg === "clear") {
          finalImg = null;
        } else if (newImg && newImg.trim() !== "") {
          if (!isValidUrl(newImg)) {
            return interaction.reply({
              embeds: [createErrorEmbed("Invalid URL", "Please provide a valid image URL.")],
              ephemeral: true,
            });
          }
          finalImg = newImg;
        }

        let finalColor = existing.embed_color;
        if (newColor === "clear") {
          finalColor = null;
        } else if (newColor && newColor.trim() !== "") {
          if (!isValidHexColor(newColor)) {
            return interaction.reply({
              embeds: [createErrorEmbed("Invalid Color", "Please provide a valid hex color (e.g., #5865F2).")],
              ephemeral: true,
            });
          }
          finalColor = newColor;
        }

        await db.run(
          "UPDATE server_about SET about_text = ?, thumbnail_url = ?, image_url = ?, embed_color = ? WHERE guild_id = ?",
          [newDesc, finalThumb, finalImg, finalColor, guild.id]
        );

        const fields = [{ name: "Description", value: newDesc.length > 100 ? `${newDesc.substring(0, 100)}...` : newDesc }];
        if (newThumb === "clear") fields.push({ name: "Thumbnail", value: "🗑️ Removed", inline: true });
        else if (newThumb && newThumb.trim() !== "") fields.push({ name: "Thumbnail", value: "✅ Updated", inline: true });

        if (newImg === "clear") fields.push({ name: "Image", value: "🗑️ Removed", inline: true });
        else if (newImg && newImg.trim() !== "") fields.push({ name: "Image", value: "✅ Updated", inline: true });

        if (newColor === "clear") fields.push({ name: "Color", value: "🎨 Reset to default", inline: true });
        else if (newColor && newColor.trim() !== "") fields.push({ name: "Color", value: `${newColor}`, inline: true });

        return interaction.reply({
          embeds: [createSuccessEmbed("Description Updated", "Server description has been updated.", { fields })],
          ephemeral: true,
        });
      }

      case "clear": {
        if (!checkOwner()) return;
        const existing = await db.get("SELECT 1 FROM server_about WHERE guild_id = ?", [guild.id]);
        if (!existing) {
          return interaction.reply({
            embeds: [createErrorEmbed("Nothing to Clear", "No description exists to clear.")],
            ephemeral: true,
          });
        }

        await db.run("DELETE FROM server_about WHERE guild_id = ?", [guild.id]);
        return interaction.reply({
          embeds: [createSuccessEmbed("All Cleared", "Server description, thumbnail, image, and color have been completely removed.")],
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("About Command Error:", error);
    return interaction.reply({
      embeds: [createErrorEmbed("Unexpected Error", "An error occurred while processing your request.")],
      ephemeral: true,
    });
  }
}

module.exports = { data, execute };