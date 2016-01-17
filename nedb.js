'use strict'

var NeDB = require('nedb')
var db = {}
db.file = new NeDB({
  filename: 'database/file.db',
  autoload: true,
  timestampData: true
})

// var doc = {
//   name: 'yisheng2'
// }
// db.file.insert(doc, function(err, newDoc) {
//   console.log(newDoc)
// })

db.file.find({
}).sort({
  updatedAt: -1
}).exec(function(err, docs) {
  console.log(docs)
})
