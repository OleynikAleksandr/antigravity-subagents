/**
 * JSONL log formatter for Claude sessions
 * Parses Claude's JSONL output and displays it beautifully in terminal
 * Uses CommonJS syntax for Node.js compatibility without ESM warnings
 */
export const FORMAT_LOG_SCRIPT = `#!/usr/bin/env node
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  cyan: '\\x1b[36m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  magenta: '\\x1b[35m',
  gray: '\\x1b[90m',
};

function truncate(str, maxLen = 200) {
  if (!str) return '';
  const s = String(str).replace(/\\n/g, '\\\\n');
  return s.length <= maxLen ? s : s.slice(0, maxLen) + '...';
}

function formatToolInput(input) {
  if (!input) return '';
  return Object.entries(input)
    .map(([k, v]) => k + '=' + truncate(JSON.stringify(v), 100))
    .join(', ');
}

function processLine(line) {
  if (!line.trim()) return;
  
  let data;
  try {
    data = JSON.parse(line);
  } catch {
    return;
  }

  const type = data.type;
  if (type === 'queue-operation') return;

  if (type === 'system' && data.subtype === 'init') {
    console.log(colors.cyan + colors.bright + 'SESSION:' + colors.reset + ' ' + data.session_id);
    console.log(colors.gray + 'Model: ' + data.model + ', Tools: ' + (data.tools?.length || 0) + colors.reset + '\\n');
  }

  if (type === 'user') {
    const msg = data.message;
    if (msg?.content) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          console.log(colors.cyan + colors.bright + 'USER:' + colors.reset + ' ' + truncate(block.text, 300));
        } else if (block.type === 'tool_result') {
          // Increased limit for tool results to show more context
          const result = truncate(typeof block.content === 'string' ? block.content : JSON.stringify(block.content), 300);
          console.log(colors.gray + '  └─ RESULT:' + colors.reset + ' ' + result);
        }
      }
    }
  }

  if (type === 'assistant') {
    const msg = data.message;
    if (msg?.content) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          console.log(colors.green + colors.bright + 'CLAUDE:' + colors.reset + ' ' + truncate(block.text, 500));
        } else if (block.type === 'thinking') {
          console.log(colors.magenta + '💭 THINKING:' + colors.reset + ' ' + truncate(block.thinking, 300));
        } else if (block.type === 'tool_use') {
          console.log(colors.yellow + '⚡ ' + block.name + colors.reset + '(' + formatToolInput(block.input) + ')');
        }
      }
    }
  }

  if (type === 'result') {
    const icon = data.subtype === 'success' ? '✅' : '❌';
    console.log('\\n' + icon + ' ' + colors.bright + 'RESULT: ' + data.subtype + colors.reset);
    if (data.result) {
      console.log(truncate(data.result, 500));
    }
  }
}

// Main - using async IIFE for top-level await equivalent in CommonJS
(async function() {
  const args = process.argv.slice(2);
  const input = args[0] ? createReadStream(args[0]) : process.stdin;

  const rl = createInterface({ input, crlfDelay: Infinity });

  console.log('═'.repeat(60));
  console.log('Claude Agent Session Log');
  console.log('═'.repeat(60) + '\\n');

  for await (const line of rl) {
    processLine(line);
  }

  console.log('\\n' + '═'.repeat(60));
})();
`;
