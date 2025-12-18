const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('creator')
        .setDescription('Get information about the bot creator')
        .setDMPermission(false),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Sakib Reza - Overview')
            .setURL('https://sakibreza229.netlify.app') // Makes your name clickable
            .setColor(0x2b2d31) 
            .setThumbnail('https://github.com/sakibreza229.png')
            .setDescription(`
**Meet the Developer**
Hello! I am a Full-stack Developer specializing in creating seamless digital experiences.

**Details:**
• **GitHub:** [sakibreza229](https://github.com/sakibreza229)
• **Portfolio:** [sakibreza229.netlify.app](https://sakibreza229.netlify.app)
• **Discord:** \`@srcraftsmith\`
• **Status:** Available for custom development

*Professional code execution focusing on error handling, security, and long-term maintainability.*
            `)
            .setFooter({ text: 'Contact for custom bot inquiries' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};