// 静态服务器
const http = require('http');
const path = require('path');
const port = 4202
http.createServer(function (request, response) {
    if (request.url == '/') {
        filePath = path.join(__dirname, 'public/index.html')
    } else {
        filePath = path.join(__dirname, 'public' + request.url)
    }
    serveStatic(response, filePath)
}).listen(port, function () {
    console.log(`静态服务器端口已经启动在：${port}端口`)
})

var fs = require('fs')
var mime = require('mime')
var cache = {}

function send404(response) {
    response.writeHead(404, { 'Content-Type': 'text/html' })
    response.write('<h1>ERROR 404 FILE NOT FOUND</h1>')
    response.end()
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(200, { 'Content-Type': mime.getType(filePath) })
    response.end(fileContents)
}

function serveStatic(response, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath])
    } else {
        console.log(absPath)
        fs.exists(absPath, function (exists) {
            if (exists) {
                fs.readFile(absPath, function (err, data) {
                    if (err) {
                        send404(response)
                    } else {
                        cache[absPath] = data
                        sendFile(response, absPath, data)
                    }
                })
            } else {
                send404(response)
            }
        })
    }
}