# New-Tongwentang
Firefox Add-on, converts web page between Simplified and Traditional Chinese.

# License
Released under [MIT/X11 License](https://opensource.org/licenses/mit-license.php)

# Dev
**CAUTION:** You must at least install **git for windows** if you developing under Windows or developing with cmder with **git for windows**.

Some predefine npm scripts for development:
- `dev`: continually watch the files change under `src/`, once change emitted, webpack automatically rebuild.
- `build`: one time build.
- `eslint`: lint the files under `src/` with `eslint-config-google` and reformat with `prettier`. `eslint` command automatically run at pre-commit stage, so you don't really need to run this command by youself.

#### pre-commit
There is a pre-commit validation with eslint, this should significally slow down commit process time, but ensure the code quality. If you already install eslint and prettier plugin in your editor or run `eslint` command before commit to speed up commit processing time, considering use `commit --no-verify` to bypass pre-commit check (make sure your prettier settings is same as the project).

# Todos
- modular
  - ~~es6~~
  - ~~webpack~~
  - typescript (maybe)
- notifier
  - ~~browser notifications~~
- UI rework
  - react / angular / vue
- reactive to async
- integrate sync with third party
- subscribe list for convert phases
