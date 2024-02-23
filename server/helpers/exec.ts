import { spawn } from 'child_process';

/**
 * Executes a shell command and prints the output to the console.
 * 
 * @param command - The command to execute.
 * @param args - An array of arguments to pass to the command.
 * @returns A Promise that resolves with the exit code of the command.
 */
export function executeCommand(command: string, args: string[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { shell: true });

        if (child.stdout) {
            child.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });
        }

        if (child.stderr) {
            child.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Child process exited with code ${code}`));
            }
        });
    });
}

// Example usage:
// executeCommand('ls', ['-lh', '/usr']).then(() => {
//     console.log('Command executed successfully');
// }).catch((error) => {
//     console.error('Command execution failed:', error);
// });
