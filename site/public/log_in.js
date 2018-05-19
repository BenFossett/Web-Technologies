"use strict"

addEventListener('load', start);

function start() {
  var cookies = document.cookie;
  var session = cookies.split(";")[0].split("=")[1];
  document.getElementById("session").value = session;
}
