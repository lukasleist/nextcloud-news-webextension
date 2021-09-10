document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("reload-button").addEventListener("click", event => {
		triggerUpdate();
	});
	document.getElementById("read-all-button").addEventListener("click", event => {
		document.getElementById("articles").innerHTML = "";
		markAsRead();
	})
	updatePopupLocalizations()
	updateUi()
	chrome.runtime.onMessage.addListener(({ command }) => {
		if (command == "updateUi") {
			updateUi();
		}
	})
});

function updateUi() {
	chrome.storage.local.get(["url", "authorization", "unreadCount", "unreadArticles"], ({
		url, authorization, unreadCount, unreadArticles
	}) => {
		let linkElement = document.getElementById("nextcloud-link")

		if (authorization && url != null) {
			linkElement.innerHTML = chrome.i18n.getMessage("openNextcloudNews");
			linkElement.setAttribute("href", url + "/index.php/apps/news/");

			document.getElementById("unread-count").innerHTML = chrome.i18n.getMessage("unreadArticlesHeading", [
				(unreadCount) ? unreadCount : 0
			]);
			if (unreadArticles) {
				let ul = document.getElementById("articles");
				ul.innerHTML = "";
				for (let article of unreadArticles) {
					ul.appendChild(renderArticle(article));
				}
			}
		} else {
			linkElement.innerHTML = chrome.i18n.getMessage("notAuthenticated");
			linkElement.setAttribute("href", "/config.html");
		}
	});
}

function renderArticle(article) {
	let template = document.createElement("template");
	template.innerHTML = `
        <li>
            <div class="article">
                <a href="${article.url}" class="title">
                    ${article.title}
                </a>
                <button title="${chrome.i18n.getMessage("markAsReadTitle")}" class="button read-button"></button>
            </div>
        </li>
    `;
	let a = template.content.querySelector(".title");
	a.addEventListener("click", _ => {
		chrome.tabs.create({ url: article.url, active: false });
		markAsRead(article.id);
	});

	let readButton = template.content.querySelector(".read-button");
	readButton.addEventListener("click", _ => markAsRead(article.id));

	return template.content;
}

function markAsRead(articleIds) {
	chrome.runtime.sendMessage({ command: "markAsRead", articleIds: articleIds });
}

function triggerUpdate() {
	chrome.runtime.sendMessage({ command: "update" });
}

//html files are not scanned for localization automatically.
function updatePopupLocalizations() {
	let reloadElement = document.getElementById("reload-button")
	reloadElement.setAttribute("title", chrome.i18n.getMessage("reloadTitle"))

	let readAllElement = document.getElementById("read-all-button")
	readAllElement.setAttribute("title", chrome.i18n.getMessage("markAllAsReadTitle"))


	//not strictly necessary as not shown, but good practice I think.
	let titleElement = document.getElementById("title")
	titleElement.innerHTML = chrome.i18n.getMessage("extName")

}

