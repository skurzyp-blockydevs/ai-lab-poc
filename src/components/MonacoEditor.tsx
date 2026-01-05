import React, { useRef, useState, useEffect } from 'react';
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import { Code, ZoomIn, ZoomOut } from 'lucide-react';

import { loadCompleteHederaTypes } from "@/utils/load-hedera-types";
import { extraLibs } from "./monaco-types";
import { PlaygroundOutput } from "./PlaygroundOutput";
import { PlaygroundToolbar } from "./PlaygroundToolbar";
import { TooltipComponent } from "./Tooltip";
import Button from "./ui/Button";
import type { SupportedLanguage } from "@/utils/constants";

// Mocking the store for now as we don't have access to "@/stores/account" source usually, 
// but if the user provided codebase has it, we should check.
// The user provided 'src/main.ts' but no stores. I'll maintain a local state for fontSize.

interface MonacoEditorProps {
    code: string;
    selectedLanguage: SupportedLanguage;
    isExecuting: boolean;
    isExecuteDisabled: boolean;
    shouldShowCreateAccount: boolean;
    output: string;
    onCodeChange: (value: string | undefined) => void;
    onExecute: (code?: string) => void;
    onContentChange?: () => void;
    onShareClick: () => void;
    onCopyClick: () => void;
    onDownloadClick: () => void;
    onClearClick: () => void;
    onClearLastMethodClick: () => void;
    isClearLastMethodDisabled: boolean;
    onLanguageClick: (language: SupportedLanguage) => void;
    onOpenChatClick: () => void;
    isChatOpen: boolean;
    onClearOutput?: () => void;
    onCurrentOutputChange?: (output: string) => void;
    onHasTabsChange?: (hasTabs: boolean) => void;
    isWaitingForInput?: boolean;
    onInput?: (input: string) => void;
}

export const MonacoEditorInterface: React.FC<MonacoEditorProps> = ({
    code,
    selectedLanguage,
    isExecuting,
    isExecuteDisabled,
    shouldShowCreateAccount,
    output,
    onCodeChange,
    onExecute,
    onShareClick,
    onCopyClick,
    onDownloadClick,
    onClearClick,
    onClearLastMethodClick,
    isClearLastMethodDisabled,
    onLanguageClick,
    onOpenChatClick,
    isChatOpen,
    onClearOutput,
    onCurrentOutputChange,
    onHasTabsChange,
    isWaitingForInput,
    onInput,
}) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [fontSize, setFontSize] = useState(14); // Default font size

    // Resize logic
    const [editorHeight, setEditorHeight] = useState(400);
    const [outputHeight, setOutputHeight] = useState(200);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const MIN_EDITOR_HEIGHT = 200;
    const MIN_OUTPUT_HEIGHT = 100;

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        if (monaco?.languages?.typescript) {
            loadCompleteHederaTypes(monaco);

            // Inject generated types for libraries
            // Configure compiler options for node-like resolution
            const compilerOptions = {
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                module: monaco.languages.typescript.ModuleKind.CommonJS,
                noEmit: false, // Must be false to allow getEmitOutput to work
                esModuleInterop: true,
                typeRoots: ["node_modules/@types"],
                baseUrl: ".",
                paths: {
                    "*": ["*", "node_modules/*"]
                }
            };

            monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

            // Inject generated types for libraries
            extraLibs.forEach(lib => {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath);
                monaco.languages.typescript.javascriptDefaults.addExtraLib(lib.content, lib.filePath);
            });

            // Ignore some TS/JS diagnostics that might be annoying in playground
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                diagnosticCodesToIgnore: [2580, 2307, 1375, 1378],
            });
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                diagnosticCodesToIgnore: [2580, 2307, 1375, 1378],
            });

            monaco.editor.defineTheme("vs-dark-custom", {
                base: "vs-dark",
                inherit: true,
                rules: [],
                colors: {
                    "editor.background": "#00000000",
                },
            });
            monaco.editor.setTheme("vs-dark-custom");
        }
    };

    const handleExecuteClick = async () => {
        if (!editorRef.current || !monacoRef.current) {
            onExecute();
            return;
        }

        // Transpile if TypeScript OR JavaScript (to verify/transform imports)
        if (selectedLanguage === 'typescript' || selectedLanguage === 'javascript') {
            try {
                const model = editorRef.current.getModel();
                if (!model) {
                    throw new Error("Editor model not found");
                }

                // Get the worker
                const worker = await monacoRef.current.languages.typescript.getTypeScriptWorker();
                const client = await worker(model.uri);

                // Get the JS output
                const result = await client.getEmitOutput(model.uri.toString());
                const jsCode = result.outputFiles[0]?.text;

                if (jsCode) {
                    onExecute(jsCode);
                } else {
                    console.error("Transpilation failed: No output generated");
                    // Do NOT fallback to raw code execution for imports
                    // onExecute(); 
                    throw new Error("Transpilation failed. Please checks for syntax errors.");
                }
            } catch (error: any) {
                console.error("Transpilation error:", error);
                // Report error to output instead of executing raw code
                // Using a made-up error reporting mechanism if onExecute expects code, 
                // but since App.tsx handles execution, we might need a way to pass errors.
                // However, App.tsx's handleExecute takes code string. 
                // We'll pass a code string that throws an error to be displayed in the output.
                onExecute(`throw new Error("Transpilation Error: ${error.message || String(error)}")`);
            }
        } else {
            onExecute();
        }
    };

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 2, 24));
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 2, 10));
    };

    // Dragging logic
    useEffect(() => {
        // Drag logic is handled in startDragging
    }, [isDragging]);

    const startDragging = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const startY = e.clientY;
        const startEditorHeight = editorHeight;
        const startOutputHeight = outputHeight;

        const onDrag = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newEditorHeight = Math.max(MIN_EDITOR_HEIGHT, startEditorHeight + deltaY);
            const newOutputHeight = Math.max(MIN_OUTPUT_HEIGHT, startOutputHeight - deltaY);

            // Check boundaries - technically we should check if total height is conserved or just flex is handled
            // For now, let's just update both, assuming fixed total height or flex behavior.
            setEditorHeight(newEditorHeight);
            setOutputHeight(newOutputHeight);
        };

        const stopDragging = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDragging);
        };

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDragging);
    };

    const monacoOptions = {
        automaticLayout: true,
        formatOnType: true,
        formatOnPaste: true,
        fontSize: fontSize,
        minimap: {
            enabled: false,
        },
        theme: "vs-dark-custom", // Ensure theme is used
    };

    return (
        <div className="flex h-screen w-full flex-col bg-black-out text-vapor" ref={containerRef}>
            {/* Tab Bar */}
            <div className="flex h-14 items-center border-b border-vapor/30 bg-black-out px-4 text-vapor">
                <div className="flex items-center gap-2 rounded-t px-3 py-1 text-sm bg-foreground/10">
                    <Code className="h-4 w-4" />
                    main.{selectedLanguage === "javascript" ? "js" : selectedLanguage === "java" ? "java" : "rs"}
                </div>

                <PlaygroundToolbar
                    selectedLanguage={selectedLanguage}
                    onLanguageClick={onLanguageClick}
                    onShareClick={onShareClick}
                    onCopyClick={onCopyClick}
                    onDownloadClick={onDownloadClick}
                    onClearClick={onClearClick}
                    onClearLastMethodClick={onClearLastMethodClick}
                    isClearLastMethodDisabled={isClearLastMethodDisabled}
                    onOpenChatClick={onOpenChatClick}
                    isChatOpen={isChatOpen}
                />
            </div>

            {/* Editor Container */}
            <div className="relative flex-1" style={{ height: `${editorHeight}px`, flexBasis: `${editorHeight}px`, flexGrow: 0 }}>
                {/* Editor Controls */}
                <div className="absolute right-6 top-4 z-[5] flex gap-2">
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-vapor hover:bg-primary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Decrease font size"
                        onClick={decreaseFontSize}
                    >
                        <ZoomOut className="h-5 w-5 text-vapor" />
                    </button>
                    <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-vapor hover:bg-primary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="Increase font size"
                        onClick={increaseFontSize}
                    >
                        <ZoomIn className="h-5 w-5 text-vapor" />
                    </button>
                </div>

                {/* Monaco Editor */}
                <div className="h-full w-full bg-foreground">
                    <Editor
                        height="100%"
                        defaultLanguage={selectedLanguage} // or language
                        language={selectedLanguage}
                        value={code}
                        options={monacoOptions}
                        onChange={onCodeChange}
                        onMount={handleEditorMount}
                        theme="vs-dark" // Initial theme before custom one loads
                    />
                </div>

                {/* Execute Button */}
                <div className="absolute bottom-4 right-6 z-10">
                    {shouldShowCreateAccount ? (
                        <Button variant="solidPrimary" size="sm" onClick={handleExecuteClick}>
                            Create Account
                        </Button>
                    ) : isExecuteDisabled ? (
                        <TooltipComponent text="You must add an account to execute code">
                            <Button variant="solidPrimary" size="sm" disabled>
                                Execute
                            </Button>
                        </TooltipComponent>
                    ) : (
                        <Button
                            variant="solidPrimary"
                            size="md"
                            disabled={isExecuting || isExecuteDisabled}
                            loading={isExecuting}
                            onClick={handleExecuteClick}
                        >
                            Execute
                        </Button>
                    )}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="flex h-1 cursor-row-resize items-center justify-center border-y bg-vapor/30 transition-colors hover:bg-primary/80"
                onMouseDown={startDragging}
            >
                <div className="h-1 w-full bg-vapor/30"></div>
            </div>

            {/* Output Panel */}
            <div
                className="flex flex-col bg-black-out flex-grow"
                style={{ height: `${outputHeight}px`, flexBasis: `${outputHeight}px` }}
            >
                <PlaygroundOutput
                    output={output}
                    selectedLanguage={selectedLanguage}
                    onClearAll={onClearOutput}
                    onCurrentOutputChange={onCurrentOutputChange}
                    onHasTabsChange={onHasTabsChange}
                    isWaitingForInput={isWaitingForInput}
                    onInput={onInput}
                />
            </div>
        </div>
    );
};
