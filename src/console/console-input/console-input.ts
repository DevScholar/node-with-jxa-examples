// src/console/console-input/console-input.ts
// Read a line from stdin through JXA's NSFileHandle, exactly the way you
// would in a standalone osascript -l JavaScript script.  The host inherits
// the terminal's stdin (fd 0) from Node, so availableData blocks on the
// real TTY until the user types a line and presses Enter.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('Foundation');

console.log('=== Greeting Program ===');
console.log('Please enter your name: ');

const stdin = $.NSFileHandle.fileHandleWithStandardInput;
// availableData returns everything the terminal has delivered so far (on a
// line-buffered TTY, that's exactly one line including the trailing '\n').
const data = stdin.availableData;
// initWithDataEncoding returns an NSString; ObjC.unwrap gives us a JS string.
const nsLine = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding);
const name = (ObjC.unwrap<string>(nsLine) || '').trim();

if (name !== '') {
    console.log(`Hello, ${name}! Welcome to this program!`);
} else {
    console.log('Hello, friend! Welcome to this program!');
}

console.log('Program ended.');
