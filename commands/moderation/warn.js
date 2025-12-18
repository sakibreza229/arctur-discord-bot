const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        if (!member) {
            return interaction.reply({
                content: 'User not found in this server.',
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('User Warned')
            .setDescription(`${user.tag} has received a warning`)
            .addFields(
                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Moderation Action' });
        
        await interaction.reply({ embeds: [embed] });
        
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFFFF00)
                .setTitle('You have been warned')
                .setDescription(`You received a warning in **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Please follow the server rules' });
            
            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            logger.info(`Could not DM warning to ${user.tag}`);
        }
    }
};
