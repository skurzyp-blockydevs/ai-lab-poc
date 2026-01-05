import type { Monaco } from "@monaco-editor/react";

export const loadCompleteHederaTypes = (monaco: Monaco) => {
  // flexible configuration for now.
  // In a real implementation this would fetch types or have them bundled.
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noImplicitAny: false,
    noUnusedLocals: true,
    noUnusedParameters: true,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
  });

  // Adding some basic Hedera globals for auto-completion if possible
  const libSource = `
    declare class Client {
      static forTestnet(): Client;
      setOperator(accountId: string, privateKey: string): Client;
    }
    declare class PrivateKey {
      static fromString(key: string): PrivateKey;
      static fromStringECDSA(key: string): PrivateKey;
    }
    declare const console: {
      log(...args: any[]): void;
      error(...args: any[]): void;
      info(...args: any[]): void;
      warn(...args: any[]): void;
    };
  `;
  monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, 'ts:filename/hedera.d.ts');
};
