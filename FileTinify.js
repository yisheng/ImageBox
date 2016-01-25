'use strict'

const fs = require('fs-plus')
const EventEmitter = require('events')
const util = require('util')
const md5 = require('blueimp-md5')
const NeDB = require('nedb')
const tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'
const fileFeed = require('./FileFeed')

function FileTinify() {
  initDB()

  EventEmitter.call(this)
}

util.inherits(FileTinify, EventEmitter)

var db = {}
var isTinifying = false
var fileTinify = new FileTinify()

fileTinify.on('tinified', function(file) {
  console.log('on.tinified')
  fileFeed.update({_id: file._id}, file)
  doTinify()
})

fileFeed.on('change', function(message) {
  if (message.method == 'file-changed') {
    console.log('on.file-changed')
    doTinify()
  }
})

fileFeed.on('index', function() {
  console.log('on.index')
  doTinify()
})

fileFeed.on('skip', function(file) {
  file.stopWatching = false
  fileFeed.update({_id: file._id}, file)
})

function initDB() {
  var dbFilePath = 'database/md5.db'

  db = new NeDB({
    filename: dbFilePath,
    autoload: true,
    timestampData: true
  })
}

function doTinify() {
  fileFeed.getNextFile(function(err, file) {
    if (file) {
      tinifyFile(file)
    }
  })
}

function tinifyFile(file) {
  if (!fs.isFileSync(file.path)) {
    file.status = STATUS_EXPIRED
    fileTinify.emit('tinified', file)
    return
  }

  var sourceData = fs.readFileSync(file.path)
  var sourceMd5 = md5(sourceData)

  db.findOne({md5: sourceMd5}, function(err, existedMd5) {
    if (existedMd5) {
      file.status = STATUS_DONE
      file.toSize = file.fromSize
      fileTinify.emit('tinified', file)
      return
    }

    console.log('tinifying')

    tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
      console.log('tinified')

      if (err) {
        console.error(err)
        file.status = STATUS_ERROR
        file.errorMessage = err
        fileTinify.emit('tinified', file)
        return
      }

      var resultMd5 = md5(resultData)
      db.insert({
        md5: resultMd5,
        size: resultData.length
      }, function() {
        file.stopWatching = true
        fileFeed.update({_id: file._id}, file, {}, function() {
          fs.writeFile(file.path, resultData, function(err) {
            if (err) {
              console.error(err)
              return
            }

            console.log('writen')

            file.status = STATUS_DONE
            file.toSize = resultData.length
            fileTinify.emit('tinified', file)
          })
        })
      })
    })
  })
}

doTinify()

module.exports = fileTinify
