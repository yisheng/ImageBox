'use strict'

var fs = require('fs-plus')
var path = require('path')
var md5File = require('md5-file')
var PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-find'))
var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

const FILE_SCHEME = 'file/'
const MD5_SCHEME  = 'md5/'

var db = new PouchDB('./database/')
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

// 创建数据库索引
db.createIndex({
  index: {
    fields: ['isTinified']
  }
}).catch(function (error) {
  console.error(error)
});

// initIndex()

function initIndex() {
  db.allDocs({
    include_docs: true,
    startkey: FILE_SCHEME
  }).then(function(results) {
    // 清除历史文件记录
    var toDelete = []
    results.rows.forEach(function(row) {
      var doc = row.doc
      doc._deleted = true
      toDelete.push(doc)
    })
    return db.bulkDocs(toDelete)
  }).then(function(results) {
    // 重新索引文件
    var files = fs.listTreeSync(config.path)
    var toAdd = [];
    files.forEach(function(filePath) {
      if (isFileSupported(filePath)) {
        var stats = fs.statSync(filePath)
        toAdd.push({
          _id: FILE_SCHEME + filePath,
          mtime: stats.mtime,
          isTinified: Math.random() > 0.5
        })
      }
    })
    return db.bulkDocs(toAdd)
  // }).then(function(results) {
  //   return db.allDocs({include_docs: true})
  // }).then(function(results) {
  //   console.log(JSON.stringify(results))
  }).catch(function(err) {
    console.error(err)
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

function tinify() {
  db.find({
    selector: {
      isTinified: true
    }
  }).then(function(results) {
    console.log(results)
  }).catch(function(error) {
    console.error(error)
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
