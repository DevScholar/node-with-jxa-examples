// src/gui/menu-counter/menu-counter.ts
// Cocoa equivalent of the GJS Adwaita counter:
// counter window with a menu (Reset, About) wired through the system menu bar.
// AppKit doesn't have GAction/Gio.Menu — instead each NSMenuItem points at a
// target/action pair (an ObjC selector on a JS-implemented subclass).

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyRegular);

// Quit when the last window closes (held at module scope: NSApplication.delegate is weak).
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
win.setTitle($.NSString.stringWithUTF8String('AppKit Counter App (Menu)'));

// --- counter UI ----------------------------------------------------------

let clickCount = 0;

const label = $.NSTextField.alloc.initWithFrame($.NSMakeRect(50, 170, 300, 40));
label.setStringValue($.NSString.stringWithUTF8String('Clicks: 0'));
label.setEditable(false);
label.setBezeled(false);
label.setDrawsBackground(false);
label.setAlignment($.NSTextAlignmentCenter);
label.setFont($.NSFont.systemFontOfSize(24));
win.contentView.addSubview(label);

ObjC.registerSubclass({
    name: 'MenuCounterHandler',
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
        },
        'reset:': {
            types: ['void', ['id']],
            implementation: () => {
                clickCount = 0;
                label.setStringValue($.NSString.stringWithUTF8String('Clicks: 0'));
                console.log('Counter reset');
            }
        },
        'about:': {
            types: ['void', ['id']],
            implementation: () => {
                const a = $.NSAlert.alloc.init;
                a.setMessageText($.NSString.stringWithUTF8String('About'));
                a.setInformativeText($.NSString.stringWithUTF8String('Node with JXA Counter Example'));
                a.addButtonWithTitle($.NSString.stringWithUTF8String('Close'));
                a.runModal;
            }
        }
    }
});

const handler = $.MenuCounterHandler.alloc.init;

const button = $.NSButton.alloc.initWithFrame($.NSMakeRect(140, 80, 120, 40));
button.setTitle($.NSString.stringWithUTF8String('Click to Add'));
button.setBezelStyle($.NSBezelStyleRounded);
button.setTarget(handler);
button.setAction('click:');
win.contentView.addSubview(button);

// --- main menu bar -------------------------------------------------------
//
// macOS apps own the screen-top menu bar.  We build a minimal one with an
// app submenu (containing About + Quit) and a Counter submenu (Reset).
// NSMenuItem.target is a weak reference, so `handler` MUST stay reachable
// at module scope (it does — it's referenced by the button above too).

const mainMenu = $.NSMenu.alloc.init;

// App submenu (the first submenu becomes the bold app menu)
const appMenuItem = $.NSMenuItem.alloc.init;
mainMenu.addItem(appMenuItem);
const appMenu = $.NSMenu.alloc.init;

const aboutItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(
    $.NSString.stringWithUTF8String('About Counter'),
    'about:',
    $.NSString.stringWithUTF8String('')
);
aboutItem.setTarget(handler);
appMenu.addItem(aboutItem);

appMenu.addItem($.NSMenuItem.separatorItem);

const quitItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(
    $.NSString.stringWithUTF8String('Quit'),
    'terminate:',
    $.NSString.stringWithUTF8String('q')
);
appMenu.addItem(quitItem);

appMenuItem.setSubmenu(appMenu);

// Counter submenu
const counterMenuItem = $.NSMenuItem.alloc.init;
counterMenuItem.setTitle($.NSString.stringWithUTF8String('Counter'));
mainMenu.addItem(counterMenuItem);

const counterMenu = $.NSMenu.alloc.init;
counterMenu.setTitle($.NSString.stringWithUTF8String('Counter'));

const resetItem = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(
    $.NSString.stringWithUTF8String('Reset'),
    'reset:',
    $.NSString.stringWithUTF8String('r')
);
resetItem.setTarget(handler);
counterMenu.addItem(resetItem);

counterMenuItem.setSubmenu(counterMenu);

app.setMainMenu(mainMenu);

// --- run -----------------------------------------------------------------

console.log('--- AppKit Counter (Menu) ---');
console.log('Click the button or use Counter → Reset (⌘R)');

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

app.run();
