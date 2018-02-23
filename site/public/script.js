"use strict"

addEventListener('load', start);

function start() {
  var tablinks = document.getElementsByClassName("tablinks"),
      i;

  for(i = 0; i < tablinks.length; i++) {
    tablinks[i].addEventListener('click', openTab.bind(event, "Item" + (i + 1)));
  }

  document.getElementById("Tab1").click();
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