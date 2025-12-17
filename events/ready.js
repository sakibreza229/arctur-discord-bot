const logger = require('../utils/logger');
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        // Bot is ready
        logger.success(`✅ ${client.user.tag} is online!`);
        logger.info(`📊 Bot is in ${client.guilds.cache.size} guilds`);
        logger.info(`📝 Loaded ${client.commands?.size || 0} slash commands`);
        
        // Set status (FIXED VERSION)
        client.user.setStatus('dnd');
        client.user.setActivity({
            name: '/help for commands',
            type: ActivityType.Watching  // Using the constant
        });
        
        // Optional: Add invite link for convenience
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
        logger.info(`🔗 Invite: ${inviteLink}`);
    }
};