
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

const commands: Record<string, string | string[]> = {
    help: [
        'Available commands:',
        '  help     - Show this help message',
        '  ls       - List files in the current directory',
        '  cat <file> - Display content of a file',
        '  clear    - Clear the terminal screen',
        '  whoami   - Display current user',
    ],
    ls: ['secret.txt  passwords.txt  exploit.sh'],
    'cat secret.txt': [
        'Congratulations, agent.',
        'Your mission, should you choose to accept it, is to secure the network.',
        'This message will self-destruct in five seconds.',
        '5... 4... 3... 2... 1... *poof*',
    ],
    'cat passwords.txt': [
        'Access Denied. Nice try!',
    ],
    'cat exploit.sh': [
        '#!/bin/bash',
        'echo "Hacking in progress..."',
        'for i in {1..100}; do',
        '  echo -ne "Progress: [$i%]\r"',
        '  sleep 0.05',
        'done',
        'echo "\nJust kidding! Stay safe online!"'
    ],
    whoami: ['guest'],
    clear: '',
};

export function Terminux() {
    const [history, setHistory] = React.useState<string[]>(['Welcome to Terminux! Type "help" to see available commands.']);
    const [input, setInput] = React.useState('');
    const endOfHistoryRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const processCommand = (command: string) => {
        if (command === 'clear') {
            setHistory([]);
            return;
        }

        const output = commands[command.toLowerCase()] || `Command not found: ${command}`;
        const newHistory = [...history, `$ ${command}`];
        
        if (Array.isArray(output)) {
            newHistory.push(...output);
        } else {
            newHistory.push(output);
        }
        setHistory(newHistory);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                processCommand(input.trim());
            } else {
                setHistory([...history, '$ ']);
            }
            setInput('');
        }
    };

    return (
        <div className="bg-black text-green-400 font-code p-4 rounded-lg h-96 w-full flex flex-col overflow-hidden">
            <div className="flex-grow overflow-y-auto pr-2">
                {history.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                        {line}
                    </div>
                ))}
                <div ref={endOfHistoryRef} />
            </div>
            <div className="flex items-center mt-2">
                <span className="text-green-400 mr-2">$</span>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none text-green-400 w-full focus:outline-none focus:ring-0"
                    autoFocus
                />
            </div>
        </div>
    );
}
