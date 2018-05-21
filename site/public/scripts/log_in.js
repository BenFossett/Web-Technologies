"use strict"

addEventListener('load', start);

function start() {
  var session = document.cookie.split(";")[0].split("=")[1];
  document.getElementById("session").value = session;
  getUser();
  succeedOrFail();
}

function getUser() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receiveUser;
  q.open("GET", "/getcurrentuser", true);
  q.send();
}

function receiveUser() {
  if (this.readyState != 4) return;
  if(this.responseText != "data not found") {
    var user = JSON.parse(this.responseText);
    document.getElementById("useruid").value = user.uId;
    document.getElementById("username").value = user.name;
    document.getElementById("useravatar").value = user.avatar;
    document.getElementById("useremail").value = user.email;
  }
  addHeader();
}

function succeedOrFail() {
  var url = window.location.href;
  var value = url.split("#")[1];
  if(value == null) return;
  if(value == "failedlogin") {
    document.getElementById(value).innerHTML = "Failed to log in, please try again.";
  }
}
