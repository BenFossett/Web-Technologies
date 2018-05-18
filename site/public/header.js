"use strict"

addEventListener('load', AddHeader);


function AddHeader(){
  console.log("print here");
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
