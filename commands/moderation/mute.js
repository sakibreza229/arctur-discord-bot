const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }
        
        if (!member.moderatable) {
            return interaction.reply({
                content: 'I cannot mute this user. They may have higher permissions.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: 'You cannot mute yourself!',
                ephemeral: true
            });
        }
        
        try {
            await member.timeout(duration * 60 * 1000, `${interaction.user.tag}: ${reason}`);
            
            const embed = new EmbedBuilder()
                .setColor(0x800080)
                .setTitle('User Muted')
                .setDescription(`${user.tag} has been muted (timed out)`)
                .addFields(
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Duration', value: `${duration} minutes`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Until', value: `<t:${Math.floor((Date.now() + duration * 60000) / 1000)}:R>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Moderation Action' });
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            logger.error('Mute error:', error);
            await interaction.reply({
                content: 'Failed to mute user. Please check my permissions.',
                ephemeral: true
            });
        }
    }
};
