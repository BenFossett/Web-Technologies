"use strict"

addEventListener('load', start);

function start() {
  var tablinks = document.getElementsByClassName("tablinks"),
      i;

  for(i = 0; i < tablinks.length; i++) {
    tablinks[i].addEventListener('click', openTab.bind(event, "Item" + (i + 1)));
  }

  document.getElementById("Tab1").click();
  getUser();
  fetchBoards();
  fetchPopularThreads();
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

function fetchBoards() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receiveBoards;
  q.open("GET", "/boards", true);
  q.send();
}

function receiveBoards() {
  if (this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  var html = "";
  var i;
  for(i = 0; i < list.length; i++) {
    var item = '<div class="board-item"><a href="board.html?id='
               + list[i].bId
               + '"><p><strong>'
               + list[i].name
               + '</strong></p></a><p>'
               + list[i].description
               + '</p></div>';
    html = html + item;
  }
  var list = document.querySelector(".boards-list");
  list.innerHTML = html;
}

function fetchPopularThreads() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receivePop;
  q.open("GET", "/popularthreads", true);
  q.send();
}

function receivePop() {
  if(this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  var html = '<div class="box-title"><div class="left-column"><p>Top Discussions</p></div><div class="right-column"><p>Posts</p></div></div>';
  var max = 8;
  if(list.length < 8) max = list.length;
  for(var i = 0; i < max; i++) {
    var count = list[i].c;
    var item = '<div class="top-item"><div class="left-column"><p><a href="thread.html?id='
               + list[i].tId
               + '"><strong>'
               + list[i].name
               + '</strong></a></p></div><div class="right-column"><p>'
               + count.toString()
               + '</p></div></div>';
     html = html + item;
  }
  var list = document.querySelector(".top-discussions");
  list.innerHTML = html;
}

function openTab(name) {
    var i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(name).style.display = "block";
    event.currentTarget.className += " active";
}
