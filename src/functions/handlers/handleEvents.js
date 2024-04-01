import fs from 'fs';
import path from 'path';

import pkg from 'mongoose';
const { connection } = pkg;

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

        case 'mongo':
          for (const file of eventFiles) {
            const event = (await import(`../../events/mongo/${file}`)).default;
            if (event.once)
              connection.once(event.name, (...args) =>
                event.execute(...args, client)
              );
            else
              connection.on(event.name, (...args) =>
                event.execute(...args, client)
              );
          }
        default:
          break;
      }
    }
  };
}
