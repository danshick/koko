import _ = require('underscore');

const commands: Dict<string[]> = {
  'join': ['channel'],
  'part': ['?channel', '?message'],
  'ctcp': ['target', 'type', 'text'],
  'action': ['target', 'message'],
  'whois': ['nick'],
  'list': [],
  'nick': ['nick'],
  'mode': ['?channel', 'mode', 'nick'],
  'kick': ['?channel', 'nick', '?message'],
  'ban': ['?channel', 'nick'],
  'unban': ['?channel', 'nick'],
  'kickban': ['?channel', 'nick', '?message'],
  'topic': ['?channel', 'topic'],
  'quote': ['command', '...args'],
  'raw': ['command', '...args'],
};

export class CommandError implements Error {
  message: string;
  name: string;
  constructor(message: string) {
    this.message = message;
  }
}

export function parse(raw: string, context: CommandContext): IrcCommand {
  let tokens = raw.split(' ');
  let name = tokens[0];
  let args = tokens.splice(1);
  let command = commands[name];

  if (!command) {
    throw new CommandError(`Invalid command name: ${name}`);
  }

  args = parseArgs(name, _.clone(command), args, context);
  return {name, args};
}

function parseArgs(name: string, argList: string[], args: string[], context: CommandContext): string[] {
  let parsedArgs = [];
  while (true) {
    let argNeeded = argList.shift();
    if (_.isUndefined(argNeeded)) {
      break;
    }
    if (argNeeded.startsWith('?')) {
      if (argList.length >= args.length) {
        parsedArgs.push(undefined);
      } else {
        parsedArgs.push(args.shift());
      }
    } else if (argNeeded.startsWith('...')) {
      parsedArgs.push(args);
      parsedArgs = parsedArgs.concat(args);
      break;
    } else {
      let arg = args.shift();
      if (_.isUndefined(arg)) {
        throw new CommandError(`Command argument needed: [${argNeeded}]`);
      } else {
        parsedArgs.push(arg);
      }
    }
  }
  return parsedArgs.map<string>((arg, idx) => {
    return processArg(name, arg, idx, context);
  });
}

function processArg(name: string, value: string, idx: number, context: CommandContext): string {
  switch (name) {
  case 'join':
    if (idx === 0) {
      if (value[0] !== '#') {
        value = '#' + value;
      }
    }
    break;
  case 'mode':
    if (idx === 0) {
      if (_.isUndefined(value)) {
        value = context.target;
      } else if (value[0] !== '#') {
        value = '#' + value;
      }
    } else if (idx === 1) {
      if (!(value[0] === '+' || value[0] === '0')) {
        value = '+' + value;
      }
    }
    break;
  case 'part':
  case 'kick':
  case 'kickban':
  case 'ban':
  case 'unban':
  case 'topic':
    if (idx === 0) {
      if (_.isUndefined(value)) {
        value = context.target;
      } else if (value[0] !== '#') {
        value = '#' + value;
      }
    }
    break;
  }
  return value;
}
