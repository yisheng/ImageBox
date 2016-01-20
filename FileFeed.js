'use strict'

const fs = require('fs-plus')
const EventEmitter = require('events')
const util = require('util')
const path = require('path')
const NeDB = require('nedb')

function FileFeed() {
  EventEmitter.call(this)

  initDB()
  initIndex()
  watch()
}

util.inherits(FileFeed, EventEmitter)

var db = {}
var defaultPath = '/Users/yisheng/Downloads/images/'
var fileFeed = new FileFeed()

fileFeed.update = function(query, update, options, callback) {
  callback = callback || function () {}
  db.update(query, update, options, function(err, numReplaced, newDoc) {
    this.emit('change')
    callback(err, numReplaced, newDoc)
  })
}

fileFeed.getNextFile = function(callback) {
  db.findOne({
    status: STATUS_PENDING
  }).sort({
    mtime: -1
  }).exec(callback)
}

fileFeed.getAllFiles = function(callback) {
  db.find({}).sort({mtime: -1}).exec(callback)
}

function initDB() {
  var dbFilePath = 'database/file.db'

  if (fs.isFileSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath)
  }

  db = new NeDB({
    filename: dbFilePath,
    autoload: true,
    timestampData: true
  })
}

function initIndex() {
  var files = fs.listTreeSync(defaultPath)
  files.forEach(function(filePath) {
    if (isFileSupported(filePath)) {
      var stats = fs.statSync(filePath)
      db.insert({
        path: filePath,
        mtime: stats.mtime.toISOString(),
        status: STATUS_PENDING,
        fromSize: stats.size,
        toSize: 0
      })
    }
  })
}

function isFileSupported(filename) {
  return ['.png', '.jpg', '.jpeg'].indexOf(path.extname(filename)) != -1
}

function watch() {
  var watcherOptions = {
    "persistent": true,
    "recursive": true
  }
  var watcher = fs.watch(defaultPath, watcherOptions, function(event, filename) {
    if (!filename) {
      return
    }
    if (!isFileSupported(filename)) {
      return
    }

    console.log('File changed. Event: ' + event + ' Filename: ' + defaultPath + filename)

    var filePath = defaultPath + filename
    if (fs.isFileSync(filePath)) {
      db.findOne({
        path: filePath
      }).sort({
        mtime: -1
      }).exec(function(err, existedFile) {
        var stats = fs.statSync(filePath)
        var file = {
          path: filePath,
          mtime: stats.mtime.toISOString(),
          status: STATUS_PENDING,
          fromSize: stats.size,
          toSize: 0
        }
        if (existedFile) {
          db.update({_id: existedFile._id}, file, {}, function() {
            fileFeed.emit('change')
          })
        } else {
          db.insert(file, function() {
            fileFeed.emit('change')
          })
        }
      })
    } else {
      db.update({path: filePath}, {status: STATUS_EXPIRED}, {multi: true}, function() {
        fileFeed.emit('change')
      })
    }
  })
}

module.exports = fileFeed
