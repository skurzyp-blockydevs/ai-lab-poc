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

// Agent Manager - handles agent lifecycle
class AgentManager {
  private agent: any = null;
  private responseParser: ResponseParserService | null = null;
  private threadId: string = '1';

  async initialize(config: Config): Promise<void> {
    // Get config from localStorage or Vite env
    const ACCOUNT_ID = config.ACCOUNT_ID || import.meta.env.VITE_ACCOUNT_ID;
    const PRIVATE_KEY = config.PRIVATE_KEY || import.meta.env.VITE_PRIVATE_KEY;
    const OPENAI_API_KEY = config.OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

    if (!ACCOUNT_ID || !PRIVATE_KEY || !OPENAI_API_KEY) {
      throw new Error('Missing credentials. Please configure Account ID, Private Key, and OpenAI API Key.');
    }

    // Create Hedera client
    const client = Client.forTestnet().setOperator(
      ACCOUNT_ID,
      PrivateKey.fromStringECDSA(PRIVATE_KEY),
    );

    // Get all tool names
    const {
      TRANSFER_HBAR_TOOL,
      CREATE_ACCOUNT_TOOL,
      DELETE_ACCOUNT_TOOL,
      UPDATE_ACCOUNT_TOOL,
      SIGN_SCHEDULE_TRANSACTION_TOOL,
      SCHEDULE_DELETE_TOOL,
      APPROVE_HBAR_ALLOWANCE_TOOL,
      TRANSFER_HBAR_WITH_ALLOWANCE_TOOL,
    } = coreAccountPluginToolNames;

    const {
      CREATE_FUNGIBLE_TOKEN_TOOL,
      CREATE_NON_FUNGIBLE_TOKEN_TOOL,
      AIRDROP_FUNGIBLE_TOKEN_TOOL,
      MINT_FUNGIBLE_TOKEN_TOOL,
      MINT_NON_FUNGIBLE_TOKEN_TOOL,
      UPDATE_TOKEN_TOOL,
      DISSOCIATE_TOKEN_TOOL,
      ASSOCIATE_TOKEN_TOOL,
    } = coreTokenPluginToolNames;

    const {
      CREATE_TOPIC_TOOL,
      SUBMIT_TOPIC_MESSAGE_TOOL,
      DELETE_TOPIC_TOOL,
      UPDATE_TOPIC_TOOL,
    } = coreConsensusPluginToolNames;

    const {
      GET_ACCOUNT_QUERY_TOOL,
      GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
      GET_HBAR_BALANCE_QUERY_TOOL,
    } = coreAccountQueryPluginToolNames;

    const {
      GET_TOPIC_MESSAGES_QUERY_TOOL,
      GET_TOPIC_INFO_QUERY_TOOL,
    } = coreConsensusQueryPluginToolNames;

    const {
      GET_TOKEN_INFO_QUERY_TOOL,
      GET_PENDING_AIRDROP_TOOL,
    } = coreTokenQueryPluginToolNames;

    const { GET_CONTRACT_INFO_QUERY_TOOL } = coreEVMQueryPluginToolNames;
    const { GET_TRANSACTION_RECORD_QUERY_TOOL } = coreTransactionQueryPluginToolNames;
    const { GET_EXCHANGE_RATE_TOOL } = coreMiscQueriesPluginsToolNames;

    const {
      TRANSFER_ERC721_TOOL,
      MINT_ERC721_TOOL,
      CREATE_ERC20_TOOL,
      TRANSFER_ERC20_TOOL,
      CREATE_ERC721_TOOL,
    } = coreEVMPluginToolNames;

    // Create toolkit with all tools
    const hederaAgentToolkit = new HederaLangchainToolkit({
      client,
      configuration: {
        tools: [
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
        plugins: [],
        context: {
          mode: AgentMode.AUTONOMOUS,
        },
      },
    });

    const tools = hederaAgentToolkit.getTools();

    // Create LLM
    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      apiKey: OPENAI_API_KEY,
    });

    // Create agent
    this.agent = createAgent({
      model: llm,
      tools: tools,
      systemPrompt: 'You are a helpful assistant with access to Hedera blockchain tools. Help users interact with the Hedera network.',
      checkpointer: new MemorySaver(),
    });

    // Create response parser
    this.responseParser = new ResponseParserService(tools);
  }

  async sendMessage(message: string): Promise<{ content: string; toolData?: any }> {
    if (!this.agent || !this.responseParser) {
      throw new Error('Agent not initialized. Please start the agent first.');
    }

    const response = await this.agent.invoke(
      { messages: [{ role: 'user', content: message }] },
      { configurable: { thread_id: this.threadId } },
    );

    const parsedToolData = this.responseParser.parseNewToolMessages(response);
    const toolCall = parsedToolData[0];
    const aiContent = response.messages[response.messages.length - 1].content || '';

    return {
      content: aiContent,
      toolData: toolCall?.parsedData || null,
    };
  }

  isReady(): boolean {
    return this.agent !== null;
  }

  stop(): void {
    this.agent = null;
    this.responseParser = null;
  }
}

// Chat Manager - handles chat UI
class ChatManager {
  private chatMessages: HTMLElement;
  private agentStatus: HTMLElement;
  private chatInput: HTMLInputElement;
  private sendBtn: HTMLButtonElement;
  private startBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;

  constructor() {
    this.chatMessages = document.getElementById('chatMessages') as HTMLElement;
    this.agentStatus = document.getElementById('agentStatus') as HTMLElement;
    this.chatInput = document.getElementById('chatInput') as HTMLInputElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stopAgentBtn') as HTMLButtonElement;
  }

  setStatus(status: 'inactive' | 'ready' | 'thinking' | 'error', text: string): void {
    this.agentStatus.className = `agent-status status-${status}`;
    const statusText = this.agentStatus.querySelector('.status-text') as HTMLElement;
    if (statusText) {
      statusText.textContent = text;
    }
  }

  enableInput(enabled: boolean): void {
    this.chatInput.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
    this.startBtn.disabled = enabled;
    this.stopBtn.disabled = !enabled;
  }

  clearWelcome(): void {
    const welcome = this.chatMessages.querySelector('.chat-welcome');
    if (welcome) {
      welcome.remove();
    }
  }

  addUserMessage(content: string): void {
    this.clearWelcome();
    const msg = document.createElement('div');
    msg.className = 'chat-message user';
    msg.textContent = content;
    this.chatMessages.appendChild(msg);
    this.scrollToBottom();
  }

  addAgentMessage(content: string, toolData?: any): void {
    const msg = document.createElement('div');
    msg.className = 'chat-message agent';
    msg.textContent = content;

    if (toolData) {
      const toolDiv = document.createElement('div');
      toolDiv.className = 'tool-response';
      toolDiv.innerHTML = `
        <div class="tool-response-header">🔧 Tool Response</div>
        <div class="tool-response-content">${toolData.humanMessage || JSON.stringify(toolData, null, 2)}</div>
      `;
      msg.appendChild(toolDiv);
    }

    this.chatMessages.appendChild(msg);
    this.scrollToBottom();
  }

  addThinkingMessage(): HTMLElement {
    const msg = document.createElement('div');
    msg.className = 'chat-message thinking';
    msg.textContent = 'Thinking';
    this.chatMessages.appendChild(msg);
    this.scrollToBottom();
    return msg;
  }

  removeThinkingMessage(msg: HTMLElement): void {
    if (msg && msg.parentNode) {
      msg.remove();
    }
  }

  addErrorMessage(error: string): void {
    const msg = document.createElement('div');
    msg.className = 'chat-message agent';
    msg.innerHTML = `<span style="color: var(--error);">❌ Error: ${error}</span>`;
    this.chatMessages.appendChild(msg);
    this.scrollToBottom();
  }

  getInputValue(): string {
    return this.chatInput.value.trim();
  }

  clearInput(): void {
    this.chatInput.value = '';
  }

  private scrollToBottom(): void {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
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

  fullAgent: `// 🤖 Hedera Agent - Interactive Chat Mode
// 
// For an interactive agent experience, use the Agent Chat tab!
// 
// Steps:
// 1. Click the "💬 Agent Chat" tab above
// 2. Click "🚀 Start Agent" to initialize
// 3. Type your questions and chat with the agent
//
// The chat interface supports:
// ✅ Real-time conversations
// ✅ Tool responses with rich formatting
// ✅ Status indicators (thinking, ready, error)
// ✅ Conversation memory

console.log('🤖 For interactive agent conversations, switch to the Agent Chat tab!');
console.log('');
console.log('👉 Click "💬 Agent Chat" in the tabs above');
console.log('👉 Then click "🚀 Start Agent" to begin');
console.log('');
console.log('Example questions you can ask:');
console.log('  • "What is my HBAR balance?"');
console.log('  • "Transfer 1 HBAR to 0.0.12345"');
console.log('  • "Create a topic called My Topic"');
console.log('  • "Get the current exchange rate"');`,
};

// Initialize the application
function init(): void {
  const config = loadConfig();
  const outputDiv = document.getElementById('output') as HTMLElement;
  const output = new OutputManager(outputDiv);

  // Initialize managers
  const agentManager = new AgentManager();
  const chatManager = new ChatManager();

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

  // Mode tab switching
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');

      // Update active tab
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.remove('active');
        if (content.classList.contains(`${mode}-mode`)) {
          content.classList.add('active');
        }
      });
    });
  });

  // Start Agent button
  document.getElementById('startAgentBtn')?.addEventListener('click', async () => {
    const startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
    startBtn.disabled = true;
    startBtn.textContent = '⏳ Starting...';

    chatManager.setStatus('thinking', 'Initializing agent...');

    try {
      const currentConfig = loadConfig();
      await agentManager.initialize(currentConfig);

      chatManager.setStatus('ready', 'Agent ready');
      chatManager.enableInput(true);
      chatManager.clearWelcome();
      chatManager.addAgentMessage('👋 Hello! I\'m your Hedera AI assistant. How can I help you today?');

      startBtn.textContent = '✅ Agent Running';
    } catch (error: any) {
      chatManager.setStatus('error', 'Failed to start');
      chatManager.addErrorMessage(error.message);
      startBtn.disabled = false;
      startBtn.textContent = '🚀 Start Agent';
    }
  });

  // Stop Agent button
  document.getElementById('stopAgentBtn')?.addEventListener('click', () => {
    agentManager.stop();
    chatManager.setStatus('inactive', 'Agent not started');
    chatManager.enableInput(false);

    const startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Start Agent';
  });

  // Send message function
  async function sendMessage() {
    const message = chatManager.getInputValue();
    if (!message) return;

    if (!agentManager.isReady()) {
      chatManager.addErrorMessage('Please start the agent first.');
      return;
    }

    chatManager.addUserMessage(message);
    chatManager.clearInput();
    chatManager.setStatus('thinking', 'Thinking...');

    const thinkingMsg = chatManager.addThinkingMessage();

    try {
      const response = await agentManager.sendMessage(message);
      chatManager.removeThinkingMessage(thinkingMsg);
      chatManager.addAgentMessage(response.content, response.toolData);
      chatManager.setStatus('ready', 'Agent ready');
    } catch (error: any) {
      chatManager.removeThinkingMessage(thinkingMsg);
      chatManager.addErrorMessage(error.message);
      chatManager.setStatus('error', 'Error occurred');

      // Reset to ready after a delay
      setTimeout(() => {
        if (agentManager.isReady()) {
          chatManager.setStatus('ready', 'Agent ready');
        }
      }, 3000);
    }
  }

  // Send button click
  document.getElementById('sendBtn')?.addEventListener('click', sendMessage);

  // Enter key to send message
  document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  output.log('🎉 Hedera Agent Kit Browser POC initialized!');
  output.log('💡 Try the example buttons or switch to Agent Chat mode.');
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
