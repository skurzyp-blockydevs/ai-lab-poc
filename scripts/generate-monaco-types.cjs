
const fs = require('fs');
const path = require('path');

const PACKAGES = [
    'hedera-agent-kit',
    '@hashgraph/sdk',
    'langchain',
    '@langchain/core',
    '@langchain/openai',
    'dotenv',
    '@types/prompts' // treated as 'prompts' logic-wise or just separate
];

const OUTPUT_FILE = path.join(__dirname, '../src/components/monaco-types.ts');

const libs = [];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

PACKAGES.forEach(pkgName => {
    try {
        const pkgRoot = path.join(__dirname, '../node_modules', pkgName);
        if (!fs.existsSync(pkgRoot)) {
            console.warn(`Could not find package ${pkgName} at ${pkgRoot} `);
            return;
        }

        const files = getAllFiles(pkgRoot);
        files.forEach(filePath => {
            // Only include .d.ts, .d.mts, and package.json
            if (filePath.endsWith('.d.ts') || filePath.endsWith('.d.mts') || filePath.endsWith('package.json')) {
                const relativePath = path.relative(path.join(__dirname, '../node_modules'), filePath);
                // Convert backslashes for usage in virtual URI if on Windows (rare here but good practice)
                const virtualPath = `file:///node_modules/${relativePath.replace(/\\/g, '/')}`;

                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    libs.push({
                        content,
                        filePath: virtualPath
                    });
                } catch (readErr) {
                    console.error(`Error reading ${filePath}: ${readErr}`);
                }
            }
        });
        console.log(`Loaded ${libs.length} files (cumulative) after scanning ${pkgName}`);

    } catch (e) {
        console.error(`Error processing ${pkgName}: ${e.message}`);
    }
});

const fileContent = `export const extraLibs = ${JSON.stringify(libs, null, 2)};`;

fs.writeFileSync(OUTPUT_FILE, fileContent);
console.log(`Generated ${OUTPUT_FILE} with ${libs.length} files.`);

