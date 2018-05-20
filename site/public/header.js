"use strict"

function addHeader(){
  var uId = document.getElementById("useruid").value;
  console.log("test");
  if(uId != "") {
    var username = document.getElementById("username").value;
    var avatar = document.getElementById("useravatar").value;
    makeUserNavbar(username, avatar);
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
  console.log(avatar);
  var header = document.querySelector("header");
  header.innerHTML = `
  <div id="logo">
    <a href="index.html">LOGO</a>
  </div>
  <div id="top-navbar">
    <a href="#" class="avatar">`
    + '<img src="images/'
    + avatar
    + '"/>'
    + `</a>
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
