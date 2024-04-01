const ms = require('ms');

const parseTime = (time) => {
  time = time.split(' ');

  let parsedTime = 0;
  for (const splitTime in time) {
    if (splitTime === undefined) return undefined;
    parsedTime += ms(splitTime);
  }

  return parsedTime;
};

module.exports = { parseTime };
