'use strict'

var fs = require('fs')
var menubar = require('menubar')
var mb = menubar({preloadWindow:true})

mb.on('ready', function ready() {
  var window = mb.window
  window.webContents.on('did-finish-load', function() {
    window.webContents.send('ping', [{name:'yisheng'}])
  })
})
