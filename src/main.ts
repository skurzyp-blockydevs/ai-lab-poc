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

// BrowserChat - Promise-based I/O for CLI-like code patterns
class BrowserChat {
  private chatMessages: HTMLElement;
  private chatInput: HTMLInputElement;
  private sendBtn: HTMLButtonElement;
  private agentStatus: HTMLElement;
  private pendingResolve: ((value: string) => void) | null = null;
  private isRunning: boolean = false;
  private stopRequested: boolean = false;

  constructor() {
    this.chatMessages = document.getElementById('chatMessages') as HTMLElement;
    this.chatInput = document.getElementById('chatInput') as HTMLInputElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.agentStatus = document.getElementById('agentStatus') as HTMLElement;
  }

  // Start the chat session - enables input and sets up handlers
  start(): void {
    this.isRunning = true;
    this.stopRequested = false;
    this.enableInput(true);
    this.setStatus('ready', 'Agent running');
    this.clearWelcome();
  }

  // Stop the chat session
  stop(): void {
    this.stopRequested = true;
    this.isRunning = false;
    this.enableInput(false);
    this.setStatus('inactive', 'Agent stopped');
    // Resolve any pending input with empty string to break the loop
    if (this.pendingResolve) {
      this.pendingResolve('');
      this.pendingResolve = null;
    }
  }

  // Promise-based input - waits for user to submit a message
  async input(prompt?: string): Promise<string> {
    if (this.stopRequested) {
      return '';
    }

    if (prompt) {
      this.log(prompt);
    }

    this.setStatus('ready', 'Waiting for input...');

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  // Called by Send button handler - resolves the pending input promise
  submitInput(text: string): void {
    if (this.pendingResolve) {
      // Add user message to chat
      this.addMessage('user', text);
      this.setStatus('thinking', 'Thinking...');

      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(text);
    }
  }

  // Check if there's a pending input request
  hasPendingInput(): boolean {
    return this.pendingResolve !== null;
  }

  // Log output to chat (agent message)
  log(...args: any[]): void {
    const content = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.addMessage('agent', content);
  }

  // Log error to chat
  error(...args: any[]): void {
    const content = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    this.addMessage('error', `❌ ${content}`);
  }

  private addMessage(type: 'user' | 'agent' | 'error', content: string): void {
    const msg = document.createElement('div');
    msg.className = `chat-message ${type === 'error' ? 'agent' : type}`;

    if (type === 'error') {
      msg.innerHTML = `<span style="color: var(--error);">${content}</span>`;
    } else {
      msg.textContent = content;
    }

    this.chatMessages.appendChild(msg);
    this.scrollToBottom();
  }

  private clearWelcome(): void {
    const welcome = this.chatMessages.querySelector('.chat-welcome');
    if (welcome) {
      welcome.remove();
    }
  }

  private enableInput(enabled: boolean): void {
    this.chatInput.disabled = !enabled;
    this.sendBtn.disabled = !enabled;
  }

  private setStatus(status: 'inactive' | 'ready' | 'thinking' | 'error', text: string): void {
    this.agentStatus.className = `agent-status status-${status}`;
    const statusText = this.agentStatus.querySelector('.status-text') as HTMLElement;
    if (statusText) {
      statusText.textContent = text;
    }
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

  fullAgent: `// 🤖 Full Hedera Agent - CLI-like Pattern
// This code runs a chat loop - just like the CLI version!

const config = getConfig();
const ACCOUNT_ID = config.ACCOUNT_ID || viteEnv.VITE_ACCOUNT_ID;
const PRIVATE_KEY = config.PRIVATE_KEY || viteEnv.VITE_PRIVATE_KEY;
const OPENAI_API_KEY = config.OPENAI_API_KEY || viteEnv.VITE_OPENAI_API_KEY;

if (!ACCOUNT_ID || !PRIVATE_KEY || !OPENAI_API_KEY) {
  chat.error('Please configure credentials first!');
} else {
  chat.log('🚀 Initializing Hedera Agent...');
  
  // Create Hedera client
  const client = Client.forTestnet().setOperator(
    ACCOUNT_ID,
    PrivateKey.fromStringECDSA(PRIVATE_KEY),
  );
  chat.log('✅ Hedera client connected');
  
  // Get tool names - customize which tools to include!
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
  chat.log(\`✅ Loaded \${tools.length} tools\`);
  
  // Create LLM - change the model here if needed!
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    apiKey: OPENAI_API_KEY,
  });
  chat.log('✅ LLM initialized');
  
  // Create agent
  const agent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt: 'You are a helpful Hedera blockchain assistant.',
    checkpointer: new MemorySaver(),
  });
  
  // Response parser for tool data
  const parser = new ResponseParserService(tools);
  
  chat.log('✅ Agent ready!');
  chat.log('');
  chat.log('💬 Type your message below. Type "exit" to stop.');
  
  // Main chat loop - just like CLI!
  while (true) {
    const userInput = await chat.input();
    
    // Handle exit
    if (!userInput || userInput.toLowerCase() === 'exit') {
      chat.log('👋 Goodbye!');
      break;
    }
    
    try {
      const response = await agent.invoke(
        { messages: [{ role: 'user', content: userInput }] },
        { configurable: { thread_id: '1' } },
      );
      
      const parsedData = parser.parseNewToolMessages(response);
      const toolCall = parsedData[0];
      const aiContent = response.messages[response.messages.length - 1].content;
      
      chat.log(aiContent);
      
      if (toolCall?.parsedData?.humanMessage) {
        chat.log('🔧 Tool: ' + toolCall.parsedData.humanMessage);
      }
    } catch (err) {
      chat.error('Error: ' + err.message);
    }
  }
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
  const browserChat = new BrowserChat();

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
    browserChat.start();
    try {
      await executeCode(code, output, browserChat);
    } catch (error: any) {
      // Error already logged in executeCode
    }
    browserChat.stop();
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
    const stopBtn = document.getElementById('stopAgentBtn') as HTMLButtonElement;
    const codeInput = document.getElementById('codeInput') as HTMLTextAreaElement;
    const code = codeInput.value;

    if (!code.trim()) {
      chatManager.addErrorMessage('No code in the editor. Please add agent initialization code first (try the 🤖 Full Agent example).');
      return;
    }

    startBtn.disabled = true;
    startBtn.textContent = '✅ Agent Running';
    if (stopBtn) stopBtn.disabled = false;

    // Start the browser chat (enables input, clears welcome)
    browserChat.start();

    try {
      // Execute the code from the editor - it uses the injected `chat` object
      await executeCode(code, output, browserChat);
    } catch (error: any) {
      chatManager.setStatus('error', 'Error occurred');
      browserChat.error(error.message);
    }

    // Code finished (loop exited or error)
    browserChat.stop();
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Start Agent';
    if (stopBtn) stopBtn.disabled = true;
  });

  // Stop Agent button
  document.getElementById('stopAgentBtn')?.addEventListener('click', () => {
    browserChat.stop();
    const startBtn = document.getElementById('startAgentBtn') as HTMLButtonElement;
    startBtn.disabled = false;
    startBtn.textContent = '🚀 Start Agent';
  });

  // Send button - submits input to the running code
  document.getElementById('sendBtn')?.addEventListener('click', () => {
    const chatInput = document.getElementById('chatInput') as HTMLInputElement;
    const text = chatInput.value.trim();
    if (text && browserChat.hasPendingInput()) {
      chatInput.value = '';
      browserChat.submitInput(text);
    }
  });

  // Enter key to send message
  document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const chatInput = document.getElementById('chatInput') as HTMLInputElement;
      const text = chatInput.value.trim();
      if (text && browserChat.hasPendingInput()) {
        chatInput.value = '';
        browserChat.submitInput(text);
      }
    }
  });

  output.log('🎉 Hedera Agent Kit Browser POC initialized!');
  output.log('💡 Try the example buttons or switch to Agent Chat mode.');
}

// Execute user code with BrowserChat for I/O
async function executeCode(code: string, output: OutputManager, chat: BrowserChat): Promise<void> {
  try {
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
      'chat',           // BrowserChat for I/O
      'console',        // Fallback console (outputs to code panel)
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

    // Create console that outputs to the code panel
    const customConsole = {
      log: (...args: any[]) => output.log(...args),
      error: (...args: any[]) => output.error(...args),
      info: (...args: any[]) => output.info(...args),
      warn: (...args: any[]) => output.log(...args),
    };

    // Execute the code
    await fn(
      chat,             // BrowserChat instance
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

    output.success('✅ Code execution completed.');
  } catch (error: any) {
    output.error('❌ Error executing code:');
    output.error(error.message || String(error));
    throw error; // Re-throw so the caller can handle it
  }
}

// Start the application
init();
