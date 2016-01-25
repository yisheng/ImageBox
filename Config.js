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

config.getAllConfig = function() {
  
}

config.getConfig = function(key) {
  
}

config.setConfig = function(key, value) {
  
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