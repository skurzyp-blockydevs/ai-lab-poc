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
cd monaco-hak

# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

Open your browser to: **http://localhost:5173**

## 📖 How to Use

### 1. Configure Credentials

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_ACCOUNT_ID="0.0.xxxxx"
VITE_PRIVATE_KEY="0x..."
VITE_OPENAI_API_KEY="sk-..."
```

These variables are loaded automatically by the application.

### 2. Try Quick Examples

**FULL WORKING EXAMPLE TO TEST AGENT IS LOADED AS DEFAULT**

You can also try the following quick examples:
```
console.log('test')
```
```
import {
  AgentMode,
  coreAccountPluginToolNames,
  coreAccountQueryPluginToolNames,
  coreConsensusPluginToolNames,
  coreConsensusQueryPluginToolNames,
  coreEVMPluginToolNames,
  coreEVMQueryPluginToolNames,
  coreMiscQueriesPluginsToolNames,
  coreTokenPluginToolNames,
  coreTokenQueryPluginToolNames,
  coreTransactionQueryPluginToolNames,
  HederaLangchainToolkit,
  ResponseParserService,
} from 'hedera-agent-kit';

console.log(JSON.stringify(coreTokenPluginToolNames, null, 2))
```

### 3. Execute Code

Click **▶️ Execute Code** to run the code in the editor.

Results appear in the **Console Output** panel.

### 4. Write Custom Code

You can write your own code using these pre-imported modules:

```javascript
// Available modules:
Client                  // from @hashgraph/sdk
PrivateKey              // from @hashgraph/sdk
HederaLangchainToolkit  // from hedera-agent-kit
AgentMode               // from hedera-agent-kit
ResponseParserService   // from hedera-agent-kit
ChatOpenAI              // from @langchain/openai
createAgent             // from langchain
MemorySaver             // from @langchain/langgraph
getConfig()             // Access saved configuration
viteEnv                 // Access environment variables
toolNames               // Access all plugin tool names
console                 // Custom console object
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
- **React** - UI framework
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code-like editor experience
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
│   ├── App.tsx        # Main application component
│   ├── main.tsx       # Entry point
│   ├── components/    # React components (MonacoEditor, etc.)
│   ├── utils/         # Utility functions
│   ├── style.css      # Global styles & Tailwind directives
│   └── polyfills/     # Browser polyfills for Node.js modules
├── public/            # Static assets
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── README.md          # This file
```

## 🔒 Security Notes

⚠️ **This is a POC for testing purposes only!**

- Private keys are stored in browser localStorage (not production-safe)
- For production, use wallet integration (HashPack, Blade) instead
- Never use mainnet credentials in this POC

## 🎨 Features

- ✨ Modern dark theme UI
- 📝 Monaco Editor with syntax highlighting
- �� Real-time console output
- ⚙️ Persistent configuration storage
- 💡 Quick example templates
- 🗑️ Clear output functionality
- ⚡ Fast execution with error handling

## 🧪 Testing

The POC has been tested with:
- ✅ TypeScript execution (transpiled in browser)
- ✅ Console output (log, error, info)
- ✅ Configuration management
- ✅ Hedera SDK client creation
- ✅ Error handling and stack traces

## �� Next Steps for Production

1. **Monaco Editor** - ✅ Implemented
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
