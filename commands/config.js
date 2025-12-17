const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a configuration option')
                .addStringOption(option =>
                    option.setName('option')
                        .setDescription('Option to set')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Mod Log Channel', value: 'modLogChannel' },
                            { name: 'Welcome Channel', value: 'welcomeChannel' },
                            { name: 'Mod Role', value: 'modRole' },
                            { name: 'Admin Role', value: 'adminRole' },
                            { name: 'Embed Color', value: 'embedColor' }
                        ))
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('Value to set')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset configuration to defaults')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        
        // Load or create guild config
        const configPath = path.join(__dirname, '../configs', `${guildId}.json`);
        let guildConfig = {};
        
        if (fs.existsSync(configPath)) {
            guildConfig = require(configPath);
        }
        
        if (subcommand === 'set') {
            const option = interaction.options.getString('option');
            const value = interaction.options.getString('value');
            
            // Validate and process values
            if (option.includes('Channel') || option.includes('Role')) {
                // Try to resolve channel/role mention
                const match = value.match(/<#(\d+)>|<@&(\d+)>/);
                if (match) {
                    guildConfig[option] = match[1] || match[2];
                } else {
                    guildConfig[option] = value;
                }
            } else {
                guildConfig[option] = value;
            }
            
            // Save config
            fs.writeFileSync(configPath, JSON.stringify(guildConfig, null, 2));
            
            const embed = new EmbedBuilder()
                .setTitle('✅ Configuration Updated')
                .setColor('#57F287')
                .setDescription(`**${option}** set to: \`${value}\``)
                .setFooter({ text: `Server: ${interaction.guild.name}` });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } else if (subcommand === 'view') {
            const embed = new EmbedBuilder()
                .setTitle('📋 Server Configuration')
                .setColor('#7289DA')
                .setDescription(`Configuration for **${interaction.guild.name}**`)
                .addFields(
                    {
                        name: '📝 Mod Log Channel',
                        value: guildConfig.modLogChannel 
                            ? `<#${guildConfig.modLogChannel}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: '👋 Welcome Channel',
                        value: guildConfig.welcomeChannel 
                            ? `<#${guildConfig.welcomeChannel}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: '🛡️ Mod Role',
                        value: guildConfig.modRole 
                            ? `<@&${guildConfig.modRole}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: '👑 Admin Role',
                        value: guildConfig.adminRole 
                            ? `<@&${guildConfig.adminRole}>` 
                            : 'Not set',
                        inline: true
                    },
                    {
                        name: '🎨 Embed Color',
                        value: guildConfig.embedColor || '#7289DA (Default)',
                        inline: true
                    }
                )
                .setFooter({ text: 'Use /config set to modify settings' });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
        } else if (subcommand === 'reset') {
            // Delete config file
            if (fs.existsSync(configPath)) {
                fs.unlinkSync(configPath);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('🔄 Configuration Reset')
                .setColor('#FEE75C')
                .setDescription('All server settings have been reset to defaults.')
                .setFooter({ text: `Server: ${interaction.guild.name}` });
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};