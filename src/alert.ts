// src/alert.ts
// Show a modal NSAlert dialog and report which button the user clicked.
// No NSApp.run() needed — runModal pumps its own modal session.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

// Without an activation policy, alerts may appear behind other windows.
const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);
app.activateIgnoringOtherApps(true);

const alert = $.NSAlert.alloc.init;
alert.setMessageText('Hello from Node.js');
alert.setInformativeText('This NSAlert was constructed and shown via @devscholar/node-with-jxa.');
alert.addButtonWithTitle('OK');
alert.addButtonWithTitle('Cancel');

const response = alert.runModal;
// NSAlertFirstButtonReturn = 1000, NSAlertSecondButtonReturn = 1001
// JXA returns NSModalResponse as a string, so use == for coercion.
console.log('alert response code:', response);
console.log(response == 1000 ? 'You clicked OK.' : 'You clicked Cancel.');
