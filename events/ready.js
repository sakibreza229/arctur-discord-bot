const logger = require('../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.success(`✅ Bot logged in as ${client.user.tag}`);
        logger.info(`📊 Bot is in ${client.guilds.cache.size} guilds`);
        
        // Method 1: Direct status set
        client.user.setStatus('dnd');
        client.user.setActivity('Type /help', { type: 'WATCHING' });
        
        // OR Method 2: Using setPresence (old way)
        // client.user.setPresence({
        //     status: 'dnd',
        //     activities: [{
        //         name: '/help for commands',
        //         type: 'WATCHING'
        //     }]
        // });
        
        logger.info(`📝 Loaded ${client.commands.size} slash commands`);
    }
};