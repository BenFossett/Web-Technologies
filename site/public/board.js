"use strict"

addEventListener('load', start);

function start() {
  var modal = document.getElementById("threadModal");
  var btn = document.getElementById("createThread");
  var span = document.querySelector(".close");

  btn.addEventListener('click', displayModal.bind(event, modal));
  span.addEventListener('click', closeModal.bind(event, modal));
  window.addEventListener('click', closeModalWindow.bind(event, modal));

  var cookies = document.cookie;
  var cookieArray = cookies.split("; ");

  getUser();
  var bId = getbId();
  document.getElementById("threadbid").value = bId;
  fetchThreads(bId);
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
    document.getElementById("threaduid").value = user.uId;
    document.getElementById("username").value = user.name;
    document.getElementById("useravatar").value = user.avatar;
    document.getElementById("useremail").value = user.email;
  }
  else {
    removePostingTools();
  }
  addHeader();
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
  q.open("GET", "/threadslist?bId=" + bId, true);
  q.send();
}

function receive() {
  if (this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  var html = "";
  var i;
  for(i = 0; i < list.length; i++) {
    var count = list[i].c;
    var item = '<div class="threads-item"><div class="thread-column"><a href="thread.html?id='
               + list[i].tId
               +'"><p><strong>'
               + list[i].name
               + '</strong></p></a><p><small>Created by: '
               + 'thread creator'
               + '</small></p></div><div class="latest-column"><p>'
               + list[i].creationDate
               + '</p><p><small>By: '
               + 'thread replier'
               + '</small></p></div><div class="posts-column"><p>'
               + count.toString()
               + '</p></div></div>';
    html = html + item;
  }
  var list = document.querySelector(".thread-list");
  list.innerHTML = html;
}
