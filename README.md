# New-Tongwentang
Firefox Add-on, converts web page between Simplified and Traditional Chinese.

# License
Released under [MIT/X11 License](https://opensource.org/licenses/mit-license.php)

# Install require librarys
- npm install --save-dev  webpack
- npm install --save-dev copy-webpack-plugin

# Dev
**CAUTION:** You must at least install **git for windows** if you developing under Windows or developing with cmder with **git for windows**.

Some predefine npm scripts for development:
- `dev`: continually watch the files change under `src/`, once change emitted, webpack automatically rebuild.
- `build`: one time build.
- `eslint`: lint the files under `src/` with `eslint-config-google` and reformat with `prettier`. Under `dev` mode (`yarn run dev`), eslint and prettier continually checking the files, so you don't really need to run this command by youself.

#### `dev` mode
If you not going to developing under `dev` mode, you should run a `yarn run build` to perform a eslint and prettier check to the files before you actually commit you works. So, developing under `dev` mode is strongly recommended.

#### prettier editor extension
Make sure you editor's prettier extension settings no conflict with the project prettier settings, if you already instal prettier extension on your editor.

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
