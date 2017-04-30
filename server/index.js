'use strict';

var express = require('express'),
    console = require('console'),
    path = require('path'),
    app = module.exports = express();

app.use('/', express.static(path.join(__dirname, './')));
app.use('/dist', express.static(path.join(__dirname, '../dist')));

// Initialize server
app.set('port', (process.env.PORT || 8080));

if (module.parent === null) {
  app.listen(app.get('port'), function() {
    // This log line tells the browser-tests script the server is ready
    console.log('Server listening on port ', app.get('port'));
    console.log('Medallia Flow Animation available at http://localhost:%s', app.get('port'));
  });
}