"use strict"

addEventListener("load", start);

function start() {
  var cookies = document.cookie;
  var cookieArray = cookies.split("; ");
  getUser();
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
  else {
    removePostingTools();
  }
  addHeader();
}
