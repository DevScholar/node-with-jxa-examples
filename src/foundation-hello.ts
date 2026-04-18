// src/foundation-hello.ts
// Smallest possible example: load Foundation and exercise a few classes.
// No GUI, no run loop — Node exits as soon as the script finishes.

import { $, importFramework, unwrap, hostLog } from '@devscholar/node-with-jxa';

importFramework('Foundation');

const proc = $.NSProcessInfo.processInfo;
console.log('OS version :', unwrap<string>(proc.operatingSystemVersionString));
console.log('Host name  :', unwrap<string>(proc.hostName));
console.log('User       :', unwrap<string>($.NSUserName()));
console.log('Home       :', unwrap<string>($.NSHomeDirectory()));

const arr = $.NSMutableArray.alloc.init;
arr.addObject($.NSString.stringWithUTF8String('alpha'));
arr.addObject($.NSString.stringWithUTF8String('beta'));
arr.addObject($.NSString.stringWithUTF8String('gamma'));
console.log('count      :', unwrap<number>(arr.count));
console.log('joined     :', unwrap<string>(arr.componentsJoinedByString(', ')));

hostLog('foundation-hello finished');
