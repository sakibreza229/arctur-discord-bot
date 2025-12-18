const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }
        
        if (!member.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user. They may have higher permissions.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: 'You cannot kick yourself!',
                ephemeral: true
            });
        }
        
        try {
            await member.kick(`${interaction.user.tag}: ${reason}`);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('User Kicked')
                .setDescription(`${user.tag} has been kicked from the server`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Action' });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            logger.error('Kick error:', error);
            await interaction.reply({
                content: 'Failed to kick user. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
