# code review

to build the extension, enter the following commands inside the project's folder:

1. `pnpm i`
2. `pnpm zip:firefox` - to build a bundle of the extension
3. `pnpm dev:firefox` - to launch an instance of firefox with the extension

> for chrome, remove `:firefox` from the commands.

**developed and tested on the following machine:**
1. os: windows 11 24H2
2. node: `22.8.0`
3. npm: `10.9.0`
4. pnpm: `9.12.0`