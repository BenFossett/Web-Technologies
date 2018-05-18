"use strict"

addEventListener('load', start);

function start() {
  var cookies = document.cookie;
  var uId = cookies.split("; ")[0].split("=")[1];
  var tId = gettId();
  if(uId != null) {
    makePostForm(tId, uId);
    document.getElementById("posttid").value = tId;
    document.getElementById("postuid").value = uId;
  }
  fetchPosts(tId);
}

function makePostForm(tId, uId) {
  var form = document.querySelector(".new-post");
  var content = '<form name="postForm" class="text-box" action="/makepost" method="POST"><textarea name="post" rows="4" id="postcontent"/><input type="hidden" id="postuid" name="postuid"/><input type="hidden" id="posttid" name="posttid"/><input type="submit" value="Submit" id="postbutton"/></form>'
  form.innerHTML = content;
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
    var item =
    '<div class="post-item">\
      <div class="box-title">Posted: '+ list[i].creationDate +'</div>\
      <div class="post-content">\
        <div class="user-column">\
          <h4>'+ list[i].name+ '</h4>\
          <img src="cow.jpg"/>\
        </div>\
        <div class="text-column">\
          <p>' + list[i].content + '</p></div></div></div>';
    html = html + item;
  }
  var list = document.querySelector(".post-list");
  list.innerHTML = html;
}
