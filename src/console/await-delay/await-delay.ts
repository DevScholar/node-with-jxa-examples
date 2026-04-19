// src/console/await-delay/await-delay.ts
// Sleep via JXA's built-in `delay(seconds)` — runs on the host thread, not
// Node's event loop.  The Node side blocks on the IPC round-trip until the
// host wakes up, mirroring how Task.Delay / GLib timeouts are used in the
// sibling node-ps1-dotnet and node-with-gjs examples.
import { delay } from '@devscholar/node-with-jxa';

console.log('0s');
delay(1);
console.log('1s');
delay(1);
console.log('2s');
delay(1);
console.log('3s');
