function handleClick(event) {
	var input = document.getElementById("url");
	var url = input.value;
	if (url[url.length - 1] != '/') {
		url = url + "/";
	}
	localStorage["url"] = url;
	
	event.preventDefault();
}

document.addEventListener('DOMContentLoaded', function () {
	var url_input = document.getElementById("url");
	var url = localStorage["url"];
	var un = localStorage["username"];
	if (url != null) {
		url_input.value = url;
	}
	if (un != null) {
		un_input.value = un;
	}
	var form = document.getElementById("form");
	form.addEventListener("submit", handleClick);
});