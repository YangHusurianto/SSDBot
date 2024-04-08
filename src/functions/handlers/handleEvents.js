import fs from 'fs';
import path from 'path';

import mongoose from 'mongoose';

export default async function handleEvents(client) {
  client.handleEvents = async () => {
    const eventFolderPath = path.join('./src', 'events');
    const eventFolders = fs.readdirSync(eventFolderPath);

    for (const folder of eventFolders) {
      const eventPath = path.join(eventFolderPath, folder);
      const eventFiles = fs
        .readdirSync(eventPath)
        .filter((file) => file.endsWith('.js'));

      switch (folder) {
        case 'client':
          for (const file of eventFiles) {
            const event = (await import(`../../events/client/${file}`)).default;

            if (event.once) {
              client.once(event.name, (...args) =>
                event.execute(...args, client)
              );
            } else {
              client.on(event.name, (...args) =>
                event.execute(...args, client)
              );
            }
          }
          break;

          case 'guildEvents':
            for (const file of eventFiles) {
              const event = (await import(`../../events/guildEvents/${file}`)).default;
  
              if (event.once) {
                client.once(event.name, (...args) =>
                  event.execute(...args, client)
                );
              } else {
                client.on(event.name, (...args) =>
                  event.execute(...args, client)
                );
              }
            }
            break;

        case 'mongo':
          for (const file of eventFiles) {
            const event = (await import(`../../events/mongo/${file}`)).default;
            if (event.once)
              mongoose.connection.once(event.name, (...args) =>
                event.execute(...args)
              );
            else
              mongoose.connection.on(event.name, (...args) =>
                event.execute(...args)
              );
          }
        default:
          break;
      }
    }
  };
}
