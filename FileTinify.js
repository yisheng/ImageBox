'use strict'

const fs = require('fs-plus')
const EventEmitter = require('events')
const util = require('util')
const md5File = require('md5-file')
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

fileTinify.on('tinified', function(file, fields) {
  fileFeed.update({_id: file._id}, fields)
  doTinify()
})

// doTinify()

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
  console.log(file)

  if (!fs.isFileSync(file.path)) {
    fileTinify.emit('tinified', file, {status: STATUS_EXPIRED})
    return
  }

  db.findOne({md5: md5File(file.path)}, function(err, existedMd5) {
    if (existedMd5) {
      fileTinify.emit('tinified', file, {status: STATUS_DONE, toSize: file.fromSize})
      return
    }

    console.log('tinifying')

    var sourceData = fs.readFileSync(file.path)

    console.log(sourceData.length)

    tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
      console.log('tinified')

      if (err) {
        console.error(err)
        fileTinify.emit('tinified', file, {status: STATUS_ERROR, errorMessage: err})
        return
      }

      fs.writeFile(file.path, resultData, function(err) {
        db.insert({
          md5: md5File(file.path),
          size: resultData.length
        })

        fileTinify.emit('tinified', file, {status: STATUS_DONE, toSize: resultData.length})
      })
    })
  })
}

module.exports = fileTinify
