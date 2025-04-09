const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

// Replace with the path to your file/module containing the functions
const functionModule = require('./script.js'); // Or './functions.mjs' if using ESModules

console.log(functionModule)

function verifyFunctionIntegrityNode() {
    try {
        const functionNames = Object.keys(functionModule); // Simulates API return like ["myFunc", "doStuff"]
        const hashMap = {};

        console.log(functionNames)

        for (const name of functionNames) {
            const fn = functionModule[name];

            if (typeof fn === 'function') {
                const code = fn.toString();
                const hash = CryptoJS.SHA256(code).toString();
                hashMap[name] = hash;
            } else {
                hashMap[name] = null; // Function not found or not a function
            }
        }

        // Convert the hash map to JSON string
        const jsonString = JSON.stringify(hashMap, null, 2); // pretty-print with 2 spaces

        // Define output path (same directory)
        const outputPath = path.join(__dirname, '../function-hashes.json');

        // Write to file
        fs.writeFileSync(outputPath, jsonString, 'utf8');

        console.log(`Hash map saved to ${outputPath}`);
    } catch (err) {
        console.error(err);
    }
}

// Usage
verifyFunctionIntegrityNode()
