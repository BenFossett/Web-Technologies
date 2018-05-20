"use strict"

addEventListener("load", start);

function start() {
  var cookies = document.cookie;
  var cookieArray = cookies.split("; ");
  getUser();
  succeedOrFail();
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
    document.getElementById("nameuid").value = user.uId;
    document.getElementById("aviuid").value = user.uId;
    document.getElementById("passuid").value = user.uId;
    document.getElementById("useruid").value = user.uId;
    document.getElementById("username").value = user.name;
    document.getElementById("useravatar").value = user.avatar;
    document.getElementById("useremail").value = user.email;
  }
  addHeader();
}

function succeedOrFail() {
  var url = window.location.href;
  var value = url.split("#")[1];
  if(value == null) return;
  if(value == "succeedusername") {
    document.getElementById(value).innerHTML = "Username updated successfully!";
  }
  if(value == "failedusername") {
    document.getElementById(value).innerHTML = "Failed to update username, please try again.";
  }
  if(value == "succeedavatar") {
    document.getElementById(value).innerHTML = "Avatar updated successfully!";
  }
  if(value == "failedavatar") {
    document.getElementById(value).innerHTML = "Failed to update avatar, please try again.";
  }
  if(value == "succeedpassword") {
    document.getElementById(value).innerHTML = "Password updated successfully!"
  }
  if(value == "failedpassword") {
    document.getElementById(value).innerHTML = "Failed to update password, please try again.";
  }
}
