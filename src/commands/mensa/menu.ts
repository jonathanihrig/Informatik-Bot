import { Command } from '@sapphire/framework';
import { Message, TextChannel, ThreadChannel } from 'discord.js';
import { getMenu, compileMenuEmbed, numbers } from '../../modules/mensa/mensa';
import { convertToDate } from '../../modules/util/date';
import levenshteinNormalize from '../../modules/util/levenshtein_normalize';
import location_levenshtein from './resources/location_levenshtein.json';

interface Args {
    location: string;
    day: string,
}


export class MenuCommand extends Command {
    public constructor(context: Command.LoaderContext) {
        super(context, {
            name: 'menu',
            aliases: ['m', 'essen', 'e', 'speiseplan'],
            description: 'Presents the meals that are available at the mensa',
        });
    }

    // This method handles message commands
    public override async messageRun(message: Message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Split message content into arguments
        const args = message.content.split(' ').slice(1);
        const location = args[0] || 'reichenhainer'; // Default location
        const day = args[1] || 'today'; // Default day

        console.log('>>> menu by', message.author.tag);

        // Normalize location
        const normalizedLocation = `${levenshteinNormalize(location, location_levenshtein)}`;

        // Convert day to date
        const date = convertToDate(day);

        if (!date) {
            return message.reply('Couldn\'t process your request.');
        }

        // Fetch the menu
        const menu = await getMenu(normalizedLocation, date);
        const embed = compileMenuEmbed(menu);
        
        // Send the embed
        const answer = await message.reply({ embeds: [embed] });

        // React to the message with meal options
        for (let i = 0; i < menu.meals.length; i++) {
            await answer.react(numbers[i]);
        }

        return answer;
    }

}


