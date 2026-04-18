// src/gui/webkit-counter/webkit-counter.ts
// Cocoa equivalent of GJS gtk-webkit/counter.
//
// Loads counter.html into a WKWebView and forwards `console.log` from the
// page back to Node via a WKScriptMessageHandler named "console".  AppKit
// itself doesn't have a separate "WebKit" import — WKWebView lives in the
// WebKit framework, so we ObjC.import('WebKit').
//
// Layout: vertical split — toolbar (Back/Forward/URL entry) on top,
// WKWebView filling the rest.  Address-bar Enter loads the typed URL.

import { $, ObjC, runApp } from '@devscholar/node-with-jxa';
import * as path from 'node:path';

ObjC.import('AppKit');
ObjC.import('WebKit');

// start.js compiles every example to a flat dist/ directory, so __dirname of
// the bundled JS no longer matches the source.  start.js sets
// NWJXA_EXAMPLE_SRC_DIR to the original source dir; fall back to cwd so the
// example still works when invoked another way (e.g. ad-hoc tsx).
const srcDir = process.env.NWJXA_EXAMPLE_SRC_DIR
    || path.join(process.cwd(), 'src', 'gui', 'webkit-counter');
const htmlPath = path.join(srcDir, 'counter.html');
const htmlUri = 'file://' + htmlPath.replace(/\\/g, '/');

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
    $.NSMakeRect(200, 200, 500, 400),
    styleMask,
    Number($.NSBackingStoreBuffered),
    false
);
win.setTitle($.NSString.stringWithUTF8String('WebKit Counter App'));

// --- WKWebView + script message handler ---------------------------------
//
// `userContentController.addScriptMessageHandler:name:` lets the page call
// `window.webkit.messageHandlers.<name>.postMessage(value)` and routes the
// value to the handler's -userContentController:didReceiveScriptMessage:
// method.  The handler must be an ObjC object — we register a subclass.

// JXA's ObjC.registerSubclass dispatches by selector name, so we don't need
// to declare protocol conformance — the WKUserContentController just calls
// -userContentController:didReceiveScriptMessage: by selector and our impl
// runs.  Listing the protocol explicitly fails ("protocol does not exist")
// unless the protocol object is loaded via objc_getProtocol().
ObjC.registerSubclass({
    name: 'WebkitConsoleHandler',
    superclass: 'NSObject',
    methods: {
        'userContentController:didReceiveScriptMessage:': {
            types: ['void', ['id', 'id']],
            implementation: (_controller: any, message: any) => {
                const body = ObjC.unwrap<string>(message.body);
                console.log(`[WebView] ${body}`);
            }
        }
    }
});

const consoleHandler = $.WebkitConsoleHandler.alloc.init;

const config = $.WKWebViewConfiguration.alloc.init;
const userContent = $.WKUserContentController.alloc.init;
userContent.addScriptMessageHandlerName(consoleHandler, $.NSString.stringWithUTF8String('console'));
config.setUserContentController(userContent);

// Toolbar height = 40, web view fills the rest.
const contentRect = win.contentView.bounds;
const w = Number(contentRect.size.width);
const h = Number(contentRect.size.height);
const toolbarHeight = 40;

const webView = $.WKWebView.alloc.initWithFrameConfiguration(
    $.NSMakeRect(0, 0, w, h - toolbarHeight),
    config
);
webView.setAutoresizingMask(Number($.NSViewWidthSizable) | Number($.NSViewHeightSizable));

// --- toolbar (Back / Forward / URL entry) -------------------------------

const toolbar = $.NSView.alloc.initWithFrame($.NSMakeRect(0, h - toolbarHeight, w, toolbarHeight));
// Stick to the top: width-resize + min-Y-margin (so it slides up, not down).
toolbar.setAutoresizingMask(Number($.NSViewWidthSizable) | Number($.NSViewMinYMargin));

const backButton = $.NSButton.alloc.initWithFrame($.NSMakeRect(5, 5, 70, 30));
backButton.setTitle($.NSString.stringWithUTF8String('← Back'));
backButton.setBezelStyle($.NSBezelStyleRounded);

const forwardButton = $.NSButton.alloc.initWithFrame($.NSMakeRect(80, 5, 90, 30));
forwardButton.setTitle($.NSString.stringWithUTF8String('Forward →'));
forwardButton.setBezelStyle($.NSBezelStyleRounded);

const urlEntry = $.NSTextField.alloc.initWithFrame($.NSMakeRect(175, 8, w - 180, 24));
urlEntry.setStringValue($.NSString.stringWithUTF8String(htmlUri));
urlEntry.setAutoresizingMask(Number($.NSViewWidthSizable));

toolbar.addSubview(backButton);
toolbar.addSubview(forwardButton);
toolbar.addSubview(urlEntry);

// --- handlers -----------------------------------------------------------

ObjC.registerSubclass({
    name: 'WebkitToolbarHandler',
    superclass: 'NSObject',
    methods: {
        'back:': {
            types: ['void', ['id']],
            implementation: () => { if (webView.canGoBack) webView.goBack(null); }
        },
        'forward:': {
            types: ['void', ['id']],
            implementation: () => { if (webView.canGoForward) webView.goForward(null); }
        },
        // Sent by NSTextField when the user presses Return.
        'go:': {
            types: ['void', ['id']],
            implementation: () => {
                let uri = ObjC.unwrap<string>(urlEntry.stringValue);
                if (!uri.startsWith('http://') && !uri.startsWith('https://') && !uri.startsWith('file://')) {
                    uri = 'https://' + uri;
                }
                const url = $.NSURL.URLWithString($.NSString.stringWithUTF8String(uri));
                const req = $.NSURLRequest.requestWithURL(url);
                webView.loadRequest(req);
            }
        }
    }
});

const toolbarHandler = $.WebkitToolbarHandler.alloc.init;
backButton.setTarget(toolbarHandler);
backButton.setAction('back:');
forwardButton.setTarget(toolbarHandler);
forwardButton.setAction('forward:');
urlEntry.setTarget(toolbarHandler);
urlEntry.setAction('go:');

// --- WKNavigationDelegate (load-changed equivalent) ---------------------

ObjC.registerSubclass({
    name: 'WebkitNavDelegate',
    superclass: 'NSObject',
    methods: {
        'webView:didFinishNavigation:': {
            types: ['void', ['id', 'id']],
            implementation: () => {
                console.log('Page Loaded Successfully');
                const u = webView.URL;
                if (u) urlEntry.setStringValue(u.absoluteString);
            }
        }
    }
});

const navDelegate = $.WebkitNavDelegate.alloc.init;
webView.setNavigationDelegate(navDelegate);

// --- assemble + run -----------------------------------------------------

const root = $.NSView.alloc.initWithFrame(contentRect);
root.addSubview(webView);
root.addSubview(toolbar);
win.setContentView(root);

const initialUrl = $.NSURL.URLWithString($.NSString.stringWithUTF8String(htmlUri));
const initialReq = $.NSURLRequest.requestWithURL(initialUrl);
webView.loadRequest(initialReq);

console.log('Click the button in the web view to increase the counter...');

win.makeKeyAndOrderFront(null);
app.activateIgnoringOtherApps(true);

runApp(app);
