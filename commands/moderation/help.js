const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🔨 Moderation Guide & Commands')
            .setDescription('Welcome to the moderation system! Here\'s everything you need to know.')
            .addFields(
                {
                    name: '📋 Moderator Responsibilities',
                    value: '• Enforce server rules consistently\n• Be fair and impartial\n• Document all actions\n• Maintain professionalism\n• Protect server members\n• Use appropriate force (warn → mute → kick → ban)'
                },
                {
                    name: '⚖️ Moderation Escalation',
                    value: '```\n1. Warning → Verbal/chat warning\n2. Mute → Temporary timeout\n3. Kick → Remove from server (can rejoin)\n4. Ban → Permanent removal\n```'
                },
                {
                    name: '🔧 Available Commands',
                    value: '```\n/mod ban <user> [reason] [delete_days]\n/mod kick <user> [reason]\n/mod warn <user> <reason>\n/mod mute <user> <duration> [reason]\n/mod purge <amount> [user]\n/mod setlog <channel>\n/mod help\n```'
                },
                {
                    name: '📝 Command Guidelines',
                    value: '• **Always provide a reason** for actions\n• **Use the least severe action** necessary\n• **Check user history** before taking action\n• **Document everything** in mod log\n• **Never abuse your powers**\n• **Keep actions private** (use ephemeral when needed)'
                },
                {
                    name: '🛡️ Required Permissions',
                    value: '• Ban Members\n• Kick Members\n• Moderate Members\n• Manage Messages\n• View Audit Log\n• Send Messages\n• Embed Links'
                },
                {
                    name: '📊 Setting Up Mod Logs',
                    value: 'Use `/mod setlog #channel` to set up a channel where all moderation actions will be logged automatically.'
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Moderation System • Use powers responsibly' });
        
        // Create buttons for quick reference
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('mod_quick_guide')
                    .setLabel('Quick Guide')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('Discord Moderation')
                    .setURL('https://support.discord.com/hc/en-us/articles/4421269296535-Moderation-Settings-Overview')
                    .setStyle(ButtonStyle.Link)
            );
        
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
};