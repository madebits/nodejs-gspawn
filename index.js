"use strict";

var spawn = require('child_process').spawn
    , path = require('path')
    , which = require('which')
    ;

var defaultLogger = function(data, source) {
    if(!data) return data;
    if(data.endsWith('\r\n')) data = data.substr(0, data.length - 2);
    else if(data.endsWith('\n')) data = data.substr(0, data.length - 1);
    if((source === 2) || (source === 4)) console.error(data);
    else console.log(data);
};

var toArray = function (o) {
    if(!o) return [];
    if(!Array.isArray(o)) {
        o = [ o ];
    }
    return o;
}

var gspawn = function (options, cb) {

    var _this = this;
    var stdOutTxt = [];
    var stdErrTxt = [];
    var cbCalled = false;

    var log = function (data, source) {
        if (options.log) {
            options.log(data, source, defaultLogger);
            return;
        }
        else defaultLogger(data, source);
    };

    var doneCb = function (err, exitCode, signal) {
        if (cbCalled) return;
        cbCalled = true;
        if(err && options.logCall) {
            log(err.toString(), 4);
        }
        if (cb) {
            process.nextTick(function () {
                cb(err, exitCode, signal, stdOutTxt.join(''), stdErrTxt.join(''));
            });
        }
    };

    if (!options || !options.cmd) {
        doneCb(new Error('No cmd'));
        return;
    }

    try {

        var tool = options.resolveCmd ? which.sync(options.cmd) : path.resolve(options.cmd);
        var toolArgs = toArray(options.args);
        var toolArgsStr = toolArgs.join(' ');
        var toolOptions = options.options || {};
        if(options.autoCwd) toolOptions.cwd = path.dirname(tool);

        if(options.logCall) {
            log(tool + ' ' + toolArgsStr, 3);
        }

        var proc = spawn(tool, toolArgs, toolOptions);

        var timerHandle = null;
        if (options.timeout) {
            timerHandle = setTimeout(function () {
                try {
                    proc.kill();
                } catch (ex) {
                    log(ex.toString(), 0);
                }
            }, options.timeout);
        }
        var clearTimer = function () {
            if (timerHandle) {
                clearTimeout(timerHandle);
                timerHandle = null;
            }
        };

        var encoding = options.enc ? options.enc : 'utf8';
        proc.stdout.setEncoding(encoding);
        proc.stderr.setEncoding(encoding);

        proc.stdout.on('data', function (data) {
            if (options.collectStdout) {
                stdOutTxt.push(data);
            }
            log(data, 1);
        });

        proc.stderr.on('data', function (data) {
            if (options.collectStderr) {
                stdErrTxt.push(data);
            }
            log(data, 2);
        });

        proc.on('error', function (err) {
            clearTimer();
            if (!err) err = new Error('Failed');
            doneCb(err);
        });

        proc.on('close', function (exitCode, signal) {
            clearTimer();
            var errMsg = 'Failed: ' + tool + ' ' + toolArgsStr + ' ExitCode: ' + exitCode + (toolOptions.cwd ? ' WorkingDir: ' + toolOptions.cwd : '');
            var err = exitCode === null ? new Error(errMsg) : null;
            if (!err
                && options.hasOwnProperty('expectedExitCode')
                && (options.expectedExitCode !== exitCode)) {
                err = new Error(errMsg);
            }
            doneCb(err, exitCode, signal);
        });

        return proc;

    } catch (ex) {
        doneCb(ex);
    }

    return null;
};

module.exports = gspawn;