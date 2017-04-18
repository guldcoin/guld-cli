var fs = require('fs')
var path = require('path')
var Command = require('commander').Command
var Snobject = require('snobject')
var _ = require('lodash')
var Ajv = require('ajv')
// var ajv = new Ajv()

var pickCommand = function (args, ajv) {
  if (!ajv) ajv = new Ajv()
  var cmd = new Command('guld-cli')
  cmd
    .version('0.0.3')
    .option('-s --snobject <snobject>', 'The path to a snobject package, defaults to current directory.')
     .parse(args.slice(0, 4))
  if (!cmd.snobject) {
    cmd.snobject = process.cwd()
  } else {
    args = args.slice(0, 2).concat(args.slice(4, args.length))
  }
  fs.readFile(path.normalize(path.join(cmd.snobject, 'package.json')), function (err, data) {
    if (err) {
      console.log('Invalid snobject package.')
      cmd.help()
    } else {
      var pdata = JSON.parse(data.toString('utf-8'))
      var main = pdata['main']
      if (!pdata.dependencies.hasOwnProperty('snobject') || pdata.name === 'guld-cli') cmd.help()
      if (main[0] !== '/' && main[0] !== '.') main = './' + main
      var Sno = require(path.resolve(path.normalize(path.join(cmd.snobject, main))))
      // create an instance to act on and load schemas
      var sno = Sno(null, null, ajv)
      var snot = sno.getSchema().title
      var kt = _.kebabCase(snot)
      var scmd = cmd
        .command(kt)
      if (snot !== kt) scmd.alias(snot)
      snoCommand(sno, scmd, args, ajv)
    }
  })
}

function snoCommand (sno, scmd, args, ajv) {
  var schema = sno.getSchema()
  if (!schema) scmd.help()
  // load our top level snobject data into the command
  scmd
    .version(sno.version)
    .description(schema.description)
  for (var prop in schema.properties) {
    var property = resolveProp(schema.properties[prop], ajv)
    //  TODO check if property is a snobject and call snoCommand
    // check if property is a method
    if (property && property.definitions && property.definitions.request && property.definitions.response) {
      var request = resolveProp(property.definitions.request, ajv)
      var response = resolveProp(property.definitions.response, ajv)
      // create a method command
      var kt = _.kebabCase(property.title)
      var mcmd = scmd
        .command(kt)
        .description(property.description)
        .option('--method [value]', 'The method that is being called. LEAVE AS DEFAULT', property.id)
        .action(function (options) {
          var toPass = {}
          var called = ajv.getSchema(options.method).schema
          request = resolveProp(called.definitions.request, ajv)
          response = resolveProp(called.definitions.response, ajv)
          if (response.title && response.title.indexOf('Callback') >= 0) {
            toPass = filterArgs(options, request, ajv)
            if (request.type === 'null' || ajv.validate(request.id, toPass)) {
              if (request.type === 'null') sno[called.title](responseHandler)
              else if (request.type === 'object') sno[called.title](toPass, responseHandler)
            } else {
              console.error('Invalid request ' + request.id)
            }
          } else {
            toPass = filterArgs(options, request, ajv)
            if (request.type === 'null') responseHandler(null, sno[called.title]())
            else if (request.type === 'object') {
              try {
                responseHandler(null, sno[called.title](toPass))
              } catch (e) {
                responseHandler(e, null)
              }
            }
          }
        })
      if (property.title !== kt) mcmd.alias(property.title)
      if (request && request.hasOwnProperty('properties')) {
        for (var mprop in request.properties) {
          var mproperty = resolveProp(request.properties[mprop], ajv)
          if (mproperty) {
            if (mproperty.hasOwnProperty('properties')) {
            } else {
              var wait = snoMethod(mproperty, mcmd)
            }
          }
        }
      } else {
        var wait = snoMethod(request, mcmd)
      }
    }
  }
  scmd.parse(args)
}

function filterArgs (args, request, ajv) {
  var toPass = {}
  for (var oprop in args) {
    if (request && request.properties && request.properties.hasOwnProperty(oprop)) {
      toPass[oprop] = args[oprop]
    }
  }
  if (toPass.name && !ajv.validate({'type': 'string'}, toPass.name)) delete toPass.name
  return toPass
}

function responseHandler (err, data) {
  if (err) {
    console.error(err)
    process.exit(2)
  } else {
    if (data && data.toString) console.log(data.toString())
    else console.log(data)
  }
}

function snoMethod (prop, mcmd) {
  var optStr
  if (!prop || prop.type === 'null') {
    // do nothing, no options
  } else if (!prop.hasOwnProperty('type')) {
    // probably a method. no methods on methods supported.
    // mcmd.option('--json', 'A JSON request object, whose values will be overridden by any other arguments.')
  } else if (prop.type === 'object') {
    optStr = '--' + _.kebabCase(prop.title)
    mcmd.option(optStr, prop.description)
  } else {
    optStr = '--' + _.kebabCase(prop.title) + ' [value]'
    mcmd.option(optStr, prop.description)
  }
  // TODO other types? coerce?
}

function resolveProp (s, ajv) {
  var property
  if (s.$ref) {
    // ajv should have it from the snobject init
    var sch = ajv.getSchema(s.$ref)
    if (sch && sch.schema) property = sch.schema
  } else property = s
  return property
}

module.exports = {'pickCommand': pickCommand, 'snoCommand': snoCommand}
