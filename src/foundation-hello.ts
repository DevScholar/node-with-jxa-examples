// src/foundation-hello.ts
// Smallest possible example: load Foundation and exercise a few classes.
// No GUI, no run loop — Node exits as soon as the script finishes.

import { $, ObjC } from '@devscholar/node-with-jxa';

ObjC.import('Foundation');

const proc = $.NSProcessInfo.processInfo;
// NSString return values are ObjC refs — unwrap explicitly to get a JS string.
// This mirrors standalone JXA, where `proc.hostName` is also an NSString ref.
console.log('OS version :', ObjC.unwrap(proc.operatingSystemVersionString));
console.log('Host name  :', ObjC.unwrap(proc.hostName));
console.log('User       :', ObjC.unwrap($.NSUserName()));
console.log('Home       :', ObjC.unwrap($.NSHomeDirectory()));

const arr = $.NSMutableArray.alloc.init;
arr.addObject($.NSString.stringWithUTF8String('alpha'));
arr.addObject($.NSString.stringWithUTF8String('beta'));
arr.addObject($.NSString.stringWithUTF8String('gamma'));
// arr.count is an NSUInteger @property — JXA returns it as a JS number, no unwrap needed.
console.log('count      :', arr.count);
console.log('joined     :', ObjC.unwrap(arr.componentsJoinedByString(', ')));

console.log('foundation-hello finished');

