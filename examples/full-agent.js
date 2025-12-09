// Browser-compatible version of the Hedera Agent Kit script
// This demonstrates creating a full agent with all tools

// Get configuration
const config = getConfig();

if (!config.ACCOUNT_ID || !config.PRIVATE_KEY || !config.OPENAI_API_KEY) {
    console.error('❌ Please configure all credentials first:');
    console.error('- Account ID');
    console.error('- Private Key');
    console.error('- OpenAI API Key');
} else {
    try {
        console.log('🚀 Initializing Hedera Agent...');

        // Hedera client setup (Testnet by default)
        const client = Client.forTestnet().setOperator(
            config.ACCOUNT_ID,
            PrivateKey.fromStringECDSA(config.PRIVATE_KEY),
        );

        console.log('✅ Hedera client created');

        // Get all the available tool names
        const {
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
        } = await import('hedera-agent-kit');

        const {
            TRANSFER_HBAR_TOOL,
            GET_HBAR_BALANCE_QUERY_TOOL,
        } = coreAccountQueryPluginToolNames;

        const { CREATE_TOPIC_TOOL } = coreConsensusPluginToolNames;
        const { CREATE_FUNGIBLE_TOKEN_TOOL } = coreTokenPluginToolNames;

        console.log('✅ Tool names loaded');

        // Prepare Hedera toolkit
        const hederaAgentToolkit = new HederaLangchainToolkit({
            client,
            configuration: {
                tools: [
                    TRANSFER_HBAR_TOOL,
                    GET_HBAR_BALANCE_QUERY_TOOL,
                    CREATE_TOPIC_TOOL,
                    CREATE_FUNGIBLE_TOKEN_TOOL,
                ],
                plugins: [],
                context: {
                    mode: AgentMode.AUTONOMOUS,
                },
            },
        });

        console.log('✅ Hedera toolkit created');

        // Fetch tools from toolkit
        const tools = hederaAgentToolkit.getTools();
        console.log(`✅ Loaded ${tools.length} tools`);

        // Create LLM
        const llm = new ChatOpenAI({
            model: 'gpt-4o-mini',
            apiKey: config.OPENAI_API_KEY,
        });

        console.log('✅ LLM initialized');

        // Create agent
        const agent = createAgent({
            model: llm,
            tools: tools,
            systemPrompt: 'You are a helpful assistant with access to Hedera blockchain tools',
            checkpointer: new MemorySaver(),
        });

        console.log('✅ Agent created successfully!');
        console.log('');
        console.log('🎉 Hedera Agent is ready!');
        console.log('');
        console.log('You can now interact with the agent by calling:');
        console.log('');
        console.log('const response = await agent.invoke(');
        console.log('  { messages: [{ role: "user", content: "what is my balance?" }] },');
        console.log('  { configurable: { thread_id: "1" } }');
        console.log(');');
        console.log('');
        console.log('Available tools:', tools.map(t => t.name).join(', '));

    } catch (error) {
        console.error('❌ Error creating agent:', error);
        console.error(error.stack);
    }
}
