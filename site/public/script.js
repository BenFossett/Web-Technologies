"use strict"

addEventListener('load', start);

function start() {
  var tablinks = document.getElementsByClassName("tablinks"),
      i;

  for(i = 0; i < tablinks.length; i++) {
    tablinks[i].addEventListener('click', openTab.bind(event, "Item" + (i + 1)));
  }

  document.getElementById("Tab1").click();
  fetchData();
}

function fetchData() {
  var q = new XMLHttpRequest();
  q.onreadystatechange = receive;
  q.open("GET", "/boards", true);
  q.send();
}

function receive() {
  if (this.readyState != 4) return;
  var list = JSON.parse(this.responseText);
  var html = "";
  var i;
  for(i = 0; i < list.length; i++) {
    var item = '<div class="board-item"><a href="board.html?id=' + list[i].bId + '"><p><strong>' + list[i].name + '</strong></p></a><p>' + list[i].description + '</p></div>';
    html = html + item;
  }
  var ul = document.querySelector(".boards-list");
  ul.innerHTML = html;
}

function openTab(name) {
    var i, tabcontent, tablinks;

    console.log(name);

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
