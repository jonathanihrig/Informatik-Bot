import axios from 'axios';
import { Client, Guild, EmbedBuilder, TextChannel } from 'discord.js';
import { parseStringPromise } from 'xml2js';

import { days_de } from '../util/date';
import { Menu, MensaResult, Meal } from './mensa.d';
// This code was cloned from the original discord bot mentioned in the git readme


export const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '0️⃣'];

/**
 * retrieves a menu for the requested day and location
 */
export async function getMenu(location:string, date:Date):Promise<Menu> {
    let id: string;
    if (location === 'reichenhainer') {
        id = '1479835489';
    }
    else {
        id = '773823070';
    }
    const url = `https://www.swcz.de/bilderspeiseplan/xml.php?plan=${id}` +
        `&jahr=${date.getFullYear()}` +
        `&monat=${date.getMonth() + 1}` +
        `&tag=${date.getDate()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result:MensaResult = await axios.get(url)
        .then(res => {
            return parseStringPromise(res.data);
        })
        .catch(err => {
            console.log(err);
            return undefined;
        });


    const menu: Menu = {
        meals: [],
        location: location === 'reichenhainer' ? 'Reichenhainer Straße' : 'Straße der Nationen',
        date,
    };

    if (!result.speiseplan.essen) {
        return menu;
    }

    for (let i = 0; i < result.speiseplan.essen.length; i++) {
        const cur_meal = result.speiseplan.essen[i];
        menu.meals.push({
            alcohol: cur_meal['$'].alkohol == 'true' ?
                true : false,

            beef: cur_meal['$'].rind == 'true' ?
                true : false,

            pork: cur_meal['$'].schwein == 'true' ?
                true : false,

            vegetarian: cur_meal['$'].vegetarisch == 'true' ?
                true : false,

            category: cur_meal['$'].kategorie ?
                cur_meal['$'].kategorie : undefined,

            img: cur_meal['$'].img == 'true' ? {
                img_big: cur_meal['$'].img_big,
                img_small: cur_meal['$'].img_small,
            } : undefined,

            description: cur_meal.deutsch[0] ?
                cur_meal.deutsch[0] : undefined,

            price: cur_meal.pr ? {
                student: Number(cur_meal.pr[0]._),
                staff: Number(cur_meal.pr[1]._),
                external: Number(cur_meal.pr[2]._),
            } : undefined,
        });
    }


    // move items without a price to the back
    for (let i = 0; i < menu.meals.length; i++) {
        if (!menu.meals[i].price) {
            menu.meals.push(menu.meals.splice(i, 1)[0]);
        }
    }

    return menu;
}

/**
 * compiles the description of a menu entry (price + descr)
 */
function compileDescription(meal:Meal): string {
    return `${meal.description ? meal.description.split(/\([\d,]*\)/).join('') : '\u200b'}` +
        `${meal.price ? `\n\`${meal.price.student.toFixed(2)}€\`` +
            `\n\`${meal.price.staff.toFixed(2)}€\`` +
            `\n\`${meal.price.external.toFixed(2)}€\`` : '\u200b'}`;
}

/**
 * renders a menu input into a formatted embed
 */
export function compileMenuEmbed(menu:Menu): EmbedBuilder {
    if (menu.meals.length === 0) {
        return new EmbedBuilder({
            title: `Menu, ${menu.location}, ${days_de[menu.date.getDay()]}, ${menu.date.toLocaleDateString()}`,
            description: 'Could not find a menu for that day.',
            color: 0xFF0000,
        });
    }
    const embed = new EmbedBuilder({
        title: `${menu.location}, ${days_de[menu.date.getDay()]}, ${menu.date.toLocaleDateString()}`,
        color: 0x6A8A26,
    });

    const fields = menu.meals.map((meal, index) => ({
        name: `${numbers[index]} ${meal.category}`,
        value: compileDescription(meal),
        inline: true, // This makes the fields display inline
    }));
    
    embed.addFields(fields);
    

    return embed;
}

export async function autoMenu(client:Client, guild_id:string, channel_id:string, content?:string): Promise<void> {

    const menus = [
        await getMenu('reichenhainer', new Date()),
        await getMenu('strana', new Date()),
    ];

// Obtain the guild from the client's cache
const guild = client.guilds.cache.get(guild_id);
if (!guild) {
    console.error("Guild not found!");
    return; // Exit if the guild does not exist
}

// Obtain the channel from the guild's channels cache
const channel = guild.channels.cache.get(channel_id);
if (!channel || !(channel instanceof TextChannel)) {
    console.error("Channel not found or is not a text channel!");
    return; // Exit if the channel is not found or not a text channel
}

// Iterate over the menus and send messages
for (let i = 0; i < menus.length; i++) {
    if (menus[i].meals.length !== 0) {
        const embed = compileMenuEmbed(menus[i]); // Get the embed
        const msg = await channel.send({
            content: `${i === 0 ? (content ? content : '') : ''}`, 
            embeds: [embed]
        });
        for (let j = 0; j < menus[i].meals.length; j++) {
            msg.react(numbers[j]);
        }
    }
}



}
