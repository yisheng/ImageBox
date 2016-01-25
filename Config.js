'use strict'

const EventEmitter = require('events')
const util = require('util')
const NeDB = require('nedb')

function Config() {
  initDB()
  EventEmitter.call(this)
}

util.inherits(Config, EventEmitter)

var db = {}
var config = new Config()

config.getAll = function(callback) {
  callback = callback || function () {}
  db.find({}, function(err, items) {
    if (items) {
      var configs = {}
      items.forEach(function(config) {
        configs[config.k] = config.v
      })

      items = configs
    }

    callback(err, items)
  })
}

config.get = function(key, callback) {
  callback = callback || function () {}
  db.findOne({k: key}, function(err, config) {
    callback(err, (config ? config.v : config))
  })
}

config.set = function(key, value, callback) {
  callback = callback || function () {}
  db.update({k: key}, {k: key, v: value}, {upsert: true}, function(err, number) {
    if (number > 0) {
      config.emit('change', key, value)
    }
    callback(err, number)
  })
}

function initDB() {
  var dbFilePath = 'database/config.db'

  db = new NeDB({
    filename: dbFilePath,
    autoload: true,
    timestampData: true
  })
}

module.exports = config