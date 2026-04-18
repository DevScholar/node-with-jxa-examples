// src/console/await-delay/await-delay.ts
// Node's setTimeout works unchanged under node-with-jxa — no Cocoa needed,
// so we don't even import a framework.  The JXA host stays idle; Node's
// watchdog exits the process once the top-level await chain finishes.
export {}; // make this a module so top-level `await` is allowed

console.log('0s');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('1s');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('2s');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('3s');
