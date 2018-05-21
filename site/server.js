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
var QS = require("querystring");

var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;

// Load the database
var sql = require("sqlite3");
var db = new sql.Database("data.db");

db.serialize(create);

// Prepared statements
var selectBoardName = db.prepare("select name from boards where bId=?");
var selectThreadName = db.prepare("select name from threads where tId=?");

var selectUser = db.prepare("select * from users where name=? and password=?");
var selectUserById = db.prepare("select * from users where uId=?");
var updateUsername = db.prepare("update users set name=? where uId=?");
var updateAvatar = db.prepare("update users set avatar=? where uId=?");
var updatePassword = db.prepare("update users set password=? where uId=?");

var updateSession = db.prepare("update sessions set uId=? where session=?");
var selectSession = db.prepare("select * from sessions where session=?");
var selectAllBoards = db.prepare("select * from boards");
var selectPopularThreads = db.prepare("select threads.name, posts.tId, count(*) as c from threads inner join posts on threads.tId = posts.tId group by posts.tId having c >= 0 order by c desc");
var selectBoardThreads = db.prepare("select threads.tId, threads.name, threads.creationDate, posts.creationDate as postDate, users.name as username, count(*) as c from threads inner join posts on threads.tId = posts.tId inner join users on posts.uId = users.uId where threads.bId = ? group by posts.tId having c >= 0 order by threads.creationDate desc");
var selectThreadPosts = db.prepare("select posts.content, posts.creationDate, users.name, users.avatar from posts inner join users on posts.uId = users.uId where tId=?");
var selectCurrentUser = db.prepare("select users.uId, users.name, users.avatar from users inner join sessions on users.uId = sessions.uId where session=?");

var insertSession = db.prepare("insert into sessions (session) values (?)");
var insertThread = db.prepare("insert into threads (bId, name, creationDate) values (?, ?, dateTime('now'))");
var insertUser = db.prepare("insert into users (name, email, password, avatar) values (?, ?, ?, ?)");
var insertPost = db.prepare("insert into posts (tId, uId, content, creationDate) values (?, ?, ?, datetime('now'))");


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
    checkCookie(request, response);
}

function continueHandle(request, response) {
    var url = request.url.toLowerCase();
    console.log("url=", url);
    if (url.startsWith("/log_in.html")) return getLog_In(response);
    if (url.endsWith("/")) url = url + "index.html";
    if (url == "/boards") return getBoardList(response);
    if (url == "/popularthreads") return getPopularThreads(response);
    if (url.startsWith("/board.html")) return getBoard(url, response);
    if (url.startsWith("/threadslist")) return getThreadList(url, response);
    if (url.startsWith("/thread.html")) return getThread(url, response);
    if (url.startsWith("/postslist")) return getPostList(url, response);
    if (url == "/log_out") return Log_Out(request, response);
    if (url == "/log_in") return Log_In(request, response);
    if (url == "/register") return Register(request, response);
    if (url == "/makepost") return makePost(request, response);
    if (url == "/makethread") return makeThread(request, response);
    if (url == "/getcurrentuser") return getCurrentUser(request, response);
    if (url == "/changeusername") return changeUsername(request, response);
    if (url == "/changeavatar") return changeAvatar(request, response);
    if (url == "/changepassword") return changePassword(request, response);
    if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
    var type = findType(url);
    if (type == null) return fail(response, BadType, "File type unsupported");
    var file = "./public" + url;
    fs.readFile(file, ready);
    function ready(err, content) { deliver(response, type, err, content); }
}

function getLog_In(response){
  fs.readFile("./log_in.html", "utf8", ready);
  function ready(err, content) {
    deliver(response, types.html, null, content);
  }
}

function checkCookie(request, response) {
  var hasSession;
  var cookies = request.headers['cookie'];
  var session;

  if(cookies == undefined) {
    hasSession = false;
  }
  else {
    session = getCookie(cookies);
    if(session != undefined) hasSession = true;
  }

  if(hasSession == true) {
    selectSession.get(session, ready2);
    function ready2(err, item) {
      console.log("the cookies are" + JSON.stringify(item));
      if (item != undefined) response.setHeader("Set-Cookie", "session="+session);
      else {
        session = crypto.randomBytes(16).toString('hex');
        insertSession.all(session);
        response.setHeader("Set-Cookie", "session="+session);
      }
      continueHandle(request, response);
    }
  }
  else {
    session = crypto.randomBytes(16).toString('hex');
    insertSession.all(session);
    response.setHeader("Set-Cookie", "session="+session);
    continueHandle(request, response);
  }
}

function getCookie(cookies) {
  var cookieArray = cookies.split("; ");
  var name;
  var value;
  for(var i=0; i<cookieArray.length; i++) {
    name = cookieArray[i].split("=")[0];
    value = cookieArray[i].split("=")[1];
    if(name=="session") {
      return value;
    }
  }
  return undefined;
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

// only gets the title from db and prepare adds it in
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

// gets the title from the db and prepare adds it in
function getThreadData(text, url, response) {
  var parts = url.split("=");
  var tId = parts[1];
  selectThreadName.get(tId, ready);
  function ready(err, obj) { prepare(text, obj, response); }
}

function prepare(text, data, response) {
  var parts = text.split("$");
  var page = parts[0] + "The Source - " + data.name + parts[1] + data.name + parts[2];
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
  if(list != undefined) {
    var text = JSON.stringify(list);
  }
  else {
    var text = "data not found"
  }
  deliver(response, types.txt, null, text);
}

function getCurrentUser(request, response) {
  var cookies = request.headers["cookie"];
  var session = getCookie(cookies);
  selectCurrentUser.get(session, ready);
  function ready(err, user) { deliverList(user, response); }
}

function makePost(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var content = parts.post
    var uId = parts.postuid;
    var tId = parts.posttid;

    insertPost.run(tId, uId, content, ready);
    //insertPost.all(tId, uId, content, ready);
    function ready(err) { reply(response, tId); }
  }
}

// Send a reply.
function reply(response, tId) {
  var redir = { Location: "/thread.html?id=" + tId };
  response.writeHead(301, redir);
  response.end();
}

function Log_In(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var user = parts.user;
    var password = parts.passwd;
    var session = parts.session;
    selectUser.get(user, password, Log_In_status);
    function Log_In_status(err, user){
      if (user != null){
        updateSession.run(user.uId, session, ready);
        function ready() {
          var redir = { Location: "/index.html"};
          response.writeHead(301, redir);
          response.end();
        }
      }
      else {
        var redir = { Location: "/log_in.html"};
        response.writeHead(301, redir);
        response.end();
      }
    }
  }
}

function Log_Out(request, response) {
    var cookies = request.headers['cookie'];
    var session;
    if(cookies != undefined) {
      session = getCookie(cookies);
      updateSession.run(null, session, ready);
    }
    function ready(err){
      deliver(response, types.html, null, "page");
    }
}

function Register(request, response){
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var user = parts.user;
    var password = parts.passwd;
    var cookies = request.headers['cookie'];
    var email = parts.email;
    var avatar = parts.avatar;
    var session;
    if(cookies != undefined) {
      session = getCookie(cookies);
    }
    console.log(user + password + email + avatar);
    insertUser.run(user, email, password, avatar + ".svg", ready);
    function ready(err){
      selectUser.get(user, password, Log_In_status);
      function Log_In_status(err, user){
        if (user != null){
          updateSession.run(user.uId, session, ready);
          function ready() {
            var redir = { Location: "/index.html"};
            response.writeHead(301, redir);
            response.end();
          }
        }
        else {
          var redir = { Location: "/log_in.html"};
          response.writeHead(301, redir);
          response.end();
        }
      }
    }
  }
}

function makeThread(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var title = parts.threadtitle;
    var content = parts.post;
    var uId = parts.threaduid;
    var bId = parts.threadbid;

    insertThread.run(bId, title, ready);
    function ready(err) {
      var tId = this.lastID;
      postInThread(response, uId, content, tId);
    }
  }
}

function postInThread(response, uId, content, tId) {
  insertPost.run(tId, uId, content, ready);
  function ready(err) { reply(response, tId); }
}

function changeUsername(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var uId = parts.formuid;
    var newname = parts.newname;
    var password = parts.password;
    if(uId != "") {
      selectUserById.get(uId, ready);
      function ready(err, user) {
        if(user.password == password) {
          updateUsername.run(newname, uId, succeed);
          function succeed() {
            backToUserSettings("#succeedusername", response);
          }
        }
        else {
          backToUserSettings("#failedusername", response);
        }
      }
    }
    else {
      backToUserSettings("#failedusername", response);
    }
  }
}

function changeAvatar(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    console.log("here")
    var uId = parts.formuid;
    var avatar = parts.avatar + ".svg";
    if(uId != "") {
        console.log("here2");
        updateAvatar.run(avatar, uId, succeed);
        function succeed() {
          backToUserSettings("#succeedavatar", response);
        }
      }
    else {
      backToUserSettings("#failedavatar", response);
    }
  }
}

function changePassword(request, response) {
  request.on('data', add);
  request.on('end', end);
  var body = "";

  function add(chunk) {
    body = body + chunk.toString();
  }
  function end() {
    var parts = QS.parse(body);
    var uId = parts.formuid;
    var newpassword = parts.newpassword;
    var confirmpassword = parts.confirmpassword;
    var currentpassword = parts.currentpassword;
    if(uId != "" && newpassword == confirmpassword) {
      selectUserById.get(uId, ready);
      function ready(err, user) {
        if(user.password == currentpassword) {
          updatePassword.run(newpassword, uId, succeed);
          function succeed() {
            backToUserSettings("#succeedpassword", response);
          }
        }
        else {
          backToUserSettings("#failedpassword", response);
        }
      }
    }
    else {
      backToUserSettings("#failedpassword", response);
    }
  }
}

function backToUserSettings(message, response) {
  var redir = { Location: "/usersettings.html" + message };
  response.writeHead(301, redir);
  response.end();
}

// Prepared statements for use in database
function create() {
  db.run("drop table if exists users")
  db.run("drop table if exists boards");
  db.run("drop table if exists threads");
  db.run("drop table if exists posts");
  db.run("drop table if exists sessions");

  db.run("create table users (uId integer primary key autoincrement, name text, email text, password text, avatar text)");
  db.run("create table boards (bId integer primary key autoincrement, name text, description text)");
  db.run("create table threads (tId integer primary key autoincrement, bId int, name text, creationDate datetime, foreign key (bId) references boards (bId))");
  db.run("create table posts (pId integer primary key autoincrement, tId int, uId int, content text, creationDate datetime, foreign key (tId) references threads (tId), foreign key (uId) references users (uId))");
  db.run("create table sessions (sId integer primary key autoincrement, uId int, session text, foreign key (uId) references users (uId))");


  db.run("insert into users values (1, 'ForumUser', 'name1@example.com', 'badpassword', 'avi1.svg')");
  db.run("insert into users values (2, 'WebsiteGuy', 'name2@example.com', 'badpassword', 'avi2.svg')");
  db.run("insert into users values (3, 'PoliticMan', 'name3@example.com', 'badpassword', 'avi3.svg')");
  db.run("insert into users values (4, 'IAmAUser', 'name4@example.com', 'badpassword', 'avi4.svg')");

  db.run("insert into boards values (1, 'Forum News and Announcements', 'Information about the forum is found here')");
  db.run("insert into boards values (2, 'General Politics', 'Broad discussions covering many areas of politics')");
  db.run("insert into boards values (3, 'Political Events', 'Talk about specific political events such as elections here')");
  db.run("insert into boards values (4, 'Off Topic', 'If not relevant to politics, it goes here')");
  db.run("insert into boards values (5, 'Support', 'Feedback, bugs, complaints go here')");

  db.run("insert into threads values (1, 1, 'Introductions Thread', datetime('now'))");
  db.run("insert into posts values (1, 1, 1, 'Hey guys, come and introduce yourselves. I am ForumUser!', datetime('now'))");
  db.run("insert into posts values (2, 1, 2, 'Hi everyone, WebsiteGuy here.', datetime('now'))");
  db.run("insert into posts values (3, 1, 3, 'hello i am politicman', datetime('now'))");
  db.run("insert into posts values (4, 1, 4, 'IAmAUser, nice to meet you all.', datetime('now'))");

  db.run("insert into threads values (2, 2, 'Theresa May vs. Jeremy Corbyn', datetime('now'))");
  db.run("insert into posts values (5, 2, 1, 'Which one would you rather see running the country right now?', datetime('now'))");
  db.run("insert into posts values (6, 2, 4, 'I prefer Corbyn.', datetime('now'))");
  db.run("insert into posts values (7, 2, 2, 'You brits have the worst politicians lol', datetime('now'))");

  db.run("insert into threads values (3, 2, 'Trump and North Korea', datetime('now'))");
  db.run("insert into posts values (8, 3, 2, 'How do you guys think this is all going to go down?', datetime('now'))");
  db.run("insert into posts values (9, 3, 1, 'Progress is being made, I just hope neither side does anything to ruin that.', datetime('now'))");
  db.run("insert into posts values (10, 3, 4, 'Trump should spend less time on Twitter.', datetime('now'))");
  db.run("insert into posts values (11, 3, 3, 'trump did a good job i think', datetime('now'))");

  db.run("insert into threads values (4, 2, 'Is it time for guns to be restricted in the U.S?', datetime('now'))");
  db.run("insert into posts values (12, 4, 4, 'I think it is pretty clear that something needs to be done, and soon.', datetime('now'))");
  db.run("insert into posts values (13, 4, 3, 'you will never take our guns', datetime('now'))");
}

start();
