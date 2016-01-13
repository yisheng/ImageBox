'use strict'

var fs = require('fs')
var path = require('path')
var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

var config = {
  path: '/Users/yisheng/Downloads/images/'
}

fs.stat(config.path, (err, stat) => {
  if (err) {
    if (err.errno == -2) {
      console.error(config.path + ' not existed.');
    } else {
      throw err;
    }

    return ;
  }

  indexing()
  watch()
})

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
    if (isImageSupported(filename)) {
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

function tinify() {

}

function walk(path) {
  var fileList = [];
  function walking(path) {
    var dirList = fs.readdirSync(path);
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

function isImageSupported(filename) {
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
