const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const banCommand = require('./moderation/ban');
const kickCommand = require('./moderation/kick');
const warnCommand = require('./moderation/warn');
const muteCommand = require('./moderation/mute');
const purgeCommand = require('./moderation/purge');
const modhelpCommand = require('./moderation/help');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false)
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user from the server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to ban')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the ban')
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('delete_days')
                        .setDescription('Delete messages from last X days (0-7)')
                        .setRequired(false)
                        .setMinValue(0)
                        .setMaxValue(7)
                )
        )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user from the server')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to kick')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the kick')
                        .setRequired(false)
                )
        )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to warn')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(true)
                )
        )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Mute a user (timeout)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to mute')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Duration in minutes')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(40320)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the mute')
                        .setRequired(false)
                )
        )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('purge')
                .setDescription('Delete multiple messages')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Number of messages to delete (1-100)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(100)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Only delete messages from this user')
                        .setRequired(false)
                )
        )
        
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Show moderation guide and commands')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'ban':
                return banCommand.execute(interaction);
            case 'kick':
                return kickCommand.execute(interaction);
            case 'warn':
                return warnCommand.execute(interaction);
            case 'mute':
                return muteCommand.execute(interaction);
            case 'purge':
                return purgeCommand.execute(interaction);
            case 'help':
                return modhelpCommand.execute(interaction);
            default:
                await interaction.reply({
                    content: 'Unknown subcommand!',
                    ephemeral: true
                });
        }
    }
};
