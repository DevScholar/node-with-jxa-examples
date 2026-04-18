// src/gui/prevent-close/prevent-close.ts
// Cocoa equivalent of GTK4's `close-request` interception (akin to
// window.onbeforeunload in the browser).
//
// AppKit fires NSWindowDelegate's `windowShouldClose:` *synchronously* when
// the user clicks the red close button.  Returning false from the delegate
// blocks the close.  Because node-with-jxa routes the call through a sync
// nested run-loop frame, the boolean return value reaches AppKit on the
// same call stack and proxy calls (label.setStringValue, ...) work normally
// inside the handler.

import { $, ObjC, runApp, evalJxa } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

console.log('--- AppKit Prevent Close Demo ---');

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);

// Quit when the last window closes (held at module scope: NSApplication.delegate is weak).
const _appDelegate = evalJxa(`(function() {
    if (!$.NwjxaQuitOnLastClose) {
        ObjC.registerSubclass({
            name: 'NwjxaQuitOnLastClose',
            superclass: 'NSObject',
            methods: {
                'applicationShouldTerminateAfterLastWindowClosed:': {
                    types: ['bool', ['id']],
                    implementation: function() { return true; }
                }
            }
        });
    }
    var d = $.NwjxaQuitOnLastClose.alloc.init;
    $.NSApplication.sharedApplication.delegate = d;
    return d;
})()`);
void _appDelegate;

// --- window --------------------------------------------------------------

const styleMask =
    Number($.NSWindowStyleMaskTitled) |
    Number($.NSWindowStyleMaskClosable) |
    Number($.NSWindowStyleMaskResizable) |
    Number($.NSWindowStyleMaskMiniaturizable);

const win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
    $.NSMakeRect(200, 200, 400, 260),
    styleMask,
    Number($.NSBackingStoreBuffered),
    false
);
win.setTitle($.NSString.stringWithUTF8String('Prevent Close Demo'));

// --- status label --------------------------------------------------------

const statusLabel = $.NSTextField.alloc.initWithFrame($.NSMakeRect(20, 120, 360, 60));
statusLabel.setStringValue($.NSString.stringWithUTF8String(
    'The × button is disabled.\nUse the "Quit" button to close.'
));
statusLabel.setEditable(false);
statusLabel.setBezeled(false);
statusLabel.setDrawsBackground(false);
statusLabel.setAlignment($.NSTextAlignmentCenter);
statusLabel.setFont($.NSFont.systemFontOfSize(14));

win.contentView.addSubview(statusLabel);

// --- quit button + handler ----------------------------------------------

let allowClose = false;

ObjC.registerSubclass({
    name: 'PreventCloseQuitHandler',
    superclass: 'NSObject',
    methods: {
        'click:': {
            types: ['void', ['id']],
            implementation: () => {
                console.log('Quit button clicked — closing window.');
                allowClose = true;
                win.close;
            }
        }
    }
});

const quitHandler = $.PreventCloseQuitHandler.alloc.init;

const quitButton = $.NSButton.alloc.initWithFrame($.NSMakeRect(150, 50, 100, 36));
quitButton.setTitle($.NSString.stringWithUTF8String('Quit'));
quitButton.setBezelStyle($.NSBezelStyleRounded);
quitButton.setTarget(quitHandler);
quitButton.setAction('click:');

win.contentView.addSubview(quitButton);

// --- window delegate: windowShouldClose: --------------------------------
//
// Returning NO blocks the close.  Sync callback: the boolean reaches AppKit
// on the same stack frame, and proxy calls inside the handler are fine.

ObjC.registerSubclass({
    name: 'PreventCloseWindowDelegate',
    superclass: 'NSObject',
    methods: {
        'windowShouldClose:': {
            types: ['bool', ['id']],
            implementation: () => {
                if (!allowClose) {
                    console.log('windowShouldClose: intercepted — close blocked.');
                    statusLabel.setStringValue($.NSString.stringWithUTF8String(
                        'Close blocked!\nUse the "Quit" button.'
                    ));
                    return false;
                }
                return true;
            }
        }
    }
});

const winDelegate = $.PreventCloseWindowDelegate.alloc.init;
win.setDelegate(winDelegate);

// --- run -----------------------------------------------------------------

console.log('Window ready. Try clicking × — it will be blocked.');
console.log("Click 'Quit' to actually close the window.");

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

runApp(app);
