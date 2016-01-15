'use strict'

var fs = require('fs-plus')
var path = require('path')
var md5File = require('md5-file')
var PouchDB = require('pouchdb');
var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

const FILE_SCHEME = 'file://'
const MD5_SCHEME  = 'md5://'

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

var db = new PouchDB('database')

initIndex()

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
          mtime: stats.mtime
        })
      }
    })
    return db.bulkDocs(toAdd)
  // }).then(function(results) {
  //   return db.allDocs()
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

function indexing() {
  var fileList = walk(config.path);
  console.log(fileList);
}

function walk(path) {
  var fileList = [];
  function walking(path) {
    var dirList = fs.readdirSync(path);
    console.log(dirList);
    dirList.forEach(function(item) {
      if(fs.statSync(path + '/' + item).isDirectory()){
        walking(path + '/' + item);
      }else{
        fileList.push(path + '/' + item);
      }
    })
  }

  walking(path);

  return fileList;
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
