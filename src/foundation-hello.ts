// src/foundation-hello.ts
// Smallest possible example: load Foundation and exercise a few classes.
// No GUI, no run loop — Node exits as soon as the script finishes.

import { $, importFramework, hostLog } from '@devscholar/node-with-jxa';

importFramework('Foundation');

const proc = $.NSProcessInfo.processInfo;
console.log('OS version :', proc.operatingSystemVersionString);
console.log('Host name  :', proc.hostName);
console.log('User       :', $.NSUserName());
console.log('Home       :', $.NSHomeDirectory());

const arr = $.NSMutableArray.alloc.init;
arr.addObject($.NSString.stringWithUTF8String('alpha'));
arr.addObject($.NSString.stringWithUTF8String('beta'));
arr.addObject($.NSString.stringWithUTF8String('gamma'));
console.log('count      :', arr.count);
console.log('joined     :', arr.componentsJoinedByString(', '));

hostLog('foundation-hello finished');
