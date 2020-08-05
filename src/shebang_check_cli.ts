#!/usr/bin/env node
import {ShebangCheck} from './shebang_check';

(async () => {
  await ShebangCheck.cli(process);
})();
