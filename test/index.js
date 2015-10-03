var test = require('tape');
var gspawn = require('../index.js');

test('bash call', function(t) {
    var p = gspawn({
        cmd: 'bash',
        args: ['-c', 'ls -l'],
        resolveCmd: true,
        collectStdout: true,
        logCall: true
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.ok(stdoutTxt.length > 0);
        t.is(stderrTxt.length, 0);
        t.is(exitCode, 0);
        t.end(err);
    });
    t.isNot(p, null);
});

test('expected exit code', function(t) {
    var p = gspawn({
        cmd: 'bash',
        args: ['-c', 'ls -l'],
        resolveCmd: true,
        collectStdout: true,
        logCall: true,
        expectedExitCode: 1
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.isNot(err, null);
        t.end();
    });
    t.isNot(p, null);
});

test('node call', function(t) {
    var p = gspawn({
        cmd: 'node',
        args: ['./test/test.js'],
        resolveCmd: true,
        collectStdout: true,
        collectStdoutMax: 15,
        collectStderr: true,
        logCall: true
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.ok(stdoutTxt.indexOf('Hello World!') >= 0);
        t.ok(stdoutTxt.indexOf('aaa') < 0);
        t.ok(stderrTxt.indexOf('Hmm!') >= 0);
        t.ok(stderrTxt.indexOf('bbb') >= 0);
        t.ok(stderrTxt.indexOf('aaa') < 0);
        t.is(exitCode, 0);
        t.end(err);
    });
});

test('log', function(t) {
    var p = gspawn({
        cmd: 'node',
        args: ['./test/test.js'],
        resolveCmd: true,
        logCall: true,
        log: function(data, source, defaultLog, options) {
            t.isNot(data, null);
            t.isNot(defaultLog, null);
            t.isNot(options, null);
            t.pass(source >=0 && source <= 2);
            defaultLog(data, source);
        }
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.is(exitCode, 0);
        t.end(err);
    });
});

test('timeout', function(t) {
    var p = gspawn({
        cmd: 'node',
        args: ['./test/long.js'],
        resolveCmd: true,
        logCall: true,
        timeout: 100
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.isNot(exitCode, 0);
        t.end(err);
    });
});

test('timeout 2', function(t) {
    var p = gspawn({
        cmd: 'node',
        resolveCmd: true,
        logCall: true,
        timeout: 200
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.isNot(exitCode, 0);
        t.end(err);
    });
});

test('error cmd', function(t) {
    var p = gspawn({
        cmd: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        logCall: true,
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.isNot(err, null);
        t.end();
    });
});

test('error cmd args', function(t) {
    var p = gspawn({
        cmd: 'node',
        args: 'aha.js',
        logCall: true,
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.isNot(err, null);
        t.end();
    });
});

test('env', function(t) {
    var txt = 'asasasasasasas';
    var env = Object.create(process.env);
    env.GSTEST = txt;

    var p = gspawn({
        cmd: 'node',
        args: './test/test.js',
        resolveCmd: true,
        logCall: true,
        collectStdout: true,
        options: { env: env }
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.ok(stdoutTxt.indexOf(txt) >= 0);
        t.end(err);
    });
});

test('npm run call', function(t) {
    var p = gspawn({
        cmd: 'npm',
        args: ['run', 'testCmd'],
        resolveCmd: true,
        collectStdout: true,
        collectStderr: true,
        logCall: true
    }, function(err, exitCode, signal, stdoutTxt, stderrTxt) {
        t.ok(stdoutTxt.indexOf('abc') >= 0);
        t.is(exitCode, 0);
        t.end(err);
    });
});