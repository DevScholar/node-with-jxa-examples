// src/window.ts
// Create an NSWindow with a label, then run the application until the user
// closes the window.

import { $, ObjC, runApp, evalJxa } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);

// NSMakeRect is a C struct constructor.  Calling it through the proxy returns
// an opaque ref we can pass straight back into Cocoa methods that expect NSRect.
const rect = $.NSMakeRect(200, 200, 480, 320);

const styleMask =
    Number($.NSWindowStyleMaskTitled) |
    Number($.NSWindowStyleMaskClosable) |
    Number($.NSWindowStyleMaskResizable) |
    Number($.NSWindowStyleMaskMiniaturizable);

const win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
    rect,
    styleMask,
    Number($.NSBackingStoreBuffered),
    false
);

win.setTitle($.NSString.stringWithUTF8String('node-with-jxa: hello'));

const labelRect = $.NSMakeRect(20, 140, 440, 40);
const label = $.NSTextField.alloc.initWithFrame(labelRect);
label.setStringValue($.NSString.stringWithUTF8String('Driven from Node.js via JXA \u{1F389}'));
label.setEditable(false);
label.setBezeled(false);
label.setDrawsBackground(false);
label.setAlignment(2); // NSTextAlignmentCenter (macOS — iOS uses 1)
label.setFont($.NSFont.systemFontOfSize(20));

win.contentView.addSubview(label);

// Quit when the last window closes — saves having to ⌘Q the process.
// Routed through evalJxa so we don't have to expose every NSApplicationDelegate
// shim through the proxy bridge.  We MUST hold onto the returned delegate ref
// at module scope: NSApplication.delegate is a weak reference, so if Node-side
// GC collects this proxy the delegate would be freed and the app would lose
// its termination policy.
const _delegate = evalJxa(`(function() {
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
void _delegate;

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

runApp(app);
