# `shebang-check`

> TLDR; Checks if a given file, or the bin files pointed to in package.json have a shebang.

# Usage

```bash
npm install shebang-check -g 
```

You can also use `npx` like like this:

```bash
$ npx shebang-check ./src/shebang_check_cli.ts 
file shebang_check_cli.ts has shebang
```

* If you point it at a non-json file will check for shebang at top of tile.
* If you point at `.json` will check for `bin` property and check those files.