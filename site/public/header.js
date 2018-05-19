"use strict"

addEventListener('load', AddHeader);


function AddHeader(){
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
    document.getElementById("username").value = user.name;
    document.getElementById("useravatar").value = user.avatar;
    document.getElementById("useremail").value = user.email;
    makeUserNavbar(user.name, user.avatar);
  }
  else {
    makeDefaultNavbar();
  }
}

function makeDefaultNavbar() {
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

function makeUserNavbar(username, avatar) {
  var header = document.querySelector("header");
  header.innerHTML = `
  <div id="logo">
    <a href="index.html">LOGO</a>
  </div>
  <div id="top-navbar">
    <a href="#" class="avatar"><img src="cow.jpg"/></a>
    <a href="#" class="top-button">`
    + username
    + `</a>
    <div class="search-container">
      <input type="text" placeholder="Search..."/>
      <button type="submit">Submit</button>
    </div>
  </div>
  `;
}
