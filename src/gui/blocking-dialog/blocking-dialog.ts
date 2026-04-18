// src/gui/blocking-dialog/blocking-dialog.ts
// Cocoa equivalent of WinForms Form.ShowDialog():
// an NSAlert with an NSTextField accessory view.  `runModal` blocks the
// current thread until the user clicks OK / Cancel / closes — sequential
// code, no async/await.  No NSApp.run() needed: NSAlert pumps its own
// modal session on top of the main run loop.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

console.log('--- Blocking Dialog Example ---');
console.log('Showing dialog to get user input...\n');

// Without an activation policy the alert may pop up behind other windows.
const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);
app.activateIgnoringOtherApps(true);

const alert = $.NSAlert.alloc.init;
alert.setMessageText($.NSString.stringWithUTF8String('Computer Brand Input'));
alert.setInformativeText($.NSString.stringWithUTF8String('Please enter your computer brand:'));
alert.addButtonWithTitle($.NSString.stringWithUTF8String('OK'));
alert.addButtonWithTitle($.NSString.stringWithUTF8String('Cancel'));

const entry = $.NSTextField.alloc.initWithFrame($.NSMakeRect(0, 0, 300, 24));
alert.setAccessoryView(entry);

// runModal returns immediately after the user dismisses the alert.
// NSAlertFirstButtonReturn = 1000 (OK), NSAlertSecondButtonReturn = 1001 (Cancel).
const response = alert.runModal;
const ok = response == 1000;

if (ok) {
    const brand = ObjC.unwrap<string>(entry.stringValue).trim();
    if (brand !== '') {
        console.log(`You are using a ${brand} computer.`);
    } else {
        console.log("You didn't enter a computer brand.");
    }
} else {
    console.log('Dialog was cancelled.');
}

console.log('\nProgram ended.');
