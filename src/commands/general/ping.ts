import { Command } from '@sapphire/framework';
import { Message, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';

export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "ping",
      aliases: ["latency"],
      description: "Shows the bot latency.",
      fullCategory: ["general"],
    });
  }

  public /*async*/ messageRun(message: Message) {
   if(message.channel instanceof TextChannel || message.channel instanceof ThreadChannel){
    return message.channel.send(`Ping: \`${this.container.client.ws.ping}ms\``)
   }
    
  }

}
