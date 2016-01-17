'use strict'

var fs = require('fs-plus')
var path = require('path')
var md5File = require('md5-file')
var NeDB = require('nedb')
var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

const STATUS_PENDING  = 'pending'
const STATUS_TINIFIED = 'tinified'
const STATUS_EXPIRED  = 'expired'

var db = {}
var config = {
  path: '/Users/yisheng/Downloads/images/'
}

if (!fs.existsSync(config.path)) {
  console.error(config.path + ' not existed.');
  return
}
if (!fs.isDirectorySync(config.path)) {
  console.error(config.path + ' is not a directory.')
  return
}

initDB()
// initIndex()
doTinify()

function initDB() {
  var dbFilePath = 'database/file.db'
  var dbMd5Path = 'database/md5.db'

  if (fs.isFileSync(dbFilePath)) {
    // fs.unlinkSync(dbFilePath)
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
        status: STATUS_PENDING
      })
    }
  })
}

function watch() {
  var watcherOptions = {
    "persistent": true,
    "recursive": true
  }
  var watcher = fs.watch(config.path, watcherOptions, (event, filename) => {
    if (!filename) {
      console.warn('Watcher doesn\'t return filename');
      return ;
    }
    if (isFileSupported(filename)) {
      // console.log(filename + ' is not an image');
      return ;
    }

    console.log('File changed. Event: ' + event + ' Filename: ' + config.path + filename);

    fs.stat(config.path + filename, (err, stats) => {
      if (err) {
        if (err.errno == -2) {
          console.error(config.path + ' not existed.');
        } else {
          throw err;
        }
      }

      return ;
    })
  })
}

function doTinify() {
  db.file.find({
    status: STATUS_PENDING
  }).sort({
    mtime: -1
  }).limit(1).exec(function(err, docs) {
    console.log(docs)
    if (docs.length) {

    }
  })
}

function isFileSupported(filename) {
  return ['.png', '.jpg', '.jpeg'].indexOf(path.extname(filename)) != -1
}

// var source = tinify.fromFile(path + 'a.png')
// source.toFile(path + 'ab.png')


/*
fs.readFile(path + 'a.png', function(error, sourceData) {
  if (error) {
    throw error;
  }

  console.log('Compressing file');

  tinify.fromBuffer(sourceData).toBuffer(function(error, resultData) {
    if (error) {
      throw error;
    }

    console.log('Writing file');

    fs.writeFile(path + 'a+.png', resultData, (error) => {
      if (error) {
        throw error;
      }

      console.log('Done');
    })
  })
})
*/
