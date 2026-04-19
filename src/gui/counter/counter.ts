// src/gui/counter/counter.ts
// Cocoa counter: an NSWindow with a centered label and a "Click to Add" button.
// Mirrors node-with-gjs-examples/src/gtk4/counter — same behaviour, AppKit flavour.
//
// Cocoa's target-action mechanism requires an ObjC object as the action target,
// not a plain JS function.  `ObjC.registerSubclass` declares a subclass whose
// method implementations are JS functions that run in this Node.js process;
// when the button is clicked, the host pushes a sync event to Node, invokes
// the JS implementation, and sends the return value back.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);

// Quit when the last window closes.  Held at module scope —
// NSApplication.delegate is a weak reference.
ObjC.registerSubclass({
    name: 'NwjxaQuitOnLastClose',
    superclass: 'NSObject',
    methods: {
        'applicationShouldTerminateAfterLastWindowClosed:': {
            types: ['bool', ['id']],
            implementation: () => true
        }
    }
});
const _appDelegate = $.NwjxaQuitOnLastClose.alloc.init;
app.delegate = _appDelegate;
void _appDelegate;

// --- window --------------------------------------------------------------

const styleMask =
    Number($.NSWindowStyleMaskTitled) |
    Number($.NSWindowStyleMaskClosable) |
    Number($.NSWindowStyleMaskResizable) |
    Number($.NSWindowStyleMaskMiniaturizable);

const win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
    $.NSMakeRect(200, 200, 400, 300),
    styleMask,
    Number($.NSBackingStoreBuffered),
    false
);
win.setTitle($.NSString.stringWithUTF8String('AppKit Counter App'));

// --- label ---------------------------------------------------------------

const label = $.NSTextField.alloc.initWithFrame($.NSMakeRect(50, 170, 300, 40));
label.setStringValue($.NSString.stringWithUTF8String('Clicks: 0'));
label.setEditable(false);
label.setBezeled(false);
label.setDrawsBackground(false);
label.setAlignment($.NSTextAlignmentCenter);
label.setFont($.NSFont.systemFontOfSize(24));

win.contentView.addSubview(label);

// --- button + handler ----------------------------------------------------

let clickCount = 0;

ObjC.registerSubclass({
    name: 'CounterHandler',
    superclass: 'NSObject',
    methods: {
        'click:': {
            types: ['void', ['id']],
            implementation: () => {
                clickCount++;
                const message = `Clicked ${clickCount} times`;
                label.setStringValue($.NSString.stringWithUTF8String(message));
                console.log(message);
            }
        }
    }
});

const handler = $.CounterHandler.alloc.init;

const button = $.NSButton.alloc.initWithFrame($.NSMakeRect(140, 80, 120, 40));
button.setTitle($.NSString.stringWithUTF8String('Click to Add'));
button.setBezelStyle($.NSBezelStyleRounded);
button.setTarget(handler);
button.setAction('click:');

win.contentView.addSubview(button);

// --- run -----------------------------------------------------------------

console.log('--- AppKit Counter ---');
console.log('Click the button to increase the counter...');

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

app.run();
