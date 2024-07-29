import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';

// Map of model shortcodes to full model names
export const MODELS = {
  h: 'claude-3-haiku-20240307',
  s: 'claude-3-5-sonnet-20240620',
  o: 'claude-3-opus-20240229'
};

// Factory function to create a stateful Anthropic chat
function anthropicChat() {
  const messages = [];

  async function ask(userMessage, { system, model, temperature = 0.0, max_tokens = 4096, stream = true }) {
    model = MODELS[model] || model;
    const client = new Anthropic({ apiKey: await getToken('anthropic') });

    messages.push({ role: "user", content: userMessage });

    const params = { system, model, temperature, max_tokens, stream };

    let result = "";
    const response = client.messages
      .stream({ ...params, messages })
      .on('text', (text) => {
        process.stdout.write(text);
        result += text;  
      });
    await response.finalMessage();

    messages.push({ role: 'assistant', content: result });

    return result;
  }

  return ask;
}

// Generic asker function that creates an Anthropic chat
export function chat(model) {
  model = MODELS[model] || model;
  if (!model.startsWith('claude')) {
    throw new Error(`Unsupported model: ${model}. Only Claude models are supported.`);
  }
  return anthropicChat();
}

// Utility function to read the API token for Anthropic
async function getToken(vendor) {
  const tokenPath = path.join(os.homedir(), '.config', `${vendor}.token`);
  try {
    return (await fs.readFile(tokenPath, 'utf8')).trim();
  } catch (err) {
    console.error(`Error reading ${vendor}.token file:`, err.message);
    process.exit(1);
  }
}

// Note: tokenCount function has been removed as it was specific to GPT models
