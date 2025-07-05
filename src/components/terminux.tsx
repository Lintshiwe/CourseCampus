
"use client";

import * as React from 'react';

const commands: Record<string, string | string[]> = {
    help: [
        'Terminux v1.2 - CourseCampus Shell',
        'Available commands:',
        '  help          - Show this help message',
        '  ls [-la]      - List files in the current directory',
        '  cat <file>    - Display content of a file',
        '  uname -a      - Print system information',
        '  ifconfig      - Display network configuration',
        '  ps aux        - List running processes',
        '  nmap localhost- Scan for open ports',
        '  sudo <cmd>    - Execute a command as superuser',
        '  clear         - Clear the terminal screen',
        '  whoami        - Display current user',
    ],
    'ls': ['secret.txt  passwords.txt  exploit.sh  kernel_log.txt'],
    'ls -la': [
        'total 16',
        'drwxr-xr-x 2 guest guest 4096 Jul 21 10:30 .',
        'drwxr-xr-x 4 root  root  4096 Jul 21 10:28 ..',
        '-rwx--x--x 1 guest guest  134 Jul 21 10:29 exploit.sh',
        '-rw-r--r-- 1 root  root   111 Jul 21 10:29 kernel_log.txt',
        '-rw------- 1 guest guest   42 Jul 21 10:29 passwords.txt',
        '-rw-r----- 1 root  guest  150 Jul 21 10:28 secret.txt',
    ],
    'cat secret.txt': [ 'Access Denied. Try: sudo cat secret.txt' ],
    'cat passwords.txt': [
        'root:x:0:0:root:/root:/bin/bash',
        'guest:x:1000:1000:Guest:/home/guest:/bin/bash',
        '# Hmm, maybe not the actual passwords. Good.',
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
    'cat kernel_log.txt': [
        '[ 0.000000] Linux version 5.15.0-41-generic (buildd@lgw01-amd64-039) ...',
        '[ 0.000001] Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-41-generic root=UUID=... ro quiet splash',
        '[ 0.000002] Kernel command line: BOOT_IMAGE=...',
        '[ 1.234567] usb 1-1: new high-speed USB device number 2 using xhci_hcd',
        '[ 2.345678] audit: type=1400 apparmor="DENIED" operation="open" profile="/usr/sbin/sshd" ...',
    ],
    'whoami': ['guest'],
    'clear': '',
    'uname -a': ['Linux terminux 5.15.0-41-generic #44-Ubuntu SMP Wed Jun 22 14:20:53 UTC 2022 x86_64 x86_64 x86_64 GNU/Linux'],
    'ifconfig': [
        'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
        '        inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255',
        '        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)',
        'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
        '        inet 127.0.0.1  netmask 255.0.0.0',
        '        loop  txqueuelen 1000  (Local Loopback)',
    ],
    'ps aux': [
        'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
        'root           1  0.0  0.1  16856  9380 ?        Ss   10:28   0:01 /sbin/init',
        'root         345  0.0  0.0   2432   780 ?        S    10:28   0:00 /usr/sbin/acpid',
        'root         512  0.0  0.2 263884 12180 ?        Ssl  10:28   0:05 /usr/sbin/sshd -D',
        'guest       1234  0.1  0.5 123456 45678 pts/0    Ss   10:30   0:01 /bin/bash',
        'guest       1250  0.0  0.1  12345  1234 pts/0    R+   10:32   0:00 ps aux',
    ],
    'nmap localhost': [
        'Starting Nmap 7.80 ( https://nmap.org ) at 2024-07-21 10:33 UTC',
        'Nmap scan report for localhost (127.0.0.1)',
        'Host is up (0.00012s latency).',
        'Not shown: 998 closed ports',
        'PORT   STATE SERVICE',
        '22/tcp open  ssh',
        '80/tcp open  http',
        'Nmap done: 1 IP address (1 host up) scanned in 0.08 seconds',
    ],
    'sudo': ['usage: sudo [-h | -K | -k | -V]'],
};

const sudoCommands: Record<string, string[]> = {
    'sudo cat secret.txt': [
        '[sudo] password for guest:',
        'Congratulations, agent.',
        'Your mission, should you choose to accept it, is to secure the network.',
        'This message will self-destruct in five seconds.',
        '5... 4... 3... 2... 1... *poof*',
    ],
    'sudo reboot': [
        '[sudo] password for guest:',
        'Broadcast message from root@terminux (somewhere) (Sun Jul 21 10:40:00 2024):',
        '',
        'The system is going down for reboot NOW!',
        'Connection to terminux closed by remote host.',
        'Connection to terminux closed.',
    ]
}

const banner = [
    '   ____                  _              ',
    '  / __ \\____  _   __   _(_)___ ___  _   __',
    ' / / / / __ \\| | / /  | / __ `__ \\| | / /',
    '/ /_/ / /_/ /| |/ /   | / / / / / /| |/ / ',
    '\\____/ .___/ |___/   _|_/_/ /_/ /_/ |___/  ',
    '    /_/            /___/                  ',
    '',
    'Welcome to Terminux v1.2. Type "help" for commands.'
]

export function Terminux() {
    const [history, setHistory] = React.useState<string[]>(banner);
    const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = React.useState<number>(-1);
    const [input, setInput] = React.useState('');
    const [isPasswordPrompt, setIsPasswordPrompt] = React.useState(false);
    const [commandToRun, setCommandToRun] = React.useState('');
    const endOfHistoryRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);
    
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const processCommand = (command: string) => {
        const trimmedCommand = command.trim();
        let newHistory = [...history, `$ ${command}`];
        
        if (trimmedCommand) {
            setCommandHistory(prev => [trimmedCommand, ...prev]);
            setHistoryIndex(-1);
        } else {
             setHistory(newHistory);
             return;
        }

        if (trimmedCommand === 'clear') {
            setHistory([]);
            return;
        }
        
        let output: string | string[] | undefined;

        if(trimmedCommand.startsWith('sudo ')){
             const sudoKey = `sudo ${trimmedCommand.substring(5).trim()}`;
             output = sudoCommands[sudoKey];
             if(output){
                setCommandToRun(sudoKey);
                setIsPasswordPrompt(true);
                newHistory.push(output[0]); // Push the password prompt
             } else {
                newHistory.push(`sudo: ${trimmedCommand.substring(5).trim()}: command not found`);
             }
        } else {
            output = commands[trimmedCommand];
        }

        if(!output && !newHistory.some(l => l.startsWith('[sudo]'))) {
            output = `Command not found: ${command}`;
        }
        
        if (output) {
            if (Array.isArray(output)) {
                // For sudo commands, we already added the prompt
                if(isPasswordPrompt) {
                     // Do nothing, password prompt is already shown.
                } else {
                    newHistory.push(...output);
                }
            } else {
                newHistory.push(output);
            }
        }
        
        setHistory(newHistory);
    };
    
    const handlePasswordSubmit = () => {
        setIsPasswordPrompt(false);
        let newHistory = [...history];
        
        // Mock password check
        if (commandToRun && sudoCommands[commandToRun]) {
             const output = sudoCommands[commandToRun];
             if (Array.isArray(output)) {
                // The password prompt is already in history, so we skip the first line.
                newHistory.push(...output.slice(1));
            } else {
                newHistory.push(output);
            }
        } else {
            newHistory.push('Sorry, try again.');
        }

        setHistory(newHistory);
        setCommandToRun('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isPasswordPrompt) {
                handlePasswordSubmit();
            } else {
                processCommand(input);
            }
            setInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > -1) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(newIndex >= 0 ? commandHistory[newIndex] : '');
            }
        }
    };

    return (
        <div className="bg-black text-green-400 font-code p-4 rounded-lg h-96 w-full flex flex-col overflow-hidden" onClick={() => inputRef.current?.focus()}>
            <div className="flex-grow overflow-y-auto pr-2">
                {history.map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                        {line}
                    </div>
                ))}
                <div ref={endOfHistoryRef} />
            </div>
            <div className="flex items-center mt-2">
                <span className="text-green-400 mr-2">{isPasswordPrompt ? '' : '$'}</span>
                <input
                    ref={inputRef}
                    type={isPasswordPrompt ? 'password' : 'text'}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none text-green-400 w-full focus:outline-none focus:ring-0"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            </div>
        </div>
    );
}
