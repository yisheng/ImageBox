'use strict'

global.STATUS_PENDING = 'pending'
global.STATUS_DOING   = 'doing'
global.STATUS_DONE    = 'done'
global.STATUS_ERROR   = 'error'
global.STATUS_EXPIRED = 'expired'

var menubar = require('menubar')
var mb = menubar({preloadWindow:true})
var fileFeed = require('./FileFeed')
// var fileTinify = require('./FileTinify')

var window = null

mb.on('ready', function ready() {
  window = mb.window

  window.webContents.on('did-finish-load', function() {
    renderFileFeed()
  })

  fileFeed.on('change', function() {
    renderFileFeed()
  })
})

function renderFileFeed() {
  fileFeed.getAllFiles(function(err, files) {
    window.webContents.send('files', files)
    console.log(files.length)
    console.log(files[0].mtime)

    var date = new Date(files[0].mtime)
    console.log(date)
  })
}
