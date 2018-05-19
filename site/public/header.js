"use strict"

addEventListener('load', AddHeader);


function AddHeader(){
  var logged_in = false;
  var uId, username, avatar;
  uId,username, avatar = getuId();
  var header = document.querySelector("header");
  if (header.className == "log_in"){
    header.innerHTML = `
      <div id="logo">
        <a href="index.html">Home</a>
      </div>`;
  }
  else {
    header.innerHTML = `
    <div id="logo">
      <a href="index.html">LOGO</a>
    </div>
    <div id="top-navbar">
      <a href="log_in.html" class="top-button">Login</a>
      <a href="#" class="top-button">Register</a>
      <div class="search-container">
        <input type="text" placeholder="Search..."/>
        <button type="submit">Submit</button>
      </div>
    </div>
    `;
  }
}

function getuId() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receiveUser;
  q.open("GET", "/getcurrentuser", true);
  q.send();
}

function receiveUser() {
  if (this.readyState != 4) return;
  var user = JSON.parse(this.responseText);
  var uId = user.uId;
  var username = user.name;
  var avatar = user.avatar;
  return (uId, username, avatar);
}
