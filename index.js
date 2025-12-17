require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// ==================== ENVIRONMENT VALIDATION ====================
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`❌ Missing required environment variable: ${envVar}`);
        logger.info('Please check your .env file and ensure all variables are set');
        process.exit(1);
    }
}

// ==================== CLIENT CONFIGURATION ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ],
    rest: {
        retries: 3,
        timeout: 30000,
    },
    presence: {
        status: 'online',
        activities: [{
            name: 'Starting up...',
            type: ActivityType.Playing
        }]
    }
});

// ==================== COLLECTIONS ====================
client.commands = new Collection();
client.cooldowns = new Collection();
client.commandsData = []; // Store command data for deployment

// ==================== COMMAND LOADER ====================
const loadCommands = (directory = 'commands') => {
    const commandsPath = path.join(__dirname, directory);
    
    if (!fs.existsSync(commandsPath)) {
        logger.warn(`Commands directory not found: ${commandsPath}`);
        return;
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    if (commandFiles.length === 0) {
        logger.warn('No command files found in commands directory');
        return;
    }
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        try {
            const command = require(filePath);
            
            // Validate command structure
            if (!command.data || !command.execute) {
                logger.warn(`⚠ Skipping ${file}: Missing "data" or "execute" property`);
                continue;
            }
            
            // Set command in collection
            client.commands.set(command.data.name, command);
            client.commandsData.push(command.data.toJSON());
            
            logger.info(`✓ Loaded command: ${command.data.name}`);
            
            // Log cooldown if exists
            if (command.cooldown) {
                logger.debug(`  ↳ Cooldown: ${command.cooldown} seconds`);
            }
            
        } catch (error) {
            logger.error(`❌ Failed to load command ${file}:`, error);
        }
    }
};

// ==================== EVENT HANDLER ====================
const loadEvents = () => {
    const eventsPath = path.join(__dirname, 'events');
    
    if (!fs.existsSync(eventsPath)) {
        logger.warn('Events directory not found, using default event handlers');
        setupDefaultEvents();
        return;
    }
    
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        
        try {
            const event = require(filePath);
            
            if (!event.name || !event.execute) {
                logger.warn(`⚠ Skipping ${file}: Missing "name" or "execute" property`);
                continue;
            }
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
            
            logger.info(`✓ Loaded event: ${event.name}`);
            
        } catch (error) {
            logger.error(`❌ Failed to load event ${file}:`, error);
        }
    }
};

// ==================== DEFAULT EVENT HANDLERS ====================
const setupDefaultEvents = () => {
    // Ready Event
    client.once('ready', () => {
        logger.success(`✅ ${client.user.tag} is online!`);
        logger.info(`📊 Stats: ${client.guilds.cache.size} guilds | ${client.users.cache.size} users`);
        logger.info(`⚡ Commands loaded: ${client.commands.size}`);
        
        // Set bot presence
        client.user.setPresence({
            activities: [{
                name: `/help | ${client.guilds.cache.size} servers`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
        
        // Log invite link
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
        logger.info(`🔗 Invite: ${inviteLink}`);
    });
    
    // Interaction Create (Slash Commands)
    client.on('interactionCreate', async interaction => {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
            return;
        }
        
        // Handle button interactions
        if (interaction.isButton()) {
            logger.info(`Button clicked: ${interaction.customId} by ${interaction.user.tag}`);
            // Add button handler logic here
        }
        
        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            logger.info(`Select menu: ${interaction.customId} by ${interaction.user.tag}`);
            // Add select menu handler logic here
        }
    });
    
    // Error Handling
    client.on('error', error => {
        logger.error('Discord.js Client Error:', error);
    });
    
    client.on('warn', warning => {
        logger.warn('Discord.js Warning:', warning);
    });
    
    logger.info('✓ Default event handlers loaded');
};

// ==================== SLASH COMMAND HANDLER ====================
const handleSlashCommand = async (interaction) => {
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        logger.error(`Command not found: ${interaction.commandName}`);
        return interaction.reply({
            content: '❌ This command is not available.',
            ephemeral: true
        });
    }
    
    // Check permissions if command has permission requirements
    if (command.permissions && command.permissions.length > 0) {
        const member = interaction.member;
        const missingPerms = command.permissions.filter(perm => 
            !member.permissions.has(perm)
        );
        
        if (missingPerms.length > 0) {
            return interaction.reply({
                content: `❌ You need the following permissions: ${missingPerms.join(', ')}`,
                ephemeral: true
            });
        }
    }
    
    // Cooldown system
    const { cooldowns } = client;
    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const cooldownAmount = (command.cooldown || 3) * 1000; // Default 3 seconds
    
    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return interaction.reply({
                content: `⏳ Please wait ${timeLeft.toFixed(1)} seconds before using \`${command.data.name}\` again.`,
                ephemeral: true
            });
        }
    }
    
    // Set cooldown
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    
    // Execute command
    try {
        await command.execute(interaction);
        logger.info(`⚡ ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
        
    } catch (error) {
        logger.error(`❌ Error executing /${interaction.commandName}:`, error);
        
        const errorMessage = {
            content: '❌ An error occurred while executing this command!',
            ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
        
        // Log detailed error for debugging
        logger.error('Command Error Details:', {
            command: interaction.commandName,
            user: interaction.user.tag,
            guild: interaction.guild?.name,
            error: error.message
        });
    }
};

// ==================== COMMAND DEPLOYMENT ====================
const deployCommands = async () => {
    if (client.commandsData.length === 0) {
        logger.warn('No commands to deploy');
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        logger.info('🔄 Deploying slash commands...');
        
        // Choose deployment method based on environment
        if (process.env.GUILD_ID && process.env.NODE_ENV === 'development') {
            // Development: Deploy to specific guild (instant update)
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: client.commandsData }
            );
            logger.success(`✅ Deployed ${client.commandsData.length} commands to guild: ${process.env.GUILD_ID}`);
        } else {
            // Production: Deploy globally (takes up to 1 hour to propagate)
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: client.commandsData }
            );
            logger.success(`✅ Deployed ${client.commandsData.length} commands globally`);
            logger.info('⚠ Note: Global commands may take up to 1 hour to appear in all servers');
        }
        
    } catch (error) {
        logger.error('❌ Failed to deploy commands:', error);
        
        // Provide helpful error messages
        if (error.code === 50001) {
            logger.error('Missing Access - Check if the bot has been invited with the applications.commands scope');
        } else if (error.code === 10002) {
            logger.error('Unknown Application - Check CLIENT_ID in .env file');
        } else if (error.code === 50013) {
            logger.error('Missing Permissions - Check bot permissions in the server');
        }
    }
};

// ==================== GRACEFUL SHUTDOWN ====================
const setupGracefulShutdown = () => {
    const shutdown = async (signal) => {
        logger.warn(`⚠ Received ${signal}, shutting down gracefully...`);
        
        try {
            // Update bot status to offline
            if (client.user) {
                client.user.setPresence({
                    activities: [],
                    status: 'invisible'
                });
            }
            
            // Destroy client
            client.destroy();
            
            logger.success('✅ Bot disconnected from Discord');
            process.exit(0);
            
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
};

// ==================== BOT INITIALIZATION ====================
const initializeBot = async () => {
    try {
        logger.info('🚀 Initializing bot...');
        
        // Load commands and events
        loadCommands();
        loadEvents();
        
        // Deploy slash commands
        await deployCommands();
        
        // Setup graceful shutdown
        setupGracefulShutdown();
        
        // Login to Discord
        await client.login(process.env.DISCORD_TOKEN);
        
        // Set startup timestamp
        client.startupTime = Date.now();
        
    } catch (error) {
        logger.error('❌ Failed to initialize bot:', error);
        process.exit(1);
    }
};

// ==================== START THE BOT ====================
// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    logger.error('🚨 Unhandled Promise Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

// Initialize the bot
initializeBot();

// Export client for use in other files if needed
module.exports = client;