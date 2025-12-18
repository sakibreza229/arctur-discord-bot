const { EmbedBuilder, ChannelType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        
        if (interaction.channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: 'This command can only be used in text channels.',
                ephemeral: true
            });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            let messages;
            if (targetUser) {
                const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
                messages = fetchedMessages.filter(msg => msg.author.id === targetUser.id).first(amount);
            } else {
                messages = amount;
            }
            
            const deleted = await interaction.channel.bulkDelete(messages, true);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Messages Purged')
                .setDescription(`Successfully deleted ${deleted.size} messages`)
                .addFields(
                    { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    targetUser ? { name: 'Filtered By', value: targetUser.tag, inline: true } : 
                        { name: 'Filtered By', value: 'None (all messages)', inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Messages older than 14 days cannot be bulk deleted' });
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            logger.error('Purge error:', error);
            await interaction.editReply({
                content: 'Failed to delete messages. Note: Messages older than 14 days cannot be bulk deleted.',
                ephemeral: true
            });
        }
    }
};
