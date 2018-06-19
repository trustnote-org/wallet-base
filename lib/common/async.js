'use strict'


var async = require('async');
var openFiles = ['1', '2', '3'];

async.eachSeries(openFiles, function(file, callback) {

    // Perform operation on file here.
    console.log('Processing file ' + file);

    if( file.length > 32 ) {
      console.log('This file name is too long');
      callback('File name too long');
    } else {
      // Do work to process file here
      console.log('File processed', file);
      // callback(file);
      let err = null;
      if (file == '2') {
        err = file;
      }
      callback(err);
    }
}, function(err) {
    // if any of the file processing produced an error, err would equal that error
    if( err ) {
      // One of the iterations produced an error.
      // All processing will now stop.
      console.log('A file failed to process',err);
    } else {
      console.log('All files have been processed successfully');
    }
});