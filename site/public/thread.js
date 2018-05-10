"use strict"

addEventListener('load', start);

function start() {
  var tId = gettId();
  fetchPosts(tId);
}

function gettId() {
  var url = window.location.href;
  var parts = url.split("=");
  var bId = parts[1];
  return bId
}

function fetchPosts(tId) {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/postslist?tId=" + tId, true);
  q.send();
}

function receive() {
  if (this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  var html = "";
  var i;
  for(i = 0; i< list.length; i++) {
    var item = '<div class="post-item"><div class="box-title">Posts</div><div class="post-content"><div class="user-column"><h4>'
               + list[i].name
               + '</h4><img src="cow.jpg"/></div><div class="text-column"><p>'
               + list[i].content
               + '</p></div></div></div>';
    html = html + item;
  }
  var list = document.querySelector(".post-list");
  list.innerHTML = html;
}
