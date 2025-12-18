require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, ActivityType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        logger.info(`Loaded command: ${command.data.name}`);
    } else {
        logger.warn(`The command at ${filePath} is missing required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        logger.info('Started refreshing application (/) commands globally.');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        
        logger.success(`Successfully reloaded ${commands.length} application (/) commands globally.`);
    } catch (error) {
        logger.error('Error registering commands:', error);
    }
})();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
        logger.info(`${interaction.user.tag} used command: ${interaction.commandName}`);
    } catch (error) {
        logger.error(`Error executing ${interaction.commandName}:`, error);
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            });
        }
    }
});

client.once(Events.ClientReady, () => {
    logger.success(`Bot logged in as ${client.user.tag}`);
    logger.info(`Bot is in ${client.guilds.cache.size} guilds`);
    logger.info(`Loaded ${client.commands.size} slash commands`);
    
    client.user.setStatus('dnd');
    
    client.user.setActivity({
        name: '/help for commands',
        type: ActivityType.Watching,
    });
    
    logger.info('Bot status set to: Do Not Disturb');
});

client.on('error', error => {
    logger.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    logger.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);
