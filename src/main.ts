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

  // Allow external code to set the agent (from code editor)
  setAgent(agent: any, tools: any[]): void {
    this.agent = agent;
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

  fullAgent: `// 🤖 Full Hedera Agent - Editable Configuration
// Execute this code to initialize the agent, then use Agent Chat to interact!

const config = getConfig();
const ACCOUNT_ID = config.ACCOUNT_ID || viteEnv.VITE_ACCOUNT_ID;
const PRIVATE_KEY = config.PRIVATE_KEY || viteEnv.VITE_PRIVATE_KEY;
const OPENAI_API_KEY = config.OPENAI_API_KEY || viteEnv.VITE_OPENAI_API_KEY;

if (!ACCOUNT_ID || !PRIVATE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Please configure credentials first!');
} else {
  console.log('🚀 Initializing Hedera Agent...');
  
  // Create Hedera client
  const client = Client.forTestnet().setOperator(
    ACCOUNT_ID,
    PrivateKey.fromStringECDSA(PRIVATE_KEY),
  );
  console.log('✅ Hedera client connected');
  
  // Get tool names - you can customize which tools to include!
  const { GET_HBAR_BALANCE_QUERY_TOOL } = toolNames.coreAccountQueryPluginToolNames;
  const { TRANSFER_HBAR_TOOL, CREATE_ACCOUNT_TOOL } = toolNames.coreAccountPluginToolNames;
  const { CREATE_TOPIC_TOOL, SUBMIT_TOPIC_MESSAGE_TOOL } = toolNames.coreConsensusPluginToolNames;
  const { CREATE_FUNGIBLE_TOKEN_TOOL, ASSOCIATE_TOKEN_TOOL } = toolNames.coreTokenPluginToolNames;
  const { GET_EXCHANGE_RATE_TOOL } = toolNames.coreMiscQueriesPluginsToolNames;
  
  // Create toolkit - modify this array to add/remove tools!
  const toolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [
        GET_HBAR_BALANCE_QUERY_TOOL,
        TRANSFER_HBAR_TOOL,
        CREATE_ACCOUNT_TOOL,
        CREATE_TOPIC_TOOL,
        SUBMIT_TOPIC_MESSAGE_TOOL,
        CREATE_FUNGIBLE_TOKEN_TOOL,
        ASSOCIATE_TOKEN_TOOL,
        GET_EXCHANGE_RATE_TOOL,
      ],
      plugins: [],
      context: { mode: AgentMode.AUTONOMOUS },
    },
  });
  
  const tools = toolkit.getTools();
  console.log(\`✅ Loaded \${tools.length} tools\`);
  
  // Create LLM - you can change the model here!
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',  // Try 'gpt-4o' for better reasoning
    apiKey: OPENAI_API_KEY,
  });
  console.log('✅ LLM initialized');
  
  // Create agent with custom system prompt - modify as needed!
  const agent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt: 'You are a helpful Hedera blockchain assistant. Help users check balances, transfer HBAR, create tokens, and manage topics.',
    checkpointer: new MemorySaver(),
  });
  console.log('✅ Agent created');
  
  // Register agent with the Chat UI
  registerAgent(agent, tools);
  
  console.log('');
  console.log('🎉 Agent ready! Switch to the Agent Chat tab to start chatting.');
  console.log('');
  console.log('💡 Try asking: "What is my HBAR balance?"');
}`,
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
    await executeCode(code, output, agentManager, chatManager);
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

  // Start Agent button - executes code from the editor
  document.getElementById('startAgentBtn')?.addEventListener('click', async () => {
    const startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
    const codeInput = document.getElementById('codeInput') as HTMLTextAreaElement;
    const code = codeInput.value;

    if (!code.trim()) {
      chatManager.addErrorMessage('No code in the editor. Please add agent initialization code first (try the 🤖 Full Agent example).');
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = '⏳ Starting...';
    chatManager.setStatus('thinking', 'Executing code...');

    try {
      // Execute the code from the editor - it should call registerAgent() to connect to the chat
      await executeCode(code, output, agentManager, chatManager);

      // If the code didn't register an agent, inform the user
      if (!agentManager.isReady()) {
        chatManager.setStatus('inactive', 'Agent not started');
        chatManager.addAgentMessage('⚠️ Code executed, but no agent was registered. Make sure your code calls `registerAgent(agent, tools)` to connect to the chat.');
        startBtn.disabled = false;
        startBtn.textContent = '🚀 Start Agent';
      }
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
async function executeCode(code: string, output: OutputManager, agentManager: AgentManager, chatManager: ChatManager): Promise<void> {
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

    // Function to register agent with the chat UI
    const registerAgent = (agent: any, tools: any[]) => {
      agentManager.setAgent(agent, tools);
      chatManager.setStatus('ready', 'Agent ready');
      chatManager.enableInput(true);
      chatManager.clearWelcome();
      chatManager.addAgentMessage('🤖 Agent initialized from code editor! You can now chat with me.');

      // Update sidebar button states
      const startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
      const stopBtn = document.getElementById('stopAgentBtn') as HTMLButtonElement;
      if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = '✅ Agent Running';
      }
      if (stopBtn) stopBtn.disabled = false;
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
      'registerAgent',
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
      ResponseParserService,
      registerAgent
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
