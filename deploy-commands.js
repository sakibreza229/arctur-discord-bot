require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// ========== ENVIRONMENT VALIDATION ==========
if (!process.env.DISCORD_TOKEN) {
    logger.error('❌ DISCORD_TOKEN is missing in .env file');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    logger.error('❌ CLIENT_ID is missing in .env file');
    process.exit(1);
}

// ========== COMMAND LOADING ==========
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
    logger.error('❌ Commands directory not found!');
    process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
    logger.warn('⚠️ No command files found in commands directory');
}

// Load commands
for (const file of commandFiles) {
    try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if (!command.data || !command.execute) {
            logger.warn(`⚠️ Skipping ${file}: Missing "data" or "execute" property`);
            continue;
        }
        
        commands.push(command.data.toJSON());
        logger.info(`✓ Loaded: ${command.data.name}`);
        
    } catch (error) {
        logger.error(`❌ Failed to load ${file}:`, error.message);
    }
}

// ========== DEPLOYMENT ==========
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const GUILD_ID = process.env.GUILD_ID; // Optional for testing

(async () => {
    try {
        logger.info(`🔄 Deploying ${commands.length} commands...`);
        
        let deploymentInfo;
        
        if (GUILD_ID) {
            // DEVELOPMENT: Deploy to specific guild (instant)
            logger.info(`📁 Target: Specific Guild (${GUILD_ID})`);
            logger.info('⚡ Updates appear immediately');
            
            deploymentInfo = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
                { body: commands },
            );
            
            logger.success(`✅ Deployed ${deploymentInfo.length} commands to guild`);
            
        } else {
            // PRODUCTION: Deploy globally
            logger.info('🌎 Target: Global (All servers)');
            logger.info('⏰ Updates may take up to 1 hour');
            
            deploymentInfo = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            
            logger.success(`✅ Deployed ${deploymentInfo.length} commands globally`);
        }
        
        // Log each deployed command
        logger.info('📋 Deployed Commands:');
        deploymentInfo.forEach(cmd => {
            logger.info(`  • ${cmd.name} - ${cmd.description || 'No description'}`);
        });
        
    } catch (error) {
        logger.error('❌ Deployment failed!');
        
        // User-friendly error messages
        switch (error.code) {
            case 50001:
                logger.error('🔐 Missing Access');
                logger.info('Tip: Reinvite bot with applications.commands scope');
                break;
            case 10002:
                logger.error('🆔 Unknown Application');
                logger.info('Tip: Check CLIENT_ID in .env file');
                break;
            case 50013:
                logger.error('🚫 Missing Permissions');
                logger.info('Tip: Bot needs Manage Guild permission');
                break;
            default:
                logger.error('Error details:', error.message);
        }
        
        process.exit(1);
    }
})();