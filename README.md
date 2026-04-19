# node-with-jxa-examples

Runnable examples for [`@devscholar/node-with-jxa`](../node-with-jxa) — a Node.js ↔ macOS JXA (JavaScript for Automation) bridge that lets you drive Cocoa / Objective-C APIs from Node as if you were writing JXA directly.

**macOS only.**

## Setup

```bash
cd node-with-jxa && npm install && npm run build
cd ../node-with-jxa-examples && npm install
```

The `@devscholar/node-with-jxa` dependency is linked via `file:../node-with-jxa`, so rebuild the parent package whenever you change it.

## Running an example

```bash
node start.js src/<example>.ts
```

`start.js` compiles the TypeScript entry with `tsc` and runs the output with Node. No bundler.

## Examples

### `src/foundation-hello.ts`

Smallest possible example. Loads Foundation, reads process info, and builds an `NSMutableArray`. No GUI, no run loop — process auto-exits when the script finishes.

```bash
node start.js src/foundation-hello.ts
```

### `src/finder-open-home.ts`

Pure JXA automation — no ObjC classes. Uses `Application('Finder')` and `Path(...)` (both JXA globals, reached via `evalJxa`) to tell Finder to activate and open the user's home folder in a new window. Closest analogue to a plain `osascript -l JavaScript` automation script.

```bash
node start.js src/finder-open-home.ts
```

### `src/alert.ts`

Shows a modal `NSAlert` dialog with OK / Cancel buttons and prints which one was clicked. Uses `runModal` directly — no `NSApp.run()` needed because `runModal` pumps its own modal session.

```bash
node start.js src/alert.ts
```

### `src/window.ts`

Creates an `NSWindow` with a centered label and runs `NSApplication` until the window is closed. Demonstrates:

- `NSMakeRect` via the proxy bridge
- Bitwise-OR'd `NSWindowStyleMask` values
- `evalJxa` for `ObjC.registerSubclass` (installing an `NSApplicationDelegate` that quits when the last window closes)
- `app.run()` — hands control to `-[NSApplication run]` on the host's main thread

```bash
node start.js src/window.ts
```

### `src/console/await-delay/await-delay.ts`

Minimal async test: plain Node `setTimeout` + top-level `await`. No JXA objects touched — just confirms the watchdog cleans up the osascript host once the promise chain resolves.

```bash
node start.js src/console/await-delay/await-delay.ts
```

### `src/console/console-input/console-input.ts`

Reads a line from the terminal via `$.NSFileHandle.fileHandleWithStandardInput.availableData`, exactly the way standalone JXA would. The host inherits Node's stdin, so the blocking read happens on the real TTY.

```bash
node start.js src/console/console-input/console-input.ts
```

### `src/gui/counter/counter.ts`

Classic counter: `NSWindow` with a label and a button. Each click bumps a JS-side number and updates the label via `setStringValue`. Smallest end-to-end demo of `ObjC.registerSubclass` + target/action wiring.

```bash
node start.js src/gui/counter/counter.ts
```

### `src/gui/drag-box/drag-box.ts`

A draggable box driven by `NSPanGestureRecognizer`. Reads `gesture.translationInView` / `gesture.state` inside the JS handler and writes back the box's frame. Demonstrates the high-frequency sync-callback path and the nested run-loop's private mode (without it, AppKit would reset gesture state mid-callback — see [`project_node_with_jxa_nested_runloop.md`](../node-with-jxa/scripts/host.js)).

```bash
node start.js src/gui/drag-box/drag-box.ts
```

### `src/gui/blocking-dialog/blocking-dialog.ts`

Opens an `NSAlert` from inside a button's click handler. Shows that a sync callback can itself drive a modal run-loop without dead-locking the IPC.

```bash
node start.js src/gui/blocking-dialog/blocking-dialog.ts
```

### `src/gui/menu-counter/menu-counter.ts`

Counter wired to an `NSMenu` instead of a button. Demonstrates building an application menu bar (`NSApp.mainMenu`) and using a menu item's target/action just like a button.

```bash
node start.js src/gui/menu-counter/menu-counter.ts
```

### `src/gui/prevent-close/prevent-close.ts`

Cocoa equivalent of `window.onbeforeunload`: an `NSWindowDelegate` that returns `false` from `windowShouldClose:` blocks the red close button. A separate "Quit" button flips a flag and calls `win.close` to allow the close. Verifies the sync-callback boolean return value reaches AppKit on the same call stack.

```bash
node start.js src/gui/prevent-close/prevent-close.ts
```

### `src/gui/webkit-counter/webkit-counter.ts`

Loads `counter.html` into a `WKWebView` and bridges the page's `console.log` back to Node via a `WKScriptMessageHandler` named `console`. Demonstrates loading a sibling asset (`NWJXA_EXAMPLE_SRC_DIR` env var, set by `start.js`) and the `WebKit` framework import.

```bash
node start.js src/gui/webkit-counter/webkit-counter.ts
```


## API patterns used here

| Need | API |
| --- | --- |
| Load a framework | `ObjC.import('AppKit')` |
| Access a class | `$.NSWindow` |
| Construct: `+alloc` then `-init` | `$.NSAlert.alloc.init` (zero-arg methods auto-invoke) |
| Convert NSString/NSNumber → JS value | `ObjC.unwrap(nsStringRef)` |
| Deep unwrap NSArray/NSDictionary | `ObjC.deepUnwrap(nsDictRef)` |
| Scripting bridge to an app | `Application('Finder')` |
| File-path literal | `Path('/Users/me')` |
| Sleep | `delay(0.5)` |
| Register an ObjC subclass (delegates, target-action) | `ObjC.registerSubclass({...})` |
| Run a Cocoa app | `$.NSApplication.sharedApplication.run()` |

`$`, `ObjC`, `Application`, `Path`, `delay`, `Ref` match standard JXA; `releaseObject` and `init` are node-with-jxa-specific plumbing.
