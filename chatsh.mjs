#!/usr/bin/env node

import readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import { chat, MODELS } from './Chat.mjs';

const execAsync = promisify(exec);

// Default model if not specified
const DEFAULT_MODEL = "s";  
// Get model from environment variable or use default
const MODEL = process.argv[2] || DEFAULT_MODEL;

console.log(`Welcome to ChatSH. Model: ${MODELS[MODEL]||MODEL}\n`);

// System prompt to set the assistant's behavior
const SYSTEM_PROMPT = `You are ChatSH, an AI language model that specializes in assisting users with tasks on their system using shell commands. ChatSH operates in two modes: COMMAND MODE and CHAT MODE.

# GUIDE for COMMAND NODE:

1. The USER asks you to perform a SYSTEM TASK.

2. ChatSH answers with a SHELL SCRIPT to perform the task.

# GUIDE for CHAT MODE:

1. The USER asks an ARBITRARY QUESTION or OPEN-ENDED MESSAGE.

2. ChatSH answers it with a concise, factual response.

# EXAMPLE 1:

<USER>
Show me local files.
</USER>

<ChatSH>
\`\`\`sh
ls
\`\`\`
</ChatSH>

<SYSTEM>
example.gif example.tst example_dir/
</SYSTEM>

<USER>
Is there any text file?
</USER>

<ChatSH>
Yes, there is a file named example.txt in the current directory
</ChatSH>

<USER>
Show me the contents of example.txt.
</USER>

<ChatSH>
cat example.txt
</ChatSH>

<USER>
read the contents of the notebook example.ipynb
<USER>

<ChatSH>
/Users/philipmattisson/Ai-scripts/nbcode.sh example.ipynb
<CHatSH>

<USER>
What is the monster group?
</USER>

<ChatSH>
The monster group is the largest sporadic simple group, with order approximately 8×10^53.
</ChatSH>

<USER>
What is a simple group?
</USER>

<ChatSH>
A simple group is a nontrivial group that contains no proper nontrivial normal subgroups.
</ChatSH>

<USER>
Move the text file to that dir.
</USER>

<ChatSH>
\`\`\`sh
mv example.txt example_dir/
\`\`\`
</ChatSH>

# EXAMPLE 2:

<USER>
Fix main.ts
</USER>

<ChatSH>
\`\`\`sh
cat main.ts
tsc --noEmit main.ts
\`\`\`
</ChatSH>

<SYSTEM>
import List from './list';
import map from './map';

const n_1_2: List<number> = { $: "cons", head: 1, tail: { $: "cons", head: 2, tail: { $: "nil" }}};
const n_2_4: List<number> = map(n_1_2, x => x * 2);

console.log(JSON.stringify(n_2_4));

map.ts:7:22 - error TS2345: Argument of type '(val: T) => U' is not assignable to parameter of type 'List<unknown>'.

7       let tail = map(fun, list.tail);
                       ~~~
</SYSTEM>

<ChatSH>
\`\`\`sh
ls
\`\`\`
</ChatSH>

<SYSTEM>
list.ts main.ts map.ts
</SYSTEM>

<ChatSH>
\`\`\`sh
cat map.ts
\`\`\`
</ChatSH>

<SYSTEM>
import List from './list';

function map<T, U>(list: List<T>, fun: (val: T) => U): List<U> {
  switch (list.$) {
    case "cons":
      let head = fun(list.head);
      let tail = map(fun, list.tail);
      return { $: "cons", head, tail };
    case "nil":
      return { $: "nil" };
  }
}

export default map;
</SYSTEM>

<ChatSH>
\`\`\`sh
cat > map.ts << EOL
import List from './list';

function map<T, U>(list: List<T>, fun: (val: T) => U): List<U> {
  switch (list.$) {
    case "cons":
      let head = fun(list.head);
      let tail = map(list.tail, fun);
      return { $: "cons", head, tail };
    case "nil":
      return { $: "nil" };
  }
}

export default map;
EOL
tsc --noEmit map.ts
\`\`\`
</ChatSH>

<SYSTEM>

</SYSTEM>

<ChatSH>
Done.
</ChatSH

## NOTES:

- In COMMAND MODE, ChatSH MUST answer with A SINGLE SH BLOCK.

- In COMMAND MODE, ChatSH MUST NOT answer with ENGLISH EXPLANATION.

- In TEXT MODE, ChatSH MUST ALWAYS answer with TEXT.

- In TEXT MODE, ChatSH MUST NEVER answer with SH BLOCK.

- ChatSH MUST be CONCISE, OBJECTIVE, CORRECT and USEFUL.

- ChatSH MUST NEVER attempt to install new tools. Assume they're available.

- ChatSH's interpreter can only process one SH per answer.

- On TypeScript:
  - Use 'tsc --noEmit file.ts' to type-check.
  - Use 'tsx file.ts' to run.
  - Never generate js files.

- When a task is completed, STOP using commands. Just answer with "Done.".

- The system shell in use is: ${await get_shell()}.`;

// Create readline interface for user input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true  
});

// Create a stateful asker
const ask = chat(MODEL);

// Utility function to prompt the user for input
async function prompt(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);  
  });
}

// If there are words after the 'chatsh', set them as the initialUserMessage
var initialUserMessage = process.argv.slice(3).join(' ');

// Main interaction loop
async function main() {
  let lastOutput = "";

  while (true) {
    let userMessage;
    if (initialUserMessage) {
      userMessage = initialUserMessage;
      initialUserMessage = null;
    } else {
      process.stdout.write('\x1b[1m');  // blue color
      userMessage = await prompt('λ ');
      process.stdout.write('\x1b[0m'); // reset color
    }
    
    try {
      const fullMessage = userMessage.trim() !== ''
        ? `<SYSTEM>\n${lastOutput.trim()}\n</SYSTEM>\n<USER>\n${userMessage}\n</USER>\n`
        : `<SYSTEM>\n${lastOutput.trim()}\n</SYSTEM>`;

      const assistantMessage = await ask(fullMessage, { system: SYSTEM_PROMPT, model: MODEL });  
      console.log(); 
      
      const code = extractCode(assistantMessage);
      lastOutput = "";

      if (code) {
        console.log("\x1b[31mPress enter to execute, or 'N' to cancel.\x1b[0m");
        const answer = await prompt('');
        // TODO: delete the warning above from the terminal
        process.stdout.moveCursor(0, -2);
        process.stdout.clearLine(2);
        if (answer.toLowerCase() === 'n') {
          console.log('Execution skipped.');
          lastOutput = "Command skipped.\n";
        } else {
          try {
            const {stdout, stderr} = await execAsync(code);
            const output = `${stdout.trim()}${stderr.trim()}`;
            console.log('\x1b[2m' + output.trim() + '\x1b[0m');
            lastOutput = output;
          } catch(error) {
            const output = `${error.stdout?.trim()||''}${error.stderr?.trim()||''}`;
            console.log('\x1b[2m' + output.trim() + '\x1b[0m');
            lastOutput = output;
          }
        }
      }
    } catch(error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Utility function to extract code from the assistant's message
function extractCode(text) {
  const match = text.match(/```sh([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

async function get_shell() {
  const shellInfo = (await execAsync('uname -a && $SHELL --version')).stdout.trim();
  return shellInfo;
}

main();
