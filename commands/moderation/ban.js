const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }
        
        if (!member.bannable) {
            return interaction.reply({
                content: 'I cannot ban this user. They may have higher permissions.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: 'You cannot ban yourself!',
                ephemeral: true
            });
        }
        
        try {
            await member.ban({ 
                reason: `${interaction.user.tag}: ${reason}`,
                deleteMessageDays: deleteDays 
            });
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('User Banned')
                .setDescription(`${user.tag} has been banned from the server`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Messages Deleted', value: `${deleteDays} days`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Action' });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            logger.error('Ban error:', error);
            await interaction.reply({
                content: 'Failed to ban user. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
