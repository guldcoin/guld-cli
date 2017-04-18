# guld-cli

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://iramiller.com/snobject/LICENSE)

[Install](INSTALL.md)

Use guld-cli to auto-generate a CLI for your project, or to browse snobjects on the fly.

### Direct Usage

The `guld-cli` command will read in a snobject schema and generate a CLI at runtime. Either run the command from a snobject directory or pass in the `-s` or `--snobject` option.

```
guld-cli -s ~/snobject-person --help
```

The help menus and middleware are handled by [commander.js](https://github.com/tj/commander.js). The result is attractive and feature rich. Both camel and kebab cases are supported, as well as callback method responses.

```
Usage: sno-person|SnoPerson [options] [command]


Commands:

  get-schema|getSchema [options]   Get the schema for this snobject.
  add-schema|addSchema [options]   Add a schema to the validator this snobject.
  validate [options]               Validate this snobject, using its own schema and validator.
  to-string|toString [options]     Get the display string for this person, such as goes in AUTHORS.
  add [options]                    Add this person to AUTHORS.
  list [options]                   List people found in AUTHORS.
  get [options]                    Get a person found in AUTHORS.
  set [options]                    Set (update) a person found in AUTHORS.
  del [options]                    Delete a person from AUTHORS.

A SnoPerson is someone who has helped the project progress. In simple terms this means people who make git commits.

This SnoPerson snobject will represent a single person, as they're recorded for the group. The standard `AUTHORS` file has name, email, and url, so SnoPerson supports all three.

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```

The example above is for [sno-person](https://github.com/isysd/sno-person).

### Generate a Custom CLI

It couldn't be easier to create a custom CLI for your snobject. If you have [snopack](https://github.com/isysd/sno-pack), then run this command from your project directory.

```
snopack build-cli
```

Alternately, if you don't want to install snopack, you can create a CLI in a few simple lines of code.

```
#!/usr/bin/env node
var pickCommand = require('guld-cli').pickCommand
// Bootstrap the --snobject option with a path to your project dir
var relpath = require('path').join(__dirname, '../')
pickCommand(process.argv.slice(0, 2).concat('-s', relpath).concat(process.argv.slice(2, process.argv.length)))
```
