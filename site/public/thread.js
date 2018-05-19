"use strict"

addEventListener('load', start);

function start() {
  var cookies = document.cookie;
  var cookieArray = cookies.split("; ");
  getUser();
  var tId = gettId();
  document.getElementById("posttid").value = tId;
  fetchPosts(tId);
}

function removePostForm() {
  var form = document.querySelector(".new-post");
  var content = "<h3>Please log in to make a post</h3>";
  form.innerHTML = content;
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
    document.getElementById("postuid").value = user.uId;
    document.getElementById("username").value = user.name;
    document.getElementById("useravatar").value = user.avatar;
    document.getElementById("useremail").value = user.email;
  }
  else {
    removePostForm();
  }
  addHeader();
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
