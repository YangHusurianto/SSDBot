const fs = require('node:fs');
const path = require('node:path');

const { connection } = require('mongoose');

module.exports = (client) => {
  client.handleEvents = async () => {
    const eventFolderPath = path.join('./src', 'events');
    const eventFolders = fs.readdirSync(eventFolderPath);

    for (const folder of eventFolders) {
      const eventPath = path.join(eventFolderPath, folder);
      const eventFiles = fs.readdirSync(eventPath).filter(file => file.endsWith('.js'));

      switch (folder) {
        case 'client':
          for (const file of eventFiles) {
            const event = require(`../../events/client/${file}`)

            if (event.once) {
              client.once(event.name, (...args) => event.execute(...args, client));
            } else {
              client.on(event.name, (...args) => event.execute(...args, client));
            }
          }
          break;

        case 'mongo':
          for (const file of eventFiles) {
            const event = require(`../../events/mongo/${file}`)
            if (event.once) connection.once(event.name, (...args) => event.execute(...args, client));
            else connection.on(event.name, (...args) => event.execute(...args, client));
          }
        default:
          break;
      }
    }
  }
}   