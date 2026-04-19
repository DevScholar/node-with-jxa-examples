// src/finder-open-home.ts
// Classic JXA automation: drive the Finder app to open the user's home folder.
// Same style as a standalone `osascript -l JavaScript` script — every name
// (`Application`, `Path`) is a regular import, no raw-source escape hatches.

import { $, ObjC, Application, Path } from '@devscholar/node-with-jxa';

ObjC.import('Foundation');

const home = ObjC.unwrap<string>($.NSHomeDirectory());
console.log('Home folder:', home);

const finder = Application('Finder');
finder.activate();
finder.open(Path(home));

console.log('finder-open-home: asked Finder to open ' + home);
