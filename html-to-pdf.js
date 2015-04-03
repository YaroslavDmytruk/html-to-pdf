var child_process = require('child_process'),
    fs = require('fs'),
    UUIDGenerator = require('node-uuid'),
    debug = false,
    inputEncoding = null,
    outputEncoding = null;
var path = require('path');
var tmp = require('temporary');
var tmp_dir = new tmp.Dir().path;
console.log(tmp_dir);
exports.setDebug = function (newDebug) {
    debug = newDebug;
};

exports.setInputEncoding = function(enc) {
    inputEncoding = enc;
}

exports.setOutputEncoding = function(enc) {
    outputEncoding = enc;
}

exports.convertHTMLString = function (html, pdfPath, callback) {
    var self = this, uniqueID = UUIDGenerator.v4();
    var target = path.join(tmp_dir, uniqueID + '.html');
    fs.writeFile(target, html, function (err) {
        if (err) {
            callback(err)
        } else {
            self.convertHTMLFile(target, pdfPath, function (error, results) {
                if (error) {
                    callback(error);
                } else {
                    fs.unlink(target, function (deleteError) {
                        if (deleteError) {
                            callback(deleteError);
                        } else {
                            callback(null, results);
                        }
                    });
                }
            });
        }
    });
};

exports.convertHTMLFile = function (htmlPath, pdfPath, callback) {
    var args = ['-jar', __dirname + '/PDFRenderer.jar'];
    if (inputEncoding !== null) {
        args.push('--input-encoding', inputEncoding);
    }
    if (outputEncoding !== null) {
        args.push('--output-encoding', outputEncoding);
    }
    args.push(htmlPath, pdfPath);
    var renderer = child_process.spawn('java', args, {cwd: tmp_dir});
    renderer.on('error', function (error) {
        callback(error);
    });
    if (debug) {
        renderer.stdout.on('data', function (data) {
            console.log('STDOUT: ' + data);
        });
        renderer.stderr.on('data', function (data) {
            console.log('STDERR: ' + data);
        });
    }
    renderer.on('exit', function (code) {
        callback(null, {process_code: code});
    });
};
