//
// ShellJS
// Unix shell commands on top of Node's API
//
// Copyright (c) 2012 Artur Adib
// http://github.com/arturadib/shelljs
//

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    vm = require('vm'),
    child = require('child_process'),
    os = require('os');

// Node shims for < v0.7
fs.existsSync = fs.existsSync || path.existsSync;

var common = require('./src/common');
var config = common.config;
var state = common.state;
var platform = common.platform;
var ShellString = common.ShellString;
var parseOptions = common.parseOptions;
var log = common.log;
var error = common.error;
var expand = common.expand;
var _unlinkSync = common.unlinkSync;

//@
//@ All commands run synchronously, unless otherwise stated.
//@


//@
//@ ### cd('dir')
//@ Changes to directory `dir` for the duration of the script
var _cd = require('./src/cd');
exports.cd = wrap('cd', _cd);

//@
//@ ### pwd()
//@ Returns the current directory.
var _pwd = require('./src/pwd');
exports.pwd = wrap('pwd', _pwd);


//@
//@ ### ls([options ,] path [,path ...])
//@ ### ls([options ,] path_array)
//@ Available options:
//@
//@ + `-R`: recursive
//@ + `-A`: all files (include files beginning with `.`, except for `.` and `..`)
//@
//@ Examples:
//@
//@ ```javascript
//@ ls('projs/*.js');
//@ ls('-R', '/users/me', '/tmp');
//@ ls('-R', ['/users/me', '/tmp']); // same as above
//@ ```
//@
//@ Returns array of files in the given path, or in current directory if no path provided.
var _ls = require('./src/ls');
exports.ls = wrap('ls', _ls);


//@
//@ ### find(path [,path ...])
//@ ### find(path_array)
//@ Examples:
//@
//@ ```javascript
//@ find('src', 'lib');
//@ find(['src', 'lib']); // same as above
//@ find('.').filter(function(file) { return file.match(/\.js$/); });
//@ ```
//@
//@ Returns array of all files (however deep) in the given paths.
//@
//@ The main difference from `ls('-R', path)` is that the resulting file names
//@ include the base directories, e.g. `lib/resources/file1` instead of just `file1`.
var _find = require('./src/find');
exports.find = wrap('find', _find);


//@
//@ ### cp([options ,] source [,source ...], dest)
//@ ### cp([options ,] source_array, dest)
//@ Available options:
//@
//@ + `-f`: force
//@ + `-r, -R`: recursive
//@
//@ Examples:
//@
//@ ```javascript
//@ cp('file1', 'dir1');
//@ cp('-Rf', '/tmp/*', '/usr/local/*', '/home/tmp');
//@ cp('-Rf', ['/tmp/*', '/usr/local/*'], '/home/tmp'); // same as above
//@ ```
//@
//@ Copies files. The wildcard `*` is accepted.
var _cp = require('./src/cp');
exports.cp = wrap('cp', _cp);

//@
//@ ### rm([options ,] file [, file ...])
//@ ### rm([options ,] file_array)
//@ Available options:
//@
//@ + `-f`: force
//@ + `-r, -R`: recursive
//@
//@ Examples:
//@
//@ ```javascript
//@ rm('-rf', '/tmp/*');
//@ rm('some_file.txt', 'another_file.txt');
//@ rm(['some_file.txt', 'another_file.txt']); // same as above
//@ ```
//@
//@ Removes files. The wildcard `*` is accepted.
var _rm = require('./src/rm');
exports.rm = wrap('rm', _rm);

//@
//@ ### mv(source [, source ...], dest')
//@ ### mv(source_array, dest')
//@ Available options:
//@
//@ + `f`: force
//@
//@ Examples:
//@
//@ ```javascript
//@ mv('-f', 'file', 'dir/');
//@ mv('file1', 'file2', 'dir/');
//@ mv(['file1', 'file2'], 'dir/'); // same as above
//@ ```
//@
//@ Moves files. The wildcard `*` is accepted.
var _mv = require('./src/mv');
exports.mv = wrap('mv', _mv);

//@
//@ ### mkdir([options ,] dir [, dir ...])
//@ ### mkdir([options ,] dir_array)
//@ Available options:
//@
//@ + `p`: full path (will create intermediate dirs if necessary)
//@
//@ Examples:
//@
//@ ```javascript
//@ mkdir('-p', '/tmp/a/b/c/d', '/tmp/e/f/g');
//@ mkdir('-p', ['/tmp/a/b/c/d', '/tmp/e/f/g']); // same as above
//@ ```
//@
//@ Creates directories.
var _mkdir = require('./src/mkdir');
exports.mkdir = wrap('mkdir', _mkdir);

//@
//@ ### test(expression)
//@ Available expression primaries:
//@
//@ + `'-b', 'path'`: true if path is a block device
//@ + `'-c', 'path'`: true if path is a character device
//@ + `'-d', 'path'`: true if path is a directory
//@ + `'-e', 'path'`: true if path exists
//@ + `'-f', 'path'`: true if path is a regular file
//@ + `'-L', 'path'`: true if path is a symboilc link
//@ + `'-p', 'path'`: true if path is a pipe (FIFO)
//@ + `'-S', 'path'`: true if path is a socket
//@
//@ Examples:
//@
//@ ```javascript
//@ if (test('-d', path)) { /* do something with dir */ };
//@ if (!test('-f', path)) continue; // skip if it's a regular file
//@ ```
//@
//@ Evaluates expression using the available primaries and returns corresponding value.
var _test = require('./src/test');
exports.test = wrap('test', _test);


//@
//@ ### cat(file [, file ...])
//@ ### cat(file_array)
//@
//@ Examples:
//@
//@ ```javascript
//@ var str = cat('file*.txt');
//@ var str = cat('file1', 'file2');
//@ var str = cat(['file1', 'file2']); // same as above
//@ ```
//@
//@ Returns a string containing the given file, or a concatenated string
//@ containing the files if more than one file is given (a new line character is
//@ introduced between each file). Wildcard `*` accepted.
var _cat = require('./src/cat');
exports.cat = wrap('cat', _cat);

//@
//@ ### 'string'.to(file)
//@
//@ Examples:
//@
//@ ```javascript
//@ cat('input.txt').to('output.txt');
//@ ```
//@
//@ Analogous to the redirection operator `>` in Unix, but works with JavaScript strings (such as
//@ those returned by `cat`, `grep`, etc). _Like Unix redirections, `to()` will overwrite any existing file!_
var _to = require('./src/to');
String.prototype.to = wrap('to', _to);

//@
//@ ### sed([options ,] search_regex, replace_str, file)
//@ Available options:
//@
//@ + `-i`: Replace contents of 'file' in-place. _Note that no backups will be created!_
//@
//@ Examples:
//@
//@ ```javascript
//@ sed('-i', 'PROGRAM_VERSION', 'v0.1.3', 'source.js');
//@ sed(/.*DELETE_THIS_LINE.*\n/, '', 'source.js');
//@ ```
//@
//@ Reads an input string from `file` and performs a JavaScript `replace()` on the input
//@ using the given search regex and replacement string. Returns the new string after replacement.
var _sed = require('./src/sed');
exports.sed = wrap('sed', _sed);

//@
//@ ### grep([options ,] regex_filter, file [, file ...])
//@ ### grep([options ,] regex_filter, file_array)
//@ Available options:
//@
//@ + `-v`: Inverse the sense of the regex and print the lines not matching the criteria.
//@
//@ Examples:
//@
//@ ```javascript
//@ grep('-v', 'GLOBAL_VARIABLE', '*.js');
//@ grep('GLOBAL_VARIABLE', '*.js');
//@ ```
//@
//@ Reads input string from given files and returns a string containing all lines of the
//@ file that match the given `regex_filter`. Wildcard `*` accepted.
var _grep = require('./src/grep');
exports.grep = wrap('grep', _grep);


//@
//@ ### which(command)
//@
//@ Examples:
//@
//@ ```javascript
//@ var nodeExec = which('node');
//@ ```
//@
//@ Searches for `command` in the system's PATH. On Windows looks for `.exe`, `.cmd`, and `.bat` extensions.
//@ Returns string containing the absolute path to the command.
var _which = require('./src/which');
exports.which = wrap('which', _which);

//@
//@ ### echo(string [,string ...])
//@
//@ Examples:
//@
//@ ```javascript
//@ echo('hello world');
//@ var str = echo('hello world');
//@ ```
//@
//@ Prints string to stdout, and returns string with additional utility methods
//@ like `.to()`.
function _echo() {
  var messages = [].slice.call(arguments, 0);
  console.log.apply(this, messages);
  return ShellString(messages.join(' '));
}
exports.echo = _echo; // don't wrap() as it could parse '-options'

// Pushd/popd/dirs internals
var _dirStack = [];

function _isStackIndex(index) {
  return (/^[\-+]\d+$/).test(index);
}

function _parseStackIndex(index) {
  if (_isStackIndex(index)) {
    if (Math.abs(index) < _dirStack.length + 1) { // +1 for pwd
      return (/^-/).test(index) ? Number(index) - 1 : Number(index);
    } else {
      error(index + ': directory stack index out of range');
    }
  } else {
    error(index + ': invalid number');
  }
}

function _actualDirStack() {
  return [process.cwd()].concat(_dirStack);
}

//@
//@ ### dirs([options | '+N' | '-N'])
//@
//@ Available options:
//@
//@ + `-c`: Clears the directory stack by deleting all of the elements.
//@
//@ Arguments:
//@
//@ + `+N`: Displays the Nth directory (counting from the left of the list printed by dirs when invoked without options), starting with zero.
//@ + `-N`: Displays the Nth directory (counting from the right of the list printed by dirs when invoked without options), starting with zero.
//@
//@ Display the list of currently remembered directories. Returns an array of paths in the stack, or a single path if +N or -N was specified.
//@
//@ See also: pushd, popd
function _dirs(options, index) {
  if (_isStackIndex(options)) {
    index = options;
    options = '';
  }

  options = parseOptions(options, {
    'c' : 'clear'
  });

  if (options['clear']) {
    _dirStack = [];
    return _dirStack;
  }

  var stack = _actualDirStack();

  if (index) {
    index = _parseStackIndex(index);

    if (index < 0) {
      index = stack.length + index;
    }

    log(stack[index]);
    return stack[index];
  }

  log(stack.join(' '));

  return stack;
}
exports.dirs = wrap("dirs", _dirs);

//@
//@ ### pushd([options,] [dir | '-N' | '+N'])
//@
//@ Available options:
//@
//@ + `-n`: Suppresses the normal change of directory when adding directories to the stack, so that only the stack is manipulated.
//@
//@ Arguments:
//@
//@ + `dir`: Makes the current working directory be the top of the stack, and then executes the equivalent of `cd dir`.
//@ + `+N`: Brings the Nth directory (counting from the left of the list printed by dirs, starting with zero) to the top of the list by rotating the stack.
//@ + `-N`: Brings the Nth directory (counting from the right of the list printed by dirs, starting with zero) to the top of the list by rotating the stack.
//@
//@ Examples:
//@
//@ ```javascript
//@ // process.cwd() === '/usr'
//@ pushd('/etc'); // Returns /etc /usr
//@ pushd('+1');   // Returns /usr /etc
//@ ```
//@
//@ Save the current directory on the top of the directory stack and then cd to `dir`. With no arguments, pushd exchanges the top two directories. Returns an array of paths in the stack.
function _pushd(options, dir) {
  if (_isStackIndex(options)) {
    dir = options;
    options = '';
  }

  options = parseOptions(options, {
    'n' : 'no-cd'
  });

  var dirs = _actualDirStack();

  if (dir === '+0') {
    return dirs; // +0 is a noop
  } else if (!dir) {
    if (dirs.length > 1) {
      dirs = dirs.splice(1, 1).concat(dirs);
    } else {
      return error('no other directory');
    }
  } else if (_isStackIndex(dir)) {
    var n = _parseStackIndex(dir);
    dirs = dirs.slice(n).concat(dirs.slice(0, n));
  } else {
    if (options['no-cd']) {
      dirs.splice(1, 0, dir);
    } else {
      dirs.unshift(dir);
    }
  }

  if (options['no-cd']) {
    dirs = dirs.slice(1);
  } else {
    dir = path.resolve(dirs.shift());
    _cd('', dir);
  }

  _dirStack = dirs;
  return _dirs('');
}
exports.pushd = wrap('pushd', _pushd);

//@
//@ ### popd([options,] ['-N' | '+N'])
//@
//@ Available options:
//@
//@ + `-n`: Suppresses the normal change of directory when removing directories from the stack, so that only the stack is manipulated.
//@
//@ Arguments:
//@
//@ + `+N`: Removes the Nth directory (counting from the left of the list printed by dirs), starting with zero.
//@ + `-N`: Removes the Nth directory (counting from the right of the list printed by dirs), starting with zero.
//@
//@ Examples:
//@
//@ ```javascript
//@ echo(process.cwd()); // '/usr'
//@ pushd('/etc');       // '/etc /usr'
//@ echo(process.cwd()); // '/etc'
//@ popd();              // '/usr'
//@ echo(process.cwd()); // '/usr'
//@ ```
//@
//@ When no arguments are given, popd removes the top directory from the stack and performs a cd to the new top directory. The elements are numbered from 0 starting at the first directory listed with dirs; i.e., popd is equivalent to popd +0. Returns an array of paths in the stack.
function _popd(options, index) {
  if (_isStackIndex(options)) {
    index = options;
    options = '';
  }

  options = parseOptions(options, {
    'n' : 'no-cd'
  });

  if (!_dirStack.length) {
    return error('directory stack empty');
  }

  index = _parseStackIndex(index || '+0');

  if (options['no-cd'] || index > 0 || _dirStack.length + index === 0) {
    index = index > 0 ? index - 1 : index;
    _dirStack.splice(index, 1);
  } else {
    var dir = path.resolve(_dirStack.shift());
    _cd('', dir);
  }

  return _dirs('');
}
exports.popd = wrap("popd", _popd);

//@
//@ ### exit(code)
//@ Exits the current process with the given exit code.
exports.exit = process.exit;

//@
//@ ### env['VAR_NAME']
//@ Object containing environment variables (both getter and setter). Shortcut to process.env.
exports.env = process.env;

//@
//@ ### exec(command [, options] [, callback])
//@ Available options (all `false` by default):
//@
//@ + `async`: Asynchronous execution. Defaults to true if a callback is provided.
//@ + `silent`: Do not echo program output to console.
//@
//@ Examples:
//@
//@ ```javascript
//@ var version = exec('node --version', {silent:true}).output;
//@
//@ var child = exec('some_long_running_process', {async:true});
//@ child.stdout.on('data', function(data) {
//@   /* ... do something with data ... */
//@ });
//@
//@ exec('some_long_running_process', function(code, output) {
//@   console.log('Exit code:', code);
//@   console.log('Program output:', output);
//@ });
//@ ```
//@
//@ Executes the given `command` _synchronously_, unless otherwise specified.
//@ When in synchronous mode returns the object `{ code:..., output:... }`, containing the program's
//@ `output` (stdout + stderr)  and its exit `code`. Otherwise returns the child process object, and
//@ the `callback` gets the arguments `(code, output)`.
//@
//@ **Note:** For long-lived processes, it's best to run `exec()` asynchronously as
//@ the current synchronous implementation uses a lot of CPU. This should be getting
//@ fixed soon.
function _exec(command, options, callback) {
  if (!command)
    error('must specify command');

  // Callback is defined instead of options.
  if (typeof options === 'function') {
    callback = options;
    options = { async: true };
  }

  // Callback is defined with options.
  if (typeof options === 'object' && typeof callback === 'function') {
    options.async = true;
  }

  options = extend({
    silent: config.silent,
    async: false
  }, options);

  if (options.async)
    return execAsync(command, options, callback);
  else
    return execSync(command, options);
}
exports.exec = wrap('exec', _exec, {notUnix:true});

var PERMS = (function (base) {
  return {
    OTHER_EXEC  : base.EXEC,
    OTHER_WRITE : base.WRITE,
    OTHER_READ  : base.READ,

    GROUP_EXEC  : base.EXEC  << 3,
    GROUP_WRITE : base.WRITE << 3,
    GROUP_READ  : base.READ << 3,

    OWNER_EXEC  : base.EXEC << 6,
    OWNER_WRITE : base.WRITE << 6,
    OWNER_READ  : base.READ << 6,

    // Literal octal numbers are apparently not allowed in "strict" javascript.  Using parseInt is
    // the preferred way, else a jshint warning is thrown.
    STICKY      : parseInt('01000', 8),
    SETGID      : parseInt('02000', 8),
    SETUID      : parseInt('04000', 8),

    TYPE_MASK   : parseInt('0770000', 8)
  };
})({
  EXEC  : 1,
  WRITE : 2,
  READ  : 4
});


//@
//@ ### chmod(octal_mode || octal_string, file)
//@ ### chmod(symbolic_mode, file)
//@
//@ Available options:
//@
//@ + `-v`: output a diagnostic for every file processed//@
//@ + `-c`: like verbose but report only when a change is made//@
//@ + `-R`: change files and directories recursively//@
//@
//@ Examples:
//@
//@ ```javascript
//@ chmod(755, '/Users/brandon');
//@ chmod('755', '/Users/brandon'); // same as above
//@ chmod('u+x', '/Users/brandon');
//@ ```
//@
//@ Alters the permissions of a file or directory by either specifying the
//@ absolute permissions in octal form or expressing the changes in symbols.
//@ This command tries to mimic the POSIX behavior as much as possible.
//@ Notable exceptions:
//@
//@ + In symbolic modes, 'a-r' and '-r' are identical.  No consideration is
//@   given to the umask.
//@ + There is no "quiet" option since default behavior is to run silent.
function _chmod(options, mode, filePattern) {
  if (!filePattern) {
    if (options.length > 0 && options.charAt(0) === '-') {
      // Special case where the specified file permissions started with - to subtract perms, which
      // get picked up by the option parser as command flags.
      // If we are down by one argument and options starts with -, shift everything over.
      filePattern = mode;
      mode = options;
      options = '';
    }
    else {
      error('You must specify a file.');
    }
  }

  options = parseOptions(options, {
    'R': 'recursive',
    'c': 'changes',
    'v': 'verbose'
  });

  if (typeof filePattern === 'string') {
    filePattern = [ filePattern ];
  }

  var files;

  if (options.recursive) {
    files = [];
    expand(filePattern).forEach(function addFile(expandedFile) {
      var stat = fs.lstatSync(expandedFile);

      if (!stat.isSymbolicLink()) {
        files.push(expandedFile);

        if (stat.isDirectory()) {  // intentionally does not follow symlinks.
          fs.readdirSync(expandedFile).forEach(function (child) {
            addFile(expandedFile + '/' + child);
          });
        }
      }
    });
  }
  else {
    files = expand(filePattern);
  }

  files.forEach(function innerChmod(file) {
    file = path.resolve(file);
    if (!fs.existsSync(file)) {
      error('File not found: ' + file);
    }

    // When recursing, don't follow symlinks.
    if (options.recursive && fs.lstatSync(file).isSymbolicLink()) {
      return;
    }

    var perms = fs.statSync(file).mode;
    var type = perms & PERMS.TYPE_MASK;

    var newPerms = perms;

    if (isNaN(parseInt(mode, 8))) {
      // parse options
      mode.split(',').forEach(function (symbolicMode) {
        /*jshint regexdash:true */
        var pattern = /([ugoa]*)([=\+-])([rwxXst]*)/i;
        var matches = pattern.exec(symbolicMode);

        if (matches) {
          var applyTo = matches[1];
          var operator = matches[2];
          var change = matches[3];

          var changeOwner = applyTo.indexOf('u') != -1 || applyTo === 'a' || applyTo === '';
          var changeGroup = applyTo.indexOf('g') != -1 || applyTo === 'a' || applyTo === '';
          var changeOther = applyTo.indexOf('o') != -1 || applyTo === 'a' || applyTo === '';

          var changeRead   = change.indexOf('r') != -1;
          var changeWrite  = change.indexOf('w') != -1;
          var changeExec   = change.indexOf('x') != -1;
          var changeSticky = change.indexOf('t') != -1;
          var changeSetuid = change.indexOf('s') != -1;

          var mask = 0;
          if (changeOwner) {
            mask |= (changeRead ? PERMS.OWNER_READ : 0) + (changeWrite ? PERMS.OWNER_WRITE : 0) + (changeExec ? PERMS.OWNER_EXEC : 0) + (changeSetuid ? PERMS.SETUID : 0);
          }
          if (changeGroup) {
            mask |= (changeRead ? PERMS.GROUP_READ : 0) + (changeWrite ? PERMS.GROUP_WRITE : 0) + (changeExec ? PERMS.GROUP_EXEC : 0) + (changeSetuid ? PERMS.SETGID : 0);
          }
          if (changeOther) {
            mask |= (changeRead ? PERMS.OTHER_READ : 0) + (changeWrite ? PERMS.OTHER_WRITE : 0) + (changeExec ? PERMS.OTHER_EXEC : 0);
          }

          // Sticky bit is special - it's not tied to user, group or other.
          if (changeSticky) {
            mask |= PERMS.STICKY;
          }

          switch (operator) {
            case '+':
              newPerms |= mask;
              break;

            case '-':
              newPerms &= ~mask;
              break;

            case '=':
              newPerms = type + mask;

              // According to POSIX, when using = to explicitly set the permissions, setuid and setgid can never be cleared.
              if (fs.statSync(file).isDirectory()) {
                newPerms |= (PERMS.SETUID + PERMS.SETGID) & perms;
              }
              break;
          }

          if (options.verbose) {
            log(file + ' -> ' + newPerms.toString(8));
          }

          if (perms != newPerms) {
            if (!options.verbose && options.changes) {
              log(file + ' -> ' + newPerms.toString(8));
            }
            fs.chmodSync(file, newPerms);
          }
        }
        else {
          error('Invalid symbolic mode change: ' + symbolicMode);
        }
      });
    }
    else {
      // they gave us a full number
      newPerms = type + parseInt(mode, 8);

      // POSIX rules are that setuid and setgid can only be added using numeric form, but not cleared.
      if (fs.statSync(file).isDirectory()) {
        newPerms |= (PERMS.SETUID + PERMS.SETGID) & perms;
      }

      fs.chmodSync(file, newPerms);
    }
  });
}
exports.chmod = wrap('chmod', _chmod);


//@
//@ ## Configuration
//@



exports.config = config;

//@
//@ ### config.silent
//@ Example:
//@
//@ ```javascript
//@ var silentState = config.silent; // save old silent state
//@ config.silent = true;
//@ /* ... */
//@ config.silent = silentState; // restore old silent state
//@ ```
//@
//@ Suppresses all command output if `true`, except for `echo()` calls.
//@ Default is `false`.

//@
//@ ### config.fatal
//@ Example:
//@
//@ ```javascript
//@ config.fatal = true;
//@ cp('this_file_does_not_exist', '/dev/null'); // dies here
//@ /* more commands... */
//@ ```
//@
//@ If `true` the script will die on errors. Default is `false`.




//@
//@ ## Non-Unix commands
//@






//@
//@ ### tempdir()
//@ Searches and returns string containing a writeable, platform-dependent temporary directory.
//@ Follows Python's [tempfile algorithm](http://docs.python.org/library/tempfile.html#tempfile.tempdir).
exports.tempdir = wrap('tempdir', tempDir);


//@
//@ ### error()
//@ Tests if error occurred in the last command. Returns `null` if no error occurred,
//@ otherwise returns string explaining the error
exports.error = function() {
  return state.error;
};





////////////////////////////////////////////////////////////////////////////////////////////////
//
// Auxiliary functions (internal use only)
//

function deprecate(what, msg) {
  console.log('*** ShellJS.'+what+': This function is deprecated.', msg);
}

function write(msg) {
  if (!config.silent)
    process.stdout.write(msg);
}

// Common wrapper for all Unix-like commands
function wrap(cmd, fn, options) {
  return function() {
    var retValue = null;

    state.currentCmd = cmd;
    state.error = null;

    try {
      var args = [].slice.call(arguments, 0);

      if (options && options.notUnix) {
        retValue = fn.apply(this, args);
      } else {
        if (args.length === 0 || typeof args[0] !== 'string' || args[0][0] !== '-')
          args.unshift(''); // only add dummy option if '-option' not already present
        retValue = fn.apply(this, args);
      }
    } catch (e) {
      if (!state.error) {
        // If state.error hasn't been set it's an error thrown by Node, not us - probably a bug...
        console.log('shell.js: internal error');
        console.log(e.stack || e);
        process.exit(1);
      }
      if (config.fatal)
        throw e;
    }

    state.currentCmd = 'shell.js';
    return retValue;
  };
} // wrap

// e.g. 'shelljs_a5f185d0443ca...'
function randomFileName() {
  function randomHash(count) {
    if (count === 1)
      return parseInt(16*Math.random(), 10).toString(16);
    else {
      var hash = '';
      for (var i=0; i<count; i++)
        hash += randomHash(1);
      return hash;
    }
  }

  return 'shelljs_'+randomHash(20);
}

// Returns false if 'dir' is not a writeable directory, 'dir' otherwise
function writeableDir(dir) {
  if (!dir || !fs.existsSync(dir))
    return false;

  if (!fs.statSync(dir).isDirectory())
    return false;

  var testFile = dir+'/'+randomFileName();
  try {
    fs.writeFileSync(testFile, ' ');
    _unlinkSync(testFile);
    return dir;
  } catch (e) {
    return false;
  }
}

// Cross-platform method for getting an available temporary directory.
// Follows the algorithm of Python's tempfile.tempdir
// http://docs.python.org/library/tempfile.html#tempfile.tempdir
function tempDir() {
  if (state.tempDir)
    return state.tempDir; // from cache

  state.tempDir = writeableDir(os.tempDir && os.tempDir()) || // node 0.8+
                  writeableDir(process.env['TMPDIR']) ||
                  writeableDir(process.env['TEMP']) ||
                  writeableDir(process.env['TMP']) ||
                  writeableDir(process.env['Wimp$ScrapDir']) || // RiscOS
                  writeableDir('C:\\TEMP') || // Windows
                  writeableDir('C:\\TMP') || // Windows
                  writeableDir('\\TEMP') || // Windows
                  writeableDir('\\TMP') || // Windows
                  writeableDir('/tmp') ||
                  writeableDir('/var/tmp') ||
                  writeableDir('/usr/tmp') ||
                  writeableDir('.'); // last resort

  return state.tempDir;
}

// Wrapper around exec() to enable echoing output to console in real time
function execAsync(cmd, opts, callback) {
  var output = '';

  var options = extend({
    silent: config.silent
  }, opts);

  var c = child.exec(cmd, {env: process.env, maxBuffer: 20*1024*1024}, function(err) {
    if (callback)
      callback(err ? err.code : 0, output);
  });

  c.stdout.on('data', function(data) {
    output += data;
    if (!options.silent)
      process.stdout.write(data);
  });

  c.stderr.on('data', function(data) {
    output += data;
    if (!options.silent)
      process.stdout.write(data);
  });

  return c;
}

// Hack to run child_process.exec() synchronously (sync avoids callback hell)
// Uses a custom wait loop that checks for a flag file, created when the child process is done.
// (Can't do a wait loop that checks for internal Node variables/messages as
// Node is single-threaded; callbacks and other internal state changes are done in the
// event loop).
function execSync(cmd, opts) {
  var stdoutFile = path.resolve(tempDir()+'/'+randomFileName()),
      codeFile = path.resolve(tempDir()+'/'+randomFileName()),
      scriptFile = path.resolve(tempDir()+'/'+randomFileName()),
      sleepFile = path.resolve(tempDir()+'/'+randomFileName());

  var options = extend({
    silent: config.silent
  }, opts);

  var previousStdoutContent = '';
  // Echoes stdout changes from running process, if not silent
  function updateStdout() {
    if (options.silent || !fs.existsSync(stdoutFile))
      return;

    var stdoutContent = fs.readFileSync(stdoutFile, 'utf8');
    // No changes since last time?
    if (stdoutContent.length <= previousStdoutContent.length)
      return;

    process.stdout.write(stdoutContent.substr(previousStdoutContent.length));
    previousStdoutContent = stdoutContent;
  }

  function escape(str) {
    return (str+'').replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0");
  }

  cmd += ' > '+stdoutFile+' 2>&1'; // works on both win/unix

  var script =
   "var child = require('child_process')," +
   "     fs = require('fs');" +
   "child.exec('"+escape(cmd)+"', {env: process.env, maxBuffer: 20*1024*1024}, function(err) {" +
   "  fs.writeFileSync('"+escape(codeFile)+"', err ? err.code.toString() : '0');" +
   "});";

  if (fs.existsSync(scriptFile)) _unlinkSync(scriptFile);
  if (fs.existsSync(stdoutFile)) _unlinkSync(stdoutFile);
  if (fs.existsSync(codeFile)) _unlinkSync(codeFile);

  fs.writeFileSync(scriptFile, script);
  child.exec('"'+process.execPath+'" '+scriptFile, {
    env: process.env,
    cwd: exports.pwd(),
    maxBuffer: 20*1024*1024
  });

  // The wait loop
  // sleepFile is used as a dummy I/O op to mitigate unnecessary CPU usage
  // (tried many I/O sync ops, writeFileSync() seems to be only one that is effective in reducing
  // CPU usage, though apparently not so much on Windows)
  while (!fs.existsSync(codeFile)) { updateStdout(); fs.writeFileSync(sleepFile, 'a'); }
  while (!fs.existsSync(stdoutFile)) { updateStdout(); fs.writeFileSync(sleepFile, 'a'); }

  // At this point codeFile exists, but it's not necessarily flushed yet.
  // Keep reading it until it is.
  var code = parseInt('', 10);
  while (isNaN(code)) {
    code = parseInt(fs.readFileSync(codeFile, 'utf8'), 10);
  }

  var stdout = fs.readFileSync(stdoutFile, 'utf8');

  // No biggie if we can't erase the files now -- they're in a temp dir anyway
  try { _unlinkSync(scriptFile); } catch(e) {}
  try { _unlinkSync(stdoutFile); } catch(e) {}
  try { _unlinkSync(codeFile); } catch(e) {}
  try { _unlinkSync(sleepFile); } catch(e) {}

  // True if successful, false if not
  var obj = {
    code: code,
    output: stdout
  };
  return obj;
} // execSync()

// extend(target_obj, source_obj1 [, source_obj2 ...])
// Shallow extend, e.g.:
//    extend({A:1}, {b:2}, {c:3}) returns {A:1, b:2, c:3}
function extend(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function(source) {
    for (var key in source)
      target[key] = source[key];
  });

  return target;
}
