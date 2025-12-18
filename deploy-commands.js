require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        logger.warn(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Deploy commands GLOBALLY
(async () => {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands GLOBALLY.`);

        // Deploy commands globally (to ALL servers the bot is in)
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        logger.success(`✅ Successfully reloaded ${data.length} application (/) commands GLOBALLY.`);
        logger.info('📢 Commands will be available in ALL servers the bot is in.');
        logger.info('⏰ Note: Global commands may take up to 1 hour to appear everywhere.');
        
    } catch (error) {
        logger.error('❌ Error deploying commands:', error);
    }
})();