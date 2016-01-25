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
  db.find({}, callback)
}

config.get = function(key, callback) {
  db.findOne({k: key}, callback)
}

config.set = function(key, value, callback) {
  db.update({k: key}, {k: key, v: value}, {upsert: true}, callback)
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