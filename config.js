function handleClick(event) {
	chrome.storage.local.clear(() => {
		let input = document.getElementById("url");
		var url = input.value;
		if (url[url.length - 1] == '/') {
			url = url.slice(0, -1);
		}
		chrome.storage.local.set({url: url});
	});
	event.preventDefault();
}

document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.local.get("url", ({url=""}) => {
		var url_input = document.getElementById("url");
		url_input.value = url;
	});

	var form = document.getElementById("form");
	form.addEventListener("submit", handleClick);
});