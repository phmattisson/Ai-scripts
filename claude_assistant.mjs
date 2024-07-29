import { chat } from './Chat.mjs';  // Assuming Chat.mjs is in the same directory

async function main() {
  const claudeChat = chat('s');  // 's' for Claude 3.5 Sonnet

  const systemPrompt = `You are a helpful AI assistant.`;
  
  while (true) {
    const userInput = await getUserInput('Enter your message (or "exit" to quit): ');
    
    if (userInput.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      break;
    }

    const response = await claudeChat(userInput, {
      system: systemPrompt,
      model: 's',
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('\nClaude:', response, '\n');
  }
}

async function getUserInput(prompt) {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

main().catch(console.error);
