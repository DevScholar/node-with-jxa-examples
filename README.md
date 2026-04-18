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
- `runApp(app)` — hands control to `-[NSApplication run]` on the host's main thread

```bash
node start.js src/window.ts
```

## API patterns used here

| Need | API |
| --- | --- |
| Load a framework | `importFramework('AppKit')` |
| Access a class | `$.NSWindow` |
| Construct: `+alloc` then `-init` | `$.NSAlert.alloc.init` (zero-arg methods auto-invoke) |
| Convert NSString/NSNumber → JS value | `unwrap<string>(nsStringRef)` |
| Call a C struct constructor or register a subclass | `evalJxa('(NSMakeRect(...))')` |
| Run a Cocoa app | `runApp($.NSApplication.sharedApplication)` |
| Print from the JXA host side | `hostLog('message')` |
