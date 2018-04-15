"use strict"

addEventListener('load', start);

function start() {
  var bId = getbId();
  fetchThreads(bId);
}

function getbId() {
  var url = window.location.href;
  var parts = url.split("=");
  var bId = parts[1];
  return bId
}

function fetchThreads(bId) {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/threads?bId=" + bId, true);
  q.send();
}

function receive() {
  if (this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  console.log(list.length);
  var html = "";
  var i;
  for(i = 0; i < list.length; i++) {
    var item = '<div class="threads-item"><div class="thread-column"><a href="#"><p><strong>'
               + list[i].name
               + '</strong></p></a><p><small>Created by: '
               + 'thread creator'
               + '</small></p></div><div class="latest-column"><p>'
               + list[i].creationDate
               + '</p><p><small>By: '
               + 'thread replier'
               + '</small></p></div><div class="posts-column"><p>'
               + '0'
               + '</p></div></div>';
    html = html + item;
  }
  var list = document.querySelector(".thread-list");
  list.innerHTML = html;
}
