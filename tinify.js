'use strict'

var fs = require('fs-plus')
var path = require('path')
var md5File = require('md5-file')
var NeDB = require('nedb')
var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

const STATUS_PENDING  = 'pending'
const STATUS_TINIFIED = 'tinified'
const STATUS_TINIFYING = 'tinifying'
const STATUS_EXPIRED  = 'expired'

var db = {}
var config = {
  path: '/Users/yisheng/Downloads/images/'
}
var isTinifying = false

if (!fs.existsSync(config.path)) {
  console.error(config.path + ' not existed.');
  return
}
if (!fs.isDirectorySync(config.path)) {
  console.error(config.path + ' is not a directory.')
  return
}

initDB()
initIndex()
watch()
// doTinify()

function initDB() {
  var dbFilePath = 'database/file.db'
  var dbMd5Path = 'database/md5.db'

  if (fs.isFileSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath)
  }

  db.file = new NeDB({
    filename: dbFilePath,
    autoload: true,
    timestampData: true
  })

  db.md5 = new NeDB({
    filename: dbMd5Path,
    autoload: true,
    timestampData: true
  })
}

function initIndex() {
  var files = fs.listTreeSync(config.path)
  files.forEach(function(filePath) {
    if (isFileSupported(filePath)) {
      var stats = fs.statSync(filePath)
      db.file.insert({
        path: filePath,
        mtime: stats.mtime,
        status: STATUS_PENDING,
        fromSize: stats.size,
        toSize: 0
      })
    }
  })
}

function watch() {
  var watcherOptions = {
    "persistent": true,
    "recursive": true
  }
  var watcher = fs.watch(config.path, watcherOptions, function(event, filename) {
    if (!filename) {
      console.warn('Watcher doesn\'t return filename');
      return ;
    }
    if (!isFileSupported(filename)) {
      console.log(filename + ' is not an image');
      return ;
    }

    console.log('File changed. Event: ' + event + ' Filename: ' + config.path + filename);

    var filePath = config.path + filename
    if (fs.isFileSync(filePath)) {
      db.file.find({
        path: filePath
      }).sort({
        mtime: -1
      }).limit(1).exec(function(err, files) {
        var stats = fs.statSync(filePath)
        var file = {
          path: filePath,
          mtime: stats.mtime,
          status: STATUS_PENDING,
          fromSize: stats.size,
          toSize: 0
        }
        if (files.length > 0) {
          db.file.update({_id: files[0]._id}, file)
        } else {
          db.file.insert(file)
        }
      })
    } else {
      // Do nothing here
      // Deleted files will be handled before being tinified
    }
  })
}

function doTinify() {
  db.file.find({
    status: STATUS_PENDING
  }).sort({
    mtime: -1
  }).limit(1).exec(function(err, files) {
    console.log(files)
    if (files.length <= 0) {
      isTinifying = false
      return
    } else {
      tinifyFile(files[0])
    }
  })
}

function tinifyFile(file) {
  // TODO
  var onError = function() {

  }
  var onSuccess = function() {

  }

  if (!fs.isFileSync(file.path)) {
    db.file.update({_id: file._id}, {status: STATUS_EXPIRED})
    doTinify()
    return
  }

  var md5 = md5File(file.path)
  db.md5.find({
    md5: md5
  }).limit(1).exec(function(err, files) {
    if (files.length > 0) {
      db.file.update({_id: file._id}, {status: STATUS_TINIFIED, toSize: file.fromSize})
      doTinify()
      return
    }
  })

  fs.readFile(file.path, function(err, sourceData) {
    if (err) {
      console.error(err)
      return
    }

    tinify.fromBuffer(sourceData).toBuffer(function(err, resultData) {
      if (err) {
        console.error(err)
        return
      }

      fs.writeFile(file.path, resultData, function(err) {
        if (err) {
          console.error(err)
          return
        }

        db.file.update({_id: file._id}, {status: STATUS_TINIFIED, toSize: resultData.length})

        var md5 = md5File(file.path)
        db.md5.insert({
          md5: md5,
          size: resultData.length
        })

        doTinify()
      })
    })
  })
}

function isFileSupported(filename) {
  return ['.png', '.jpg', '.jpeg'].indexOf(path.extname(filename)) != -1
}
