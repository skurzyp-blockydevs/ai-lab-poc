import { useState, useCallback } from 'react';
import { MonacoEditorInterface } from './components/MonacoEditor';
import type { SupportedLanguage } from './utils/constants'; // Fix path if needed
// Import original dependencies
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

const DEFAULT_CODE = `import {
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
        // Plugin tools
        // 'example_greeting_tool', // Custom plugins not supported in Playground yet
        // 'example_hbar_transfer_tool',
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
  // console.log('Available plugin tools:');
  // console.log('- example_greeting_tool: Generate personalized greetings');
  // console.log('- example_hbar_transfer_tool: Transfer HBAR to account 0.0.800 (demonstrates transaction strategy)');
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
          \`AI: \${response.messages[response.messages.length - 1].content ?? JSON.stringify(response)}\`,
        );
        // 2. Handle QUERY tool calls
      } else {
        console.log(
          // @ts-ignore
          \`\\nAI: \${response.messages[response.messages.length - 1].content ?? JSON.stringify(response)}\`,
        ); // <- agent response text generated based on the tool call response
        console.log('\\n--- Tool Data ---');
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
`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [inputResolver, setInputResolver] = useState<((value: string) => void) | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('typescript');

  const [activeAgent, setActiveAgent] = useState<any>(null);

  // Mocking load logic for now, or using envs
  const getConfig = (): Config => ({
    ACCOUNT_ID: localStorage.getItem('ACCOUNT_ID') || import.meta.env.VITE_ACCOUNT_ID || '',
    PRIVATE_KEY: localStorage.getItem('PRIVATE_KEY') || import.meta.env.VITE_PRIVATE_KEY || '',
    OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY') || import.meta.env.VITE_OPENAI_API_KEY || '',
  });

  const appendOutput = useCallback((text: string) => {
    setOutput(prev => prev + text + '\n');
  }, []);

  const clearOutput = useCallback(() => {
    setOutput('');
    setActiveAgent(null);
    setIsWaitingForInput(false);
  }, []);

  const handleInput = async (userInput: string) => {
    appendOutput(`> ${userInput}`); // Echo input

    if (inputResolver) {
      inputResolver(userInput);
      setInputResolver(null);
      setIsWaitingForInput(false);
      return;
    }

    if (activeAgent) {
      setIsWaitingForInput(false);
      try {
        // Interactive Agent Loop
        const response = await activeAgent.invoke({ input: userInput });

        // Handle response - assume an object with 'output' or string
        const outputText = response.output || (typeof response === 'string' ? response : JSON.stringify(response));
        appendOutput(outputText);
      } catch (error: any) {
        appendOutput(`❌ Error: ${error.message || String(error)}`);
      } finally {
        // Return to waiting state
        setIsWaitingForInput(true);
      }
    }
  };

  const handleExecute = async (codeOverride?: string) => {
    // Reset state
    setIsExecuting(true);
    setActiveAgent(null);  // Clear previous agent
    setIsWaitingForInput(false);
    setInputResolver(null);

    appendOutput('🚀 Executing code...');

    const codeToExecute = codeOverride || code;

    try {
      const customConsole = {
        log: (...args: any[]) => appendOutput(args.map(a => String(a)).join(' ')),
        error: (...args: any[]) => appendOutput(`❌ ${args.map(a => String(a)).join(' ')}`),
        info: (...args: any[]) => appendOutput(`ℹ️ ${args.map(a => String(a)).join(' ')}`),
        warn: (...args: any[]) => appendOutput(`⚠️ ${args.map(a => String(a)).join(' ')}`),
      };

      const viteEnv = {
        VITE_ACCOUNT_ID: import.meta.env.VITE_ACCOUNT_ID,
        VITE_PRIVATE_KEY: import.meta.env.VITE_PRIVATE_KEY,
        VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
      };

      // --- MOCKS ---

      // Mock Token for process cancellation (optional but good for robustness)
      let cancelled = false;

      // Mock prompts
      const mockPrompts = async (questions: any) => {
        // Determine the type: text, confirm, etc.
        // For simplicity, we assume a single text question or an object with name 'userInput'
        // This matches the user's specific request code:
        // const { userInput } = await prompts({ type: 'text', name: 'userInput', message: 'You' });

        return new Promise((resolve, reject) => {
          if (cancelled) return reject(new Error("Process cancelled"));

          // Display the prompt message
          if (questions.message) {
            appendOutput(`? ${questions.message}`);
          }

          setIsWaitingForInput(true);
          setInputResolver(() => (inputValue: string) => {
            // Return object matching the question name, e.g. { userInput: "value" }
            const key = questions.name || 'value';
            resolve({ [key]: inputValue });
          });
        });
      };


      // Sync global process.env for libraries (like LangChain) that access it directly
      if (typeof process !== 'undefined' && process.env) {
        Object.assign(process.env, {
          OPENAI_API_KEY: getConfig().OPENAI_API_KEY,
          ACCOUNT_ID: getConfig().ACCOUNT_ID,
          PRIVATE_KEY: getConfig().PRIVATE_KEY,
          ...viteEnv
        });
      }

      // Mock process for the user script scope
      const mockProcess = {
        env: {
          ACCOUNT_ID: getConfig().ACCOUNT_ID,
          PRIVATE_KEY: getConfig().PRIVATE_KEY,
          OPENAI_API_KEY: getConfig().OPENAI_API_KEY,
          ...viteEnv
        },
        stdout: {
          write: (data: string) => {
            console.log(data);
            return true;
          }
        },
        exit: (code?: number) => {
          throw new Error(`Process exited with code ${code}`);
        }
      };

      // Mock dotenv
      const mockDotenv = {
        config: () => { }
      };


      // Mock require for CommonJS modules (transpiled from TS)
      const mockRequire = (moduleName: string) => {
        switch (moduleName) {
          case '@hashgraph/sdk':
            return { Client, PrivateKey };
          case 'hedera-agent-kit':
            return {
              AgentMode,
              HederaLangchainToolkit,
              ResponseParserService,
              coreAccountPluginToolNames,
              coreTokenPluginToolNames,
              coreConsensusPluginToolNames,
              coreAccountQueryPluginToolNames,
              coreConsensusQueryPluginToolNames,
              coreTokenQueryPluginToolNames,
              coreEVMQueryPluginToolNames,
              coreTransactionQueryPluginToolNames,
              coreMiscQueriesPluginsToolNames,
              coreEVMPluginToolNames
            };
          case 'prompts':
            // Return the mockPrompts function we defined above
            return mockPrompts;
          case 'dotenv':
            return mockDotenv;
          case 'langchain':
            return { createAgent };
          case '@langchain/core/tools':
            // StructuredToolInterface is mostly a type, but if referenced as value, return empty object/class
            return { StructuredToolInterface: class { } };
          case '@langchain/openai':
            return { ChatOpenAI };
          case '@langchain/langgraph':
            return { MemorySaver };
          default:
            console.warn(`Module ${moduleName} not found in mockRequire, returning empty object.`);
            return {};
        }
      };

      const mockExports = {};

      console.log("Executing Code:\n", codeToExecute);

      // Create Async Function
      const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
      const fn = new AsyncFunction(
        'console',
        'require',
        'exports',
        'getConfig',
        'process',
        codeToExecute
      );

      const result = await fn(
        customConsole,
        mockRequire,
        mockExports,
        getConfig,
        mockProcess
      );

      // Interaction Loop Logic
      if (result && typeof result.invoke === 'function') {
        setActiveAgent(result);
        setIsWaitingForInput(true);
        appendOutput('\n🤖 Active Agent detected. You can now chat with it below.\n');
      }

    } catch (error: any) {
      // Handle expected exit
      if (error.message && error.message.includes('Process exited')) {
        appendOutput(error.message);
      } else {
        appendOutput(`❌ Error executing code: ${error.message || String(error)}`);
        if (error.stack) {
          appendOutput(error.stack);
        }
      }
    } finally {
      setIsExecuting(false);
      // DO NOT clear isWaitingForInput or inputResolver if we just set an active agent
      // setInputResolver should be null unless inside prompts, which it is.
    }
  };

  return (
    <MonacoEditorInterface
      code={code}
      selectedLanguage={selectedLanguage}
      isExecuting={isExecuting}
      isExecuteDisabled={false}
      shouldShowCreateAccount={false}
      output={output}
      onCodeChange={(value) => setCode(value || '')}
      onExecute={handleExecute}
      onShareClick={() => alert('Share clicked')}
      onCopyClick={() => { navigator.clipboard.writeText(code); alert('Copied!'); }}
      onDownloadClick={() => alert('Download clicked')}
      onClearClick={() => setCode('')}
      onClearLastMethodClick={() => { }}
      isClearLastMethodDisabled={true}
      onLanguageClick={setSelectedLanguage}
      onOpenChatClick={() => setIsChatOpen(!isChatOpen)}
      isChatOpen={isChatOpen}
      onClearOutput={clearOutput}
      onCurrentOutputChange={() => { }}
      onHasTabsChange={() => { }}
      // New props
      isWaitingForInput={isWaitingForInput}
      onInput={handleInput}
    />
  );
}