'use strict'

global.STATUS_PENDING = 'pending'
global.STATUS_DOING   = 'doing'
global.STATUS_DONE    = 'done'
global.STATUS_ERROR   = 'error'
global.STATUS_EXPIRED = 'expired'

const menubar = require('menubar')
const mb = menubar({
  'preloadWindow': true,
  'always-on-top': true
})
const fileFeed = require('./FileFeed')
const fileTinify = require('./FileTinify')
const config = require('./Config')
const electron = require('electron')

var window = null

mb.on('ready', function ready() {
  window = mb.window

  window.webContents.on('did-finish-load', function() {
    renderFileFeed()
  })

  fileFeed.on('change', function(message) {
    renderFileFeed()
  })

  electron.ipcMain.on('chooseDirectory', function(event) {
    chooseDirectory()
  })
})

function renderFileFeed() {
  fileFeed.getAllFiles(function(err, files) {
    window.webContents.send('files', files)
  })
}

function chooseDirectory() {
  electron.dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function(directory) {
    if (directory) {
      config.set('directory', directory['0'] + '/')
    }
  })
}
