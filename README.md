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

### How It Works - The Architecture

The browser execution environment uses a sophisticated **Dependency Injection & Transpilation** system to simulate a Node.js-like environment in the browser.

1.  **Pre-Loading & Bundling**:
    The core libraries (`@hashgraph/sdk`, `hedera-agent-kit`, `langchain`) are imported in `App.tsx` and bundled by Vite. This makes them available in the browser's memory, even though there is no `node_modules` folder at runtime.

2.  **Transpilation (Accessing Hidden Types)**:
    When you execute code, the Monaco Editor uses a built-in TypeScript worker to **transpile** your code from TypeScript/ES Modules (using `import`) to CommonJS (using `require`).
    *   `import { Client } from '@hashgraph/sdk'` ➡️ `const { Client } = require('@hashgraph/sdk')`

3.  **Dependency Injection (The "Magic")**:
    We implement a custom `mockRequire` function that intercepts these `require` calls. Instead of looking for files (which don't exist in the browser), it returns the pre-loaded library instances from memory.
    ```typescript
    const mockRequire = (moduleName) => {
      switch (moduleName) {
        case '@hashgraph/sdk': return { Client, PrivateKey };
        // ... returns other pre-loaded libraries
      }
    }
    ```

4.  **Sandboxed Execution**:
    The transpiled code is wrapped in an `AsyncFunction` constructor, creating a safe execution scope. We pass our `mockRequire` and other environment variables (`process.env`) into this scope, allowing your code to run naturally as if it were in a standard Node.js environment.

### Default Full Agent Code

This is the code loaded by default in the editor. It demonstrates setting up a Hedera Agent with all available tools.

```typescript
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
import { Client, PrivateKey } from '@hashgraph/sdk';
import prompts from 'prompts';
import * as dotenv from 'dotenv';
import { StructuredToolInterface } from '@langchain/core/tools';
import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

dotenv.config();

async function bootstrap(): Promise<void> {
  // Hedera client setup (Testnet by default)
  const client = Client.forTestnet().setOperator(
    process.env.ACCOUNT_ID!,
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY!),
  );

  // all the available tools
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
  const { CREATE_TOPIC_TOOL, SUBMIT_TOPIC_MESSAGE_TOOL, DELETE_TOPIC_TOOL, UPDATE_TOPIC_TOOL } =
    coreConsensusPluginToolNames;
  const {
    GET_ACCOUNT_QUERY_TOOL,
    GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL,
    GET_HBAR_BALANCE_QUERY_TOOL,
  } = coreAccountQueryPluginToolNames;

  const { GET_TOPIC_MESSAGES_QUERY_TOOL, GET_TOPIC_INFO_QUERY_TOOL } =
    coreConsensusQueryPluginToolNames;
  const { GET_TOKEN_INFO_QUERY_TOOL, GET_PENDING_AIRDROP_TOOL } = coreTokenQueryPluginToolNames;
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

  // Prepare Hedera toolkit with core tools AND custom plugin
  const hederaAgentToolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [
        // Core tools
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
      plugins: [], // Add all plugins by default
      context: {
        mode: AgentMode.AUTONOMOUS,
      },
    },
  });

  // Fetch tools from a toolkit
  const tools: StructuredToolInterface[] = hederaAgentToolkit.getTools();

  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
  });


  const agent = createAgent({
    model: llm,
    tools: tools,
    systemPrompt: 'You are a helpful assistant with access to Hedera blockchain tools.',
    checkpointer: new MemorySaver(),
  });

  const responseParsingService = new ResponseParserService(hederaAgentToolkit.getTools());

  console.log('Hedera Agent CLI Chatbot with Plugin Support — type "exit" to quit');
  console.log('');

  while (true) {
    const { userInput } = await prompts({
      type: 'text',
      name: 'userInput',
      message: 'You',
    });

    // Handle early termination
    if (!userInput || ['exit', 'quit'].includes(userInput.trim().toLowerCase())) {
      console.log('Goodbye!');
      break;
    }

    try {
      const response = await agent.invoke(
        { messages: [{ role: 'user', content: userInput }] },
        { configurable: { thread_id: '1' } },
      );

      const parsedToolData = responseParsingService.parseNewToolMessages(response);

      // Assuming a single tool call per response but parsedToolData might contain an array of tool calls made since the last agent.invoke
      const toolCall = parsedToolData[0];

      // 1. Handle case when NO tool was called (simple chat)
      if (!toolCall) {
        console.log(
          // @ts-ignore
          `AI: ${response.messages[response.messages.length - 1].content ?? JSON.stringify(response)}`,
        );
        // 2. Handle QUERY tool calls
      } else {
        console.log(
          // @ts-ignore
          `\nAI: ${response.messages[response.messages.length - 1].content ?? JSON.stringify(response)}`,
        ); // <- agent response text generated based on the tool call response
        console.log('\n--- Tool Data ---');
        console.log('Direct tool response:', toolCall.parsedData.humanMessage); // <- you can use this string for a direct tool human-readable response.
        console.log('Full tool response object:', JSON.stringify(toolCall.parsedData, null, 2)); // <- you can use this object for convenient tool response extraction
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

bootstrap()
  .catch(err => {
    console.error('Fatal error during CLI bootstrap:', err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
```

### 3. Execution Tests

You can test the execution engine with these prompts to verify everything is working correctly.

**Test 1: Simple Console Log**
Verifies that the execution environment and output capture are working.
```javascript
console.log(test)
```

**Test 2: Importing and Inspecting Libraries**
Verifies that the `import` statements are correctly transpiled and that the Dependency Injection system is correctly providing the `hedera-agent-kit` objects.
```typescript
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

## 📁 Project Structure

```
monaco-hak/
├── index.html          # Main HTML structure
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
├── src/
│   ├── App.tsx        # Main application logic & state
│   ├── main.tsx       # Entry point
│   ├── components/    # React UI components (Editor, Toolbar, etc.)
│   ├── utils/         # Helper functions & constants
│   ├── polyfills/     # Node.js polyfills for browser
│   └── style.css      # Modern dark theme styling
└── README.md         # This file
```

## 🔒 Security Notes

⚠️ **This is a POC for testing purposes only!**

- Private keys are stored in browser localStorage (not production-safe)
- For production, use wallet integration (HashPack, Blade) instead
- Never use mainnet credentials in this POC

## 🎨 Features

- ✨ **Monaco Editor Integration** - Full IDE experience with TypeScript support & IntelliSense
- 🤖 **Interactive Agent Chat** - Chat directly with your running AI agents in the output window
- 🛠️ **Full Hedera Agent Kit Support** - Pre-loaded with all Hedera tools and plugins
- 📊 **Rich Console Output** - Real-time log capturing with formatted display
- ⚙️ **Persistent Configuration** - Securely stores API keys and Account IDs locally
- ⚡ **Instant Transpilation** - Logical TypeScript execution in the browser

## 🧪 Testing

The POC has been tested and verified with:
- ✅ TypeScript & JavaScript transpilation and execution
- ✅ Full AI Agent lifecycles (Initialization -> Tool Use -> Response)
- ✅ Hedera Network operations (Testnet)
- ✅ Standard Library Injection (`@hashgraph/sdk`, `langchain`)

## 📝 Next Steps for Production

1. **Wallet Integration** - Use HashPack/Blade for secure key management (removing private key requirement)
2. **Web Worker Sandboxing** - Move execution to a separate thread for better security and performance
3. **LLM Proxy Service** - Hide API keys by routing requests through a backend proxy
4. **Package Optimization** - Implement lazy loading for heavy dependencies
5. **Multi-File Support** - Allow defining and importing from multiple virtual files

## 🤝 Contributing

This is a proof-of-concept. For the full Hedera Agent Kit project, visit:
- GitHub: [hedera-agent-kit](https://github.com/hashgraph/hedera-agent-kit-js)
- npm: [hedera-agent-kit](https://www.npmjs.com/package/hedera-agent-kit)

## 📄 License

Apache 2.0
