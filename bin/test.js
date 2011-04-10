var exec = require('child_process').exec,
    request = require('request');

var p = 'klass';

// assume a package is already installed at this point

if (p == 'ender') {
  console.log('you can\'t put Ender in Ender! that\'s a really mean mind game');
}

exec('which npm', function (error, out) {
  console.log('npm found? ', /\/npm\/?/.test(out));
});

exec('which ender', function (error, out) {
  console.log('ender found? ', /\/ender\/?/.test(out));
});


exec('npm view ' + p, function (error, out) {
  if (!error) {
    var info = eval('(' + out + ')');

    if (!info.ender) {
      console.log('Sorry. ' + p + ' is not a published Ender package on NPM');
    }


    var url = info.repository.url.replace(/^(git:|http:)/, 'https:').replace(/\.git$/, '') + '/raw/master/';
    // https://github.com/ded/klass/raw/master/src/ender.js

    console.log('repo url ' + url);
    // console.log(info);
    var ender = url + info.ender;

    request({uri: ender}, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('successful request');
        console.log(body);
      } else {
        console.log('an Ender bridge file was not found at the repository URL');
      }
    });

  } else {
    console.log('errored :/');
  }
});


exec('npm ls installed', function (error, out, stderr) {
  if (!error) {
    var re = /(?:^|\n)([\w\-]+)@[\d\.]+(?:\s)/gi;
    var packages = out.match(re).map(function (p) {
      return p.replace(/\n|(@.+)/g, '');
    });

    var p = 'klass';
    var installed = false;
    for (var i = 0; i < packages.length; i++) {
      if (packages[i] == p) {
        var installed = true;
        console.log('already installed ' + p);
        break;
      }
    }
    if (!installed) {
      console.log('installing ' + p + '...');
      var cmd = 'npm install ' + p;
      var retry = false;
      function command(input) {
        if (retry) {
          console.log('could not install ' + p + '. trying sudo');
        }
        exec(input, function (error, out) {
          if (!error) {
            console.log('successful installation of ' + p);
          } else {
            retry = true;
            command('sudo ' + cmd);
          }
        });
      }
      command(cmd);
    }

  }
});