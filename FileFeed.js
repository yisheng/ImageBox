'use strict'

const fs = require('fs-plus')
const EventEmitter = require('events')
const util = require('util')
const path = require('path')
const NeDB = require('nedb')
const config = require('./Config')

function FileFeed() {
  EventEmitter.call(this)

  initDB()
}

util.inherits(FileFeed, EventEmitter)

var db = null
var rootPath = ''
var watcher = null
var fileFeed = new FileFeed()

fileFeed.update = function(query, update, options, callback) {
  callback = callback || function () {}
  options = options || {}
  var _this = this
  db.update(query, update, options, function(err, numReplaced, newDoc) {
    if (numReplaced) {
      _this.emit('change', {method: 'record-changed'})
    }

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

config.on('change', function(key, value) {
  if (key == 'directory') {
    rootPath = value

    watcher.close()

    initIndex()
    watch()
  }
})

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
  var files = fs.listTreeSync(rootPath)
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
  watcher = fs.watch(rootPath, watcherOptions, function(event, filename) {
    if (!filename) {
      return
    }
    if (!isFileSupported(filename)) {
      return
    }

    console.log('File changed. Event: ' + event + ' Filename: ' + rootPath + filename)

    var filePath = rootPath + filename
    if (fs.isFileSync(filePath)) {
      db.findOne({
        path: filePath
      }).sort({
        mtime: -1
      }).exec(function(err, existedFile) {
        if (existedFile && existedFile.stopWatching && (new Date().getTime() - existedFile.updatedAt) < 2000) {
          fileFeed.emit('skip', existedFile)
          return
        }

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
            fileFeed.emit('change', {path: filePath, method: 'file-changed'})
          })
        } else {
          db.insert(file, function() {
            fileFeed.emit('change', {path: filePath, method: 'file-changed'})
          })
        }
      })
    } else {
      db.remove({path: filePath}, {multi: true}, function() {
        fileFeed.emit('change', {path: filePath, method: 'file-removed'})
      })
    }
  })
}

config.get('directory', function(err, directory) {
  if (directory) {
    rootPath = directory + '/'

    initIndex()
    watch()
  }
})

module.exports = fileFeed
