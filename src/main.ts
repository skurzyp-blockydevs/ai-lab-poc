import './style.css';
import { Client, PrivateKey } from '@hashgraph/sdk';
import {
  HederaLangchainToolkit,
  AgentMode,
  coreAccountPluginToolNames,
  coreTokenPluginToolNames,
  coreConsensusPluginToolNames,
  coreAccountQueryPluginToolNames,
  coreConsensusQueryPluginToolNames,
  coreTokenQueryPluginToolNames,
  coreEVMQueryPluginToolNames,
  coreTransactionQueryPluginToolNames,
  coreMiscQueriesPluginsToolNames,
  coreEVMPluginToolNames,
  ResponseParserService,
} from 'hedera-agent-kit';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';

// Configuration interface
interface Config {
  ACCOUNT_ID: string;
  PRIVATE_KEY: string;
  OPENAI_API_KEY: string;
}

// Load configuration from localStorage
function loadConfig(): Config {
  return {
    ACCOUNT_ID: localStorage.getItem('ACCOUNT_ID') || '',
    PRIVATE_KEY: localStorage.getItem('PRIVATE_KEY') || '',
    OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || '',
  };
}

// Save configuration to localStorage
function saveConfig(config: Config): void {
  localStorage.setItem('ACCOUNT_ID', config.ACCOUNT_ID);
  localStorage.setItem('PRIVATE_KEY', config.PRIVATE_KEY);
  localStorage.setItem('OPENAI_API_KEY', config.OPENAI_API_KEY);
}

// Output management
class OutputManager {
  private outputDiv: HTMLElement;

  constructor(outputDiv: HTMLElement) {
    this.outputDiv = outputDiv;
  }

  log(...args: any[]): void {
    this.addLine('log', args.map(arg => this.formatValue(arg)).join(' '));
  }

  error(...args: any[]): void {
    this.addLine('error', args.map(arg => this.formatValue(arg)).join(' '));
  }

  info(...args: any[]): void {
    this.addLine('info', args.map(arg => this.formatValue(arg)).join(' '));
  }

  success(...args: any[]): void {
    this.addLine('success', args.map(arg => this.formatValue(arg)).join(' '));
  }

  clear(): void {
    this.outputDiv.innerHTML = '';
  }

  private formatValue(value: any): string {
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private addLine(type: string, content: string): void {
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = content;
    this.outputDiv.appendChild(line);
    this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
  }
}

// Code examples
const examples = {
  hello: `console.log('Hello from Hedera Agent Kit!');
console.log('Browser execution is working! 🎉');`,

  balance: `// Get HBAR balance
const config = getConfig();
if (!config.ACCOUNT_ID) {
  console.error('Please configure your Account ID first!');
} else {
  console.log('Account ID:', config.ACCOUNT_ID);
  console.log('Configuration loaded successfully!');
}`,

  client: `// Create Hedera Client
const config = getConfig();
if (!config.ACCOUNT_ID || !config.PRIVATE_KEY) {
  console.error('Please configure Account ID and Private Key first!');
} else {
  try {
    const client = Client.forTestnet();
    console.log('✅ Hedera Client created successfully!');
    console.log('Network:', 'Testnet');
  } catch (error) {
    console.error('Error creating client:', error);
  }
}`,

  fullAgent: `// Full Hedera Agent with ALL Tools (Browser Version)
// This mirrors the complete CLI agent script

// Get configuration from localStorage OR Vite env variables
const config = getConfig();
const ACCOUNT_ID = config.ACCOUNT_ID || viteEnv.VITE_ACCOUNT_ID;
const PRIVATE_KEY = config.PRIVATE_KEY || viteEnv.VITE_PRIVATE_KEY;
const OPENAI_API_KEY = config.OPENAI_API_KEY || viteEnv.VITE_OPENAI_API_KEY;

if (!ACCOUNT_ID || !PRIVATE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Please configure credentials:');
  console.error('Option 1: Use the Configuration panel above');
  console.error('Option 2: Set VITE_* env variables in .env file');
  console.error('  - VITE_ACCOUNT_ID');
  console.error('  - VITE_PRIVATE_KEY');
  console.error('  - VITE_OPENAI_API_KEY');
} else {
  try {
    console.log('🚀 Initializing Full Hedera Agent...');
    
    // Hedera client setup
    const client = Client.forTestnet().setOperator(
      ACCOUNT_ID,
      PrivateKey.fromStringECDSA(PRIVATE_KEY),
    );
    console.log('✅ Hedera client connected to testnet');
    
    // All tool name constants are pre-imported and available
    // Extract all tool names (same as original script)
    const {
      TRANSFER_HBAR_TOOL,
      CREATE_ACCOUNT_TOOL,
      DELETE_ACCOUNT_TOOL,
      UPDATE_ACCOUNT_TOOL,
      SIGN_SCHEDULE_TRANSACTION_TOOL,
      SCHEDULE_DELETE_TOOL,
      APPROVE_HBAR_ALLOWANCE_TOOL,
      TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
    } = toolNames.coreAccountPluginToolNames;
    
    const {
      CREATE_FUNGIBLE_TOKEN_TOOL,
      CREATE_NON_FUNGIBLE_TOKEN_TOOL,
      AIRDROP_FUNGIBLE_TOKEN_TOOL,
      MINT_FUNGIBLE_TOKEN_TOOL,
      MINT_NON_FUNGIBLE_TOKEN_TOOL,
      UPDATE_TOKEN_TOOL,
      DISSOCIATE_TOKEN_TOOL,
      ASSOCIATE_TOKEN_TOOL,
    } = toolNames.coreTokenPluginToolNames;
    
    const {
      CREATE_TOPIC_TOOL,
      SUBMIT_TOPIC_MESSAGE_TOOL,
      DELETE_TOPIC_TOOL,
      UPDATE_TOPIC_TOOL,
    } = toolNames.coreConsensusPluginToolNames;
    
    const {
      GET_ACCOUNT_QUERY_TOOL,
      GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
      GET_HBAR_BALANCE_QUERY_TOOL,
    } = toolNames.coreAccountQueryPluginToolNames;
    
    const {
      GET_TOPIC_MESSAGES_QUERY_TOOL,
      GET_TOPIC_INFO_QUERY_TOOL,
    } = toolNames.coreConsensusQueryPluginToolNames;
    
    const {
      GET_TOKEN_INFO_QUERY_TOOL,
      GET_PENDING_AIRDROP_TOOL,
    } = toolNames.coreTokenQueryPluginToolNames;
    
    const { GET_CONTRACT_INFO_QUERY_TOOL } = toolNames.coreEVMQueryPluginToolNames;
    const { GET_TRANSACTION_RECORD_QUERY_TOOL } = toolNames.coreTransactionQueryPluginToolNames;
    const { GET_EXCHANGE_RATE_TOOL } = toolNames.coreMiscQueriesPluginsToolNames;
    
    const {
      TRANSFER_ERC721_TOOL,
      MINT_ERC721_TOOL,
      CREATE_ERC20_TOOL,
      TRANSFER_ERC20_TOOL,
      CREATE_ERC721_TOOL,
    } = toolNames.coreEVMPluginToolNames;
    
    console.log('✅ Tool names loaded');
    
    // Create toolkit with ALL tools
    const hederaAgentToolkit = new HederaLangchainToolkit({
      client,
      configuration: {
        tools: [
          // All core tools from original script
          TRANSFER_HBAR_TOOL,
          CREATE_FUNGIBLE_TOKEN_TOOL,
          CREATE_TOPIC_TOOL,
          SUBMIT_TOPIC_MESSAGE_TOOL,
          DELETE_TOPIC_TOOL,
          GET_HBAR_BALANCE_QUERY_TOOL,
          CREATE_NON_FUNGIBLE_TOKEN_TOOL,
          CREATE_ACCOUNT_TOOL,
          DELETE_ACCOUNT_TOOL,
          UPDATE_ACCOUNT_TOOL,
          AIRDROP_FUNGIBLE_TOKEN_TOOL,
          MINT_FUNGIBLE_TOKEN_TOOL,
          MINT_NON_FUNGIBLE_TOKEN_TOOL,
          ASSOCIATE_TOKEN_TOOL,
          GET_ACCOUNT_QUERY_TOOL,
          GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
          GET_TOPIC_MESSAGES_QUERY_TOOL,
          GET_TOKEN_INFO_QUERY_TOOL,
          GET_TRANSACTION_RECORD_QUERY_TOOL,
          GET_EXCHANGE_RATE_TOOL,
          SIGN_SCHEDULE_TRANSACTION_TOOL,
          GET_CONTRACT_INFO_QUERY_TOOL,
          TRANSFER_ERC721_TOOL,
          MINT_ERC721_TOOL,
          CREATE_ERC20_TOOL,
          TRANSFER_ERC20_TOOL,
          CREATE_ERC721_TOOL,
          UPDATE_TOKEN_TOOL,
          GET_PENDING_AIRDROP_TOOL,
          DISSOCIATE_TOKEN_TOOL,
          SCHEDULE_DELETE_TOOL,
          GET_TOPIC_INFO_QUERY_TOOL,
          UPDATE_TOPIC_TOOL,
          APPROVE_HBAR_ALLOWANCE_TOOL,
          TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
        ],
        plugins: [], // Add plugins here if needed
        context: {
          mode: AgentMode.AUTONOMOUS,
        },
      },
    });
    
    const tools = hederaAgentToolkit.getTools();
    console.log(\`✅ Loaded \${tools.length} tools\`);
    
    // Create LLM
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      apiKey: OPENAI_API_KEY,
    });
    console.log('✅ LLM initialized');
    
    // Create agent
    const agent = createAgent({
      model: llm,
      tools: tools,
      systemPrompt: 'You are a helpful assistant with access to Hedera blockchain tools',
      checkpointer: new MemorySaver(),
    });
    console.log('✅ Agent created');
    
    // Create response parser
    const responseParsingService = new ResponseParserService(tools);
    console.log('✅ Response parser ready');
    
    console.log('');
    console.log('🎉 Full Hedera Agent initialized successfully!');
    console.log('');
    console.log('Test the agent with:');
    console.log('');
    console.log('const response = await agent.invoke(');
    console.log('  { messages: [{ role: "user", content: "what is my balance?" }] },');
    console.log('  { configurable: { thread_id: "1" } }');
    console.log(');');
    console.log('');
    console.log('const parsed = responseParsingService.parseNewToolMessages(response);');
    console.log('console.log(response.messages[response.messages.length - 1].content);');
    
  } catch (error) {
    console.error('❌ Error initializing agent:', error.message);
    console.error(error.stack);
  }
}`,
};

// Initialize the application
function init(): void {
  const config = loadConfig();
  const outputDiv = document.getElementById('output') as HTMLElement;
  const output = new OutputManager(outputDiv);

  // Populate config fields
  (document.getElementById('accountId') as HTMLInputElement).value = config.ACCOUNT_ID;
  (document.getElementById('privateKey') as HTMLInputElement).value = config.PRIVATE_KEY;
  (document.getElementById('openaiKey') as HTMLInputElement).value = config.OPENAI_API_KEY;

  // Save config button
  document.getElementById('saveConfig')?.addEventListener('click', () => {
    const newConfig: Config = {
      ACCOUNT_ID: (document.getElementById('accountId') as HTMLInputElement).value,
      PRIVATE_KEY: (document.getElementById('privateKey') as HTMLInputElement).value,
      OPENAI_API_KEY: (document.getElementById('openaiKey') as HTMLInputElement).value,
    };
    saveConfig(newConfig);
    output.success('✅ Configuration saved successfully!');
  });

  // Clear output button
  document.getElementById('clearOutput')?.addEventListener('click', () => {
    output.clear();
  });

  // Execute button
  document.getElementById('executeBtn')?.addEventListener('click', async () => {
    const codeInput = document.getElementById('codeInput') as HTMLTextAreaElement;
    const code = codeInput.value;

    if (!code.trim()) {
      output.error('Please enter some code to execute!');
      return;
    }

    output.info('🚀 Executing code...');
    await executeCode(code, output);
  });

  // Example buttons
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const example = btn.getAttribute('data-example') as keyof typeof examples;
      const codeInput = document.getElementById('codeInput') as HTMLTextAreaElement;
      codeInput.value = examples[example];
    });
  });

  output.log('🎉 Hedera Agent Kit Browser POC initialized!');
  output.log('💡 Try the example buttons or write your own code.');
}

// Execute user code
async function executeCode(code: string, output: OutputManager): Promise<void> {
  try {
    // Create a custom console that redirects to our output
    const customConsole = {
      log: (...args: any[]) => output.log(...args),
      error: (...args: any[]) => output.error(...args),
      info: (...args: any[]) => output.info(...args),
      warn: (...args: any[]) => output.log(...args),
    };

    // Get Vite environment variables
    const viteEnv = {
      VITE_ACCOUNT_ID: import.meta.env.VITE_ACCOUNT_ID,
      VITE_PRIVATE_KEY: import.meta.env.VITE_PRIVATE_KEY,
      VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
    };

    // Prepare all tool names for user code
    const toolNames = {
      coreAccountPluginToolNames,
      coreTokenPluginToolNames,
      coreConsensusPluginToolNames,
      coreAccountQueryPluginToolNames,
      coreConsensusQueryPluginToolNames,
      coreTokenQueryPluginToolNames,
      coreEVMQueryPluginToolNames,
      coreTransactionQueryPluginToolNames,
      coreMiscQueriesPluginsToolNames,
      coreEVMPluginToolNames,
    };

    // Create an async function with access to our modules and config
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    const fn = new AsyncFunction(
      'console',
      'Client',
      'PrivateKey',
      'HederaLangchainToolkit',
      'AgentMode',
      'ChatOpenAI',
      'createAgent',
      'MemorySaver',
      'getConfig',
      'viteEnv',
      'toolNames',
      'ResponseParserService',
      code
    );

    // Execute the code
    await fn(
      customConsole,
      Client,
      PrivateKey,
      HederaLangchainToolkit,
      AgentMode,
      ChatOpenAI,
      createAgent,
      MemorySaver,
      loadConfig,
      viteEnv,
      toolNames,
      ResponseParserService
    );

    output.success('✅ Code executed successfully!');
  } catch (error: any) {
    output.error('❌ Error executing code:');
    output.error(error.message || String(error));
    if (error.stack) {
      output.error('Stack trace:');
      output.error(error.stack);
    }
  }
}

// Start the application
init();
