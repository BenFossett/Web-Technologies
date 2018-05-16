// Run a node.js web server for local development of a static web site.
// Start with "node server.js" and put pages in a "public" sub-folder.
// Visit the site at the address printed on the console.

// The server is configured to be platform independent.  URLs are made lower
// case, so the server is case insensitive even on Linux, and paths containing
// upper case letters are banned so that the file system is treated as case
// sensitive even on Windows.  All .html files are delivered as
// application/xhtml+xml for instant feedback on XHTML errors.  To improve the
// server, either add content negotiation (so old browsers can be tested) or
// switch to text/html and do validity checking another way (e.g. with vnu.jar).

// Choose a port, e.g. change the port to the default 80, if there are no
// privilege issues and port number 80 isn't already in use. Choose verbose to
// list banned files (with upper case letters) on startup.
"use strict";

var port = 8080;
var verbose = true;

// Load the library modules, and define the global constants.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// Start the server:

var http = require("http");
var fs = require("fs");
var crypto = require("crypto");

var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;

// Load the database
var sql = require("sqlite3");
var db = new sql.Database("data.db");

db.serialize(create);

// Prepared statements
var selectBoardName = db.prepare("select name from boards where bId=?");
var selectThreadName = db.prepare("select name from threads where tId=?");

var selectAllBoards = db.prepare("select * from boards");
var selectPopularThreads = db.prepare("select threads.name, posts.tId, count(*) as c from threads inner join posts on threads.tId = posts.tId group by posts.tId having c >= 0 order by c desc");
var selectBoardThreads = db.prepare("select threads.tId, threads.name, threads.creationDate, count(*) as c from threads inner join posts on threads.tId = posts.tId where threads.bId = ? group by posts.tId having c >= 0");
var selectThreadPosts = db.prepare("select posts.content, posts.creationDate, users.name from posts inner join users on posts.uId = users.uId where tId=?");

var insertSession = db.prepare("insert into sessions (session) values (?)");


// Start the http service. Accept only requests from localhost, for security.
function start() {
    if (! checkSite()) return;
    types = defineTypes();
    banned = [];
    banUpperCase("./public/", "");
    banTraversal();
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80) address = address + ":" + port;
    console.log("Server running at", address);
}

// Check that the site folder and index page exist.
function checkSite() {
    var path = "./public";
    var ok = fs.existsSync(path);
    if (ok) path = "./public/index.html";
    if (ok) ok = fs.existsSync(path);
    if (! ok) console.log("Can't find", path);
    return ok;
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();
    var cookie = request.headers["Cookie"];
    checkCookie(cookie, response);
    console.log("url=", url);
    if (url.endsWith("/")) url = url + "index.html";
    if (url == "/boards") return getBoardList(response);
    if (url == "/popularthreads") return getPopularThreads(response);
    if (url.startsWith("/board.html")) return getBoard(url, response);
    if (url.startsWith("/threadslist")) return getThreadList(url, response);
    if (url.startsWith("/thread.html")) return getThread(url, response);
    if (url.startsWith("/postslist")) return getPostList(url, response);
    if (url == "/newsession") return createNewSession(response);
    if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
    var type = findType(url);
    if (type == null) return fail(response, BadType, "File type unsupported");
    var file = "./public" + url;
    fs.readFile(file, ready);
    function ready(err, content) { deliver(response, type, err, content); }
}

function checkCookie(cookie, response) {
  var hasSession = false;

  if(hasSession == true) {
    session = name + "=" + value;
    response.addHeader("Set-Cookie", session);
  }

  if(hasSession == false) {
    var session = crypto.randomBytes(16).toString('hex');
    insertSession.all(session);
    response["set-cookie", "session"] = session;
  }
}

// Forbid any resources which shouldn't be delivered to the browser.
function isBanned(url) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b)) return true;
    }
    return false;
}

function banTraversal() {
  banned.push("/./");
  banned.push("/../");
  banned.push("//");
}

// Find the content type to respond with, or undefined.
function findType(url) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, err, content) {
    if (err) return fail(response, NotFound, "File not found");
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

// Check a folder for files/subfolders with non-lowercase names.  Add them to
// the banned list so they don't get delivered, making the site case sensitive,
// so that it can be moved from Windows to Linux, for example. Synchronous I/O
// is used because this function is only called during startup.  This avoids
// expensive file system operations during normal execution.  A file with a
// non-lowercase name added while the server is running will get delivered, but
// it will be detected and banned when the server is next restarted.
function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i=0; i<names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase()) {
            if (verbose) console.log("Banned:", file);
            banned.push(file.toLowerCase());
        }
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}

// The most common standard file extensions are supported, and html is
// delivered as "application/xhtml+xml".  Some common non-standard file
// extensions are explicitly excluded.  This table is defined using a function
// rather than just a global variable, because otherwise the table would have
// to appear before calling start().  NOTE: add entries as needed or, for a more
// complete list, install the mime module and adapt the list it provides.
function defineTypes() {
    var types = {
        html : "application/xhtml+xml",
        css  : "text/css",
        js   : "application/javascript",
        png  : "image/png",
        gif  : "image/gif",    // for images copied unchanged
        jpeg : "image/jpeg",   // for images copied unchanged
        jpg  : "image/jpeg",   // for images copied unchanged
        svg  : "image/svg+xml",
        json : "application/json",
        pdf  : "application/pdf",
        txt  : "text/plain",
        ttf  : "application/x-font-ttf",
        woff : "application/font-woff",
        aac  : "audio/aac",
        mp3  : "audio/mpeg",
        mp4  : "video/mp4",
        webm : "video/webm",
        ico  : "image/x-icon", // just for favicon.ico
        xhtml: undefined,      // non-standard, use .html
        htm  : undefined,      // non-standard, use .html
        rar  : undefined,      // non-standard, platform dependent, use .zip
        doc  : undefined,      // non-standard, platform dependent, use .pdf
        docx : undefined,      // non-standard, platform dependent, use .pdf
    }
    return types;
}

function getBoard(url, response) {
  fs.readFile("./board.html", "utf8", ready);
  function ready(err, content) {
    getBoardData(content, url, response);
  }
}

function getBoardData(text, url, response) {
  var parts = url.split("=");
  var bId = parts[1];
  selectBoardName.get(bId, ready);
  function ready(err, obj) { prepare(text, obj, response); }
}

function getThread(url, response) {
  fs.readFile("./thread.html", "utf8", ready);
  function ready(err, content) {
    getThreadData(content, url, response);
  }
}

function getThreadData(text, url, response) {
  var parts = url.split("=");
  var tId = parts[1];
  selectThreadName.get(tId, ready);
  function ready(err, obj) { prepare(text, obj, response); }
}

function prepare(text, data, response) {
  var parts = text.split("$");
  var page = parts[0] + data.name + parts[1] + data.name + parts[2];
  deliver(response, types.html, null, page);
}

function getBoardList(response) {
  selectAllBoards.all(ready);
  function ready(err, list) { deliverList(list, response); }
}

function getPopularThreads(response) {
  selectPopularThreads.all(ready);
  function ready(err, list) { deliverList(list, response); }
}

function getThreadList(url, response) {
  var parts = url.split("=");
  var bId = parts[1];
  selectBoardThreads.all(bId, ready);
  function ready(err, list) { deliverList(list, response); }
}

function getPostList(url, response) {
  var parts = url.split("=");
  var tId = parts[1];
  selectThreadPosts.all(tId, ready);
  function ready(err, list) { deliverList(list, response); }
}

function deliverList(list, response) {
  var text = JSON.stringify(list);
  deliver(response, types.txt, null, text);
}

// Prepared statements for use in database
function create() {
  db.run("drop table if exists users")
  db.run("drop table if exists boards");
  db.run("drop table if exists threads");
  db.run("drop table if exists posts");
  db.run("drop table if exists sessions");

  db.run("create table users (uId int, name text, email text, password text, avatar text)");
  db.run("insert into users values (1, 'PoliticsMan', 'name1@example.com', 'badpassword', 'avi1.svg')");
  db.run("insert into users values (2, 'WebsiteGuy', 'name2@example.com', 'badpassword', 'avi2.svg')");

  db.run("create table boards (bId int, name text, description text, primary key (bId))");
  db.run("insert into boards values (1, 'Forum News and Announcements', 'Information about the forum is found here')");
  db.run("insert into boards values (2, 'U.S. Politics', 'Political discussion regarding the United States')");
  db.run("insert into boards values (3, 'E.U. Politics', 'Political discussion regarding the European Union')");
  db.run("insert into boards values (4, 'Off Topic', 'Non-Political Discussion')");
  db.run("insert into boards values (5, 'Support', 'Feedback, bugs, complaints go here')");

  db.run("create table threads (tId int, bId int, name text, creationDate datetime, primary key(tId), foreign key (bId) references boards (bId))");
  db.run("insert into threads values (1, 1, 'Forum Rules and Guidelines', datetime('now'))");
  db.run("insert into threads values (2, 1, 'Introductions', datetime('now'))");
  db.run("insert into threads values (3, 2, 'Gun Control Debate Thread', datetime('now'))");
  db.run("insert into threads values (4, 3, 'Brexit Debate Thread', datetime('now'))");
  db.run("insert into threads values (5, 4, 'Funniest Memes', datetime('now'))");
  db.run("insert into threads values (6, 5, 'Planned Bugfixes', datetime('now'))");
  db.run("insert into threads values (7, 2, 'Has Trump gone too far?', datetime('now'))");
  db.run("insert into threads values (8, 3, 'May vs. Corbyn', datetime('now'))");
  db.run("insert into threads values (9, 5, 'how do i make a post?', datetime('now'))");
  db.run("insert into threads values (10, 2, 'Should the U.S. have universal healthcare?', datetime('now'))");

  db.run("create table posts (pId int, tId int, uId int, content text, creationDate datetime, primary key(pId), foreign key (tId) references threads (tId), foreign key (uId) references users (uId))");
  db.run("insert into posts values (1, 1, 1, 'rules', datetime('now'))");
  db.run("insert into posts values (2, 2, 2, 'hello i am user', datetime('now'))");
  db.run("insert into posts values (3, 3, 1, 'guns r bad', datetime('now'))");
  db.run("insert into posts values (4, 4, 1, 'breakfast', datetime('now'))");
  db.run("insert into posts values (5, 5, 2, 'pepe', datetime('now'))");
  db.run("insert into posts values (6, 6, 2, 'get this damn site finished by monday', datetime('now'))");
  db.run("insert into posts values (7, 7, 1, 'yes', datetime('now'))");
  db.run("insert into posts values (8, 8, 1, 'pmqs', datetime('now'))");
  db.run("insert into posts values (9, 9, 1, 'i dont no how please help me', datetime('now'))");
  db.run("insert into posts values (10, 10, 1, 'should they???', datetime('now'))");

  db.run("create table sessions (sId int, session text, username text, primary key (sId))");
}

start();
