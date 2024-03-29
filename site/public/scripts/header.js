"use strict"

function addHeader(){
  var uId = document.getElementById("useruid").value;
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
        <a href="index.html"><img src="images/logo.svg"/></a>
      </div>`;
  }
  else {
    header.innerHTML = `
    <div id="logo">
      <a href="index.html"><img src="images/logo.svg"/></a>
    </div>
    <div id="top-navbar">
      <a href="log_in.html" class="top-button">Login</a>
      <a href="register.html" class="top-button">Register</a>
    </div>
    `;
  }
}

function makeUserNavbar(username, avatar) {
  var header = document.querySelector("header");
  header.innerHTML = `
  <div id="logo">
    <a href="index.html"><img src="images/logo.svg"/></a>
  </div>
  <div id="top-navbar">`
    + '<img src="images/'
    + avatar
    + '"/>'
    + `<a href="/usersettings.html" class="top-button">`
    + username
    + `</a>
    <a id='log_out' class="top-button">Logout</a>
  </div>
  `;
  document.getElementById("log_out").addEventListener("click", Log_Out);
}

function Log_Out(){
  var q = new XMLHttpRequest();
  q.onreadystatechange = ready;
  function ready(){location.reload();}
  q.open("GET", "/log_out", true);
  q.send();
}

function removePostingTools() {
  var form = document.querySelector("#postingTools");
  var content = "<h3>Please log in to make a post</h3>";
  form.innerHTML = content;
}

function displayModal(modal) {
  modal.style.display = "block";
}

function closeModal(modal) {
  modal.style.display = "none";
}

function closeModalWindow(modal) {
  if(event.target == modal) {
    modal.style.display = "none";
  }
}
