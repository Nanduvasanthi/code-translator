const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function debugGCC() {
    const tempDir = os.tmpdir();
    const cFile = path.join(tempDir, 'debug.c');
    const exeFile = path.join(tempDir, 'debug.exe');
    
    const code = '#include <stdio.h>\nint main() {\n    printf("Debug test");\n    return 0;\n}';
    
    console.log('Writing file to:', cFile);
    await fs.writeFile(cFile, code);
    
    return new Promise((resolve) => {
        console.log('Running GCC...');
        const gcc = spawn('gcc', [cFile, '-o', exeFile, '-Wall'], {
            shell: true  // Important for Windows
        });
        
        let stdout = '';
        let stderr = '';
        
        gcc.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('STDOUT:', data.toString());
        });
        
        gcc.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log('STDERR:', data.toString());
        });
        
        gcc.on('close', async (code) => {
            console.log('Exit code:', code);
            console.log('Full STDERR:', stderr);
            
            await fs.unlink(cFile).catch(() => {});
            await fs.unlink(exeFile).catch(() => {});
            
            resolve({ code, stdout, stderr });
        });
        
        gcc.on('error', (err) => {
            console.log('Spawn error:', err);
            resolve({ error: err.message });
        });
    });
}

debugGCC().then(result => console.log('Result:', result));
