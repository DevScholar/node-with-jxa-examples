// src/gui/drag-box/drag-box.ts
// Cocoa equivalent of GTK4's drag-box (high-frequency IPC stress test).
//
// Uses NSPanGestureRecognizer attached to a plain NSView — the macOS
// counterpart of GTK4's Gtk.GestureDrag.  Each pan update fires a sync
// `pan:` action on a target/action handler at ~60 Hz; if the bridge keeps
// up smoothly, the red square tracks the cursor.
//
// AppKit coordinate system note: in a non-flipped NSView, (0,0) is the
// BOTTOM-left, and y increases upward.  We track positions in that space.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('AppKit');

console.log('--- AppKit Draggable Square (High Frequency IPC) ---');

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
    $.NSMakeRect(200, 200, 600, 400),
    styleMask,
    Number($.NSBackingStoreBuffered),
    false
);
win.setTitle($.NSString.stringWithUTF8String('Drag Example (High Frequency IPC)'));

const squareSize = 80;
let currentX = 260;
let currentY = 160;

const square = $.NSBox.alloc.initWithFrame($.NSMakeRect(currentX, currentY, squareSize, squareSize));
square.setBoxType($.NSBoxCustom);
square.setBorderType($.NSNoBorder);
square.setTitlePosition($.NSNoTitle);
square.setFillColor($.NSColor.colorWithCalibratedRedGreenBlueAlpha(1.0, 0.2, 0.2, 1.0));

win.contentView.addSubview(square);

// --- pan gesture --------------------------------------------------------
//
// `translationInView:` returns the cumulative offset since `began`,
// so we capture the square's origin at `began` and add the delta from then on.

const STATE_BEGAN = Number($.NSGestureRecognizerStateBegan);
const STATE_CHANGED = Number($.NSGestureRecognizerStateChanged);
const STATE_ENDED = Number($.NSGestureRecognizerStateEnded);

let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

ObjC.registerSubclass({
    name: 'DragPanHandler',
    superclass: 'NSObject',
    methods: {
        'pan:': {
            types: ['void', ['id']],
            implementation: (gesture: any) => {
                const state = Number(gesture.state);
                if (state === STATE_BEGAN) {
                    // only start drag if the press landed inside the square
                    const loc = gesture.locationInView(win.contentView);
                    const x = Number(loc.x);
                    const y = Number(loc.y);
                    if (x >= currentX && x <= currentX + squareSize &&
                        y >= currentY && y <= currentY + squareSize) {
                        isDragging = true;
                        dragStartX = currentX;
                        dragStartY = currentY;
                        console.log(`Drag started at: (${x.toFixed(1)}, ${y.toFixed(1)})`);
                    }
                } else if (state === STATE_CHANGED) {
                    if (!isDragging) return;
                    const t = gesture.translationInView(win.contentView);
                    // In a non-flipped NSView, translationInView matches the
                    // view's coordinate system: Y grows upward, same as the
                    // square's frame origin.
                    const newX = dragStartX + Number(t.x);
                    const newY = dragStartY + Number(t.y);
                    square.setFrameOrigin($.NSMakePoint(newX, newY));
                } else if (state === STATE_ENDED) {
                    if (!isDragging) return;
                    isDragging = false;
                    const frame = square.frame;
                    currentX = Number(frame.origin.x);
                    currentY = Number(frame.origin.y);
                    console.log(`Drag ended at position: (${currentX.toFixed(1)}, ${currentY.toFixed(1)})`);
                }
            }
        }
    }
});

const panHandler = $.DragPanHandler.alloc.init;

const pan = $.NSPanGestureRecognizer.alloc.initWithTargetAction(panHandler, 'pan:');
win.contentView.addGestureRecognizer(pan);

// --- run -----------------------------------------------------------------

console.log('Window loaded. Try dragging the red square smoothly!');

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

app.run();
