const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with all bot commands and features'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 **ARCTUR BOT**')
            .setDescription('A powerful Discord server management bot with embed creation and moderation tools. Arctur Bot helps you manage your Discord server with powerful tools:\n• Create beautiful embeds easily\n• Moderate your server effectively\n• Send automated messages\n• Customize everything with colors!')
            .setColor('#7289DA') // Discord blurple
            
            // Features Section
            .addFields({
                name: '✨ **MAIN FEATURES**',
                value: [
                    '**📊 Server Management**',
                    '• User moderation tools',
                    '• Role management',
                    '• Server configuration',
                    '• Cleanup commands',
                    '',
                    '**🎨 Embed Creation**',
                    '• Multiple embed commands',
                    '• Full color customization',
                    '• Easy-to-use interfaces',
                    '• Quick templates',
                    '',
                    '**📢 Message Tools**',
                    '• Send messages as bot',
                    '• Scheduled messages',
                    '• Announcement system',
                    '• Custom formatting'
                ].join('\n'),
                inline: false
            })
            
            // Commands Section
            .addFields({
                name: '⚡ **COMMAND CATEGORIES**',
                value: [
                    '**🛡️ MODERATION COMMANDS**',
                    '• `/mod help` - Moderation help menu',
                    '• `/mod kick` - Kick a user',
                    '• `/mod ban` - Ban a user',
                    '• `/mod timeout` - Timeout a user',
                    '• `/mod warn` - Warn a user',
                    '• `/mod clear` - Clear messages',
                    '• `/mod role` - Manage roles',
                    '',
                    '**🎨 EMBED COMMANDS**',
                    '• `/embed help` - Embed help menu',
                    '• `/embed create` - Create custom embed',
                    '• `/embed simple` - Quick simple embed',
                    '• `/embed advanced` - Advanced embed builder',
                    '• `/embed edit` - Edit existing embed',
                    '• `/embed color` - Preview colors',
                    '',
                    '**📢 MESSAGE COMMANDS**',
                    '• `/msg help` - Message help menu',
                    '• `/msg send` - Send message as bot',
                    '• `/msg announce` - Make announcement',
                    '• `/msg embed` - Send pre-made embed',
                    '• `/msg schedule` - Schedule message',
                    '• `/msg edit` - Edit bot message'
                ].join('\n'),
                inline: false
            })
            
            // Color Guide Section
            .addFields({
                name: '🎨 **COLOR CUSTOMIZATION**',
                value: [
                    '**ANY HEX COLOR WORKS!**',
                    '',
                    '**Full 6-digit:**',
                    '• `#FF0000` - Red',
                    '• `#00FF00` - Green',
                    '• `#0000FF` - Blue',
                    '• `#FFA500` - Orange',
                    '• `#FFFF00` - Yellow',
                    '• `#800080` - Purple',
                    '',
                    '**Short 3-digit:**',
                    '• `#F00` = Red',
                    '• `#0F0` = Green',
                    '• `#00F` = Blue',
                    '• `#FF0` = Yellow',
                    '',
                    '**Tip:** Use `/embed color` to preview colors!'
                ].join('\n'),
                inline: false
            })
            
            // Quick Start Section
            .addFields({
                name: '🚀 **QUICK START GUIDE**',
                value: [
                    '**For new users:**',
                    '1️⃣ Start with `/embed simple` for easy embeds',
                    '2️⃣ Try `/mod help` to see moderation tools',
                    '3️⃣ Use `/msg send` to send messages as the bot',
                    '4️⃣ Configure your server with `/config set`',
                    '',
                    '**Pro tip:** All embed commands support hex colors like `#FF5733`!'
                ].join('\n'),
                inline: false
            })
            
            // Links Section
            .addFields({
                name: '🔗 **IMPORTANT LINKS**',
                value: [
                    '• [Support Server](https://discord.gg/your-link) - Get help',
                    '• [Documentation](https://docs.example.com) - Full guide',
                    '• [GitHub](https://github.com/your-repo) - Source code',
                    '• [Invite Bot](https://discord.com/oauth2/authorize?client_id=YOUR_ID&permissions=8&scope=bot) - Add to server'
                ].join('\n'),
                inline: false
            })
            
            // Footer
            .setFooter({ 
                text: `Arctur Bot v1.0 • Requested by ${interaction.user.username}` 
            })
            .setTimestamp();

        await interaction.reply({ 
            embeds: [embed],
            ephemeral: true // Only the user can see it
        });
    }
};