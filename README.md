# `shebang-check`

> TLDR; Checks if a given file, or the bin files pointed to in package.json have a shebang.

Checks if a file has a shebang at the top, or if provided a package.json

  * checks that all bin provided have shebangs, throws an error if they do not
  * have it, useful for testing within CI for npm packages and reliably asserting
  * that a executable file indeed has a shebang at the top.