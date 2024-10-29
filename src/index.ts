import { SapphireClient } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import { BOT_PREFIX, BOT_TOKEN } from './config';

const client = new SapphireClient({
  intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  loadMessageCommandListeners: true,
  defaultPrefix: BOT_PREFIX,
});


client.login(BOT_TOKEN);