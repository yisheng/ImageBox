'use strict'

var fs = require('fs')
var menubar = require('menubar')
var mb = menubar()

var tinify = require('tinify')
tinify.key = '_z1t0k4bk8k8pU0lBu9QUWZM8K16QSKR'

mb.on('ready', function ready() {
  console.log('App is ready')

  var path = '/Users/yisheng/Downloads/images/'
  // var source = tinify.fromFile(path + 'a.png')
  // source.toFile(path + 'ab.png')

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
})
