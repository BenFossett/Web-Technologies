"use strict"

addEventListener('load', start);

function start() {
  var session = document.cookie.split(";")[0].split("=")[1];
  document.getElementById("session").value = session;
}
