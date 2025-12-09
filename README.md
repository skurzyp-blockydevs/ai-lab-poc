# Hedera Agent Kit - Browser Execution POC

A proof-of-concept demonstrating that Hedera Agent Kit code can be executed directly in the browser.

## 🎯 What This Proves

This POC validates that:
- ✅ Hedera SDK and LangChain libraries can be bundled for browser use
- ✅ User-written code can execute with access to these libraries
- ✅ No WebAssembly compilation needed (runs native JavaScript)
- ✅ Console output can be captured and displayed
- ✅ Configuration can be managed client-side

## 🚀 Quick Start

### Prerequisites

- Node.js (v20.19+ or v22.12+ recommended, though v22.8.0 works)
- npm

### Installation & Running

```bash
# Navigate to project directory
cd /home/stanislawkurzyp/Documents/arianelabs/monaco-hak

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Open your browser to: **http://localhost:5173**

## 📖 How to Use

### 1. Configure Credentials (Optional)

In the Configuration panel, enter:
- **Hedera Account ID**: Your testnet account (e.g., `0.0.xxxxx`)
- **Private Key**: Your ECDSA private key (e.g., `0x...`)
- **OpenAI API Key**: Your OpenAI API key (e.g., `sk-proj-...`)

Click **💾 Save Configuration** to persist.

### 2. Try Quick Examples

Click any example button:
- **Hello World** - Basic console output test
- **Get Balance** - Configuration check example
- **Create Client** - Hedera SDK usage example

**FULL WORKING EXAMPLE TO TEST AGENT**
```javascript
// Full Hedera Agent with ALL Tools (Browser Version)
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
    console.log(`✅ Loaded ${tools.length} tools`);
    
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
    
     const response = await agent.invoke(
        { messages: [{ role: 'user', content: 'create a topic with memo "ADSFGHKJ"' }] },
        { configurable: { thread_id: '1' } },
      );
    const parsed = responseParsingService.parseNewToolMessages(response);
    console.log(response.messages[response.messages.length - 1].content)
    
  } catch (error) {
    console.error('❌ Error initializing agent:', error.message);
    console.error(error.stack);
  }
}
```

### 3. Execute Code

Click **▶️ Execute Code** to run the code in the editor.

Results appear in the **Console Output** panel.

### 4. Write Custom Code

You can write your own code using these pre-imported modules:

```javascript
// Available modules:
Client          // from @hashgraph/sdk
PrivateKey      // from @hashgraph/sdk
HederaLangchainToolkit  // from hedera-agent-kit
AgentMode       // from hedera-agent-kit
ChatOpenAI      // from @langchain/openai
createAgent     // from langchain
MemorySaver     // from @langchain/langgraph
getConfig()     // Access saved configuration
```

**Example:**

```javascript
// Get configuration
const config = getConfig();

// Create Hedera client
const client = Client.forTestnet();
console.log('✅ Client created for testnet');

// Access account ID
console.log('Account:', config.ACCOUNT_ID);
```

## 🏗️ Architecture

### Technology Stack

- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **@hashgraph/sdk** - Hedera blockchain SDK
- **hedera-agent-kit** - AI agent toolkit
- **langchain** + **@langchain/*** - AI framework

### How It Works

1. **Bundling**: Vite bundles all libraries into browser-compatible JavaScript
2. **Code Execution**: User code runs via `AsyncFunction` constructor with access to pre-imported modules
3. **Console Redirection**: Custom console captures output and displays it in the UI
4. **Configuration**: localStorage stores credentials securely in the browser

## 📁 Project Structure

```
monaco-hak/
├── index.html          # Main HTML structure
├── src/
│   ├── main.ts        # Code execution engine & UI logic
│   └── style.css      # Modern dark theme styling
├── package.json       # Dependencies
└── README.md         # This file
```

## 🔒 Security Notes

⚠️ **This is a POC for testing purposes only!**

- Private keys are stored in browser localStorage (not production-safe)
- For production, use wallet integration (HashPack, Blade) instead
- Never use mainnet credentials in this POC

## 🎨 Features

- ✨ Modern dark theme UI
- 📝 Code editor with syntax highlighting
- 📊 Real-time console output
- ⚙️ Persistent configuration storage
- 💡 Quick example templates
- 🗑️ Clear output functionality
- ⚡ Fast execution with error handling

## 🧪 Testing

The POC has been tested with:
- ✅ Basic JavaScript execution
- ✅ Console output (log, error, info)
- ✅ Configuration management
- ✅ Hedera SDK client creation
- ✅ Error handling and stack traces

## 📝 Next Steps for Production

1. **Monaco Editor** - Replace textarea with full-featured editor
2. **Wallet Integration** - Use HashPack/Blade for secure key management
3. **LLM Proxy** - Implement rate-limited proxy for AI providers
4. **Code Splitting** - Optimize bundle size with lazy loading
5. **Sandboxing** - Execute code in Web Workers for security
6. **AI Assistant** - Add LLM-powered coding helper
7. **Agent Chat** - Interface for interacting with running agents

## 📚 Documentation

See [walkthrough.md](file:///home/stanislawkurzyp/.gemini/antigravity/brain/bb9833b1-d215-44bb-98d7-870cd49bcc0c/walkthrough.md) for detailed testing results and implementation details.

## 🤝 Contributing

This is a proof-of-concept. For the full Hedera Agent Kit project, visit:
- GitHub: [hedera-agent-kit](https://github.com/hashgraph/hedera-agent-kit-js)
- npm: [hedera-agent-kit](https://www.npmjs.com/package/hedera-agent-kit)

## 📄 License

Apache 2.0
