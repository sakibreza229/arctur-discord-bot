const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with commands'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 EMBED COMMANDS HELP')
            .setDescription('**USE ANY HEX COLOR YOU WANT!** 🎨')
            .setColor('#FF0000') // Using red as example
            .addFields(
                {
                    name: '🎨 **/embed create**',
                    value: 'Create embed with form\nOptional: `/embed create color:#YOURCOLOR`',
                    inline: false
                },
                {
                    name: '🚀 **/simple_embed**',
                    value: 'Quick embed with options\n`/simple_embed title:"Hi" description:"Hello" color:#YOURCOLOR`',
                    inline: false
                },
                {
                    name: '⚡ **/make_embed**',
                    value: 'Simple one-command embed\n`/make_embed title:"Title" body:"Content" color:#YOURCOLOR`',
                    inline: false
                },
                {
                    name: '🌟 **/easy_embed**',
                    value: 'Easiest way\n`/easy_embed title:"Title" text:"Text" color:#YOURCOLOR`',
                    inline: false
                },
                {
                    name: '🎨 **COLOR EXAMPLES (USE ANY!)**',
                    value: [
                        '`#FF0000` - Red',
                        '`#00FF00` - Green',
                        '`#0000FF` - Blue',
                        '`#FFA500` - Orange',
                        '`#FF00FF` - Magenta',
                        '`#FFFF00` - Yellow',
                        '`#800080` - Purple',
                        '`#FF1493` - Deep Pink',
                        '`#00FFFF` - Cyan',
                        '`#FFD700` - Gold',
                        '**ANY hex code works!**'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📝 **3-DIGIT HEX ALSO WORKS**',
                    value: '`#F00` = Red\n`#0F0` = Green\n`#00F` = Blue\n`#FF0` = Yellow',
                    inline: false
                }
            )
            .setFooter({ text: 'You can use ANY color - no restrictions!' });

        await interaction.reply({ 
            embeds: [embed] 
        });
    }
};