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
	chrome.storage.local.get(["url", "authorization", "unreadCount", "unreadArticles", "feedMetadata"], ({
		url, authorization, unreadCount, unreadArticles, feedMetadata
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

				unreadArticles.sort((a, b) => {
					return (a.pubDate > b.pubDate) ? -1 : (a.pubDate < b.pubDate) ? 1 : 0
				}, this)

				for (const article in unreadArticles) {
					ul.appendChild(renderArticle(unreadArticles[article], feedMetadata));
				}
			}
		} else {
			linkElement.innerHTML = chrome.i18n.getMessage("notAuthenticated");
			linkElement.setAttribute("href", "/config.html");
		}
	});
}

function renderArticle(article, feedMetadata) {
	//calculate the domain for the icon and site link.
	const protoMatchRegex = /https:\/\//gm;
	feed = feedMetadata[article.feedId]
	console.log("article", article, "feed", feed)
	//This needs to check for the link in the full rss feed. If the rss feed has a link, use that. otherwise, default to the url in the feed.
	let sourceURL = feed.link ? feed.link : article.url
	//articleDomain is JUST the domain portion for usage in getting the ico.
	let articleDomain = sourceURL.replace('http://', '').replace('https://', '').split(/[/?#]/)[0]
	//domainLink is the link that you go to if you click on the "author" instead of the article.
	let domainLink = (protoMatchRegex.exec(sourceURL) ? "https://" : "http://") + articleDomain
	let faviconSrc = `https://icons.duckduckgo.com/ip3/${articleDomain}.ico`
	if (feed.faviconLink) {
		faviconSrc = feed.faviconLink
	}

	let articleLinkText = feed.title ? feed.title : (article.author ? article.author : articleDomain)
	let articleAge = this.millisecondsToStr(Date.now() / 1000 - (article.pubDate))

	let bodyContent = ""
	if (article.body) {
		bodyContent += article.body
	}
	if (article.mediaThumbnail) {
		bodyContent += `
		<img src="${article.mediaThumbnail}">
		`
	}
	if (article.mediaDescription) {
		bodyContent += `
		<p>${article.mediaDescription}</p>
		`
	}

	let bodyID = `body-${article.id}`

	let template = document.createElement("template");
	template.innerHTML = `
        <li>
            <div class="article">
				<div>
					<a href="${article.url}" class="title">
						${article.title}
					</a>
					<div class="site-info">
						<img class="site-icon" height="16" width="16" src='${faviconSrc}' />
						<span class="article-teaser"><a class="site-link" href="${domainLink}">${articleLinkText}</a><span class="article-age">, ${articleAge} ago</span></span>
					</div>
				</div>
				<div class="button-set">
					<button title="${chrome.i18n.getMessage("expandShowExtraContent")}" class="button body-button hide-body" id="${bodyID}-button"></button>
					<button title="${chrome.i18n.getMessage("markAsReadTitle")}" class="button read-button"></button>
				</div>
            </div>
			<div class="body-info hide-body" id="${bodyID}-body">
				<p>${article.author}</p>
				${bodyContent}
			</div>
        </li>
    `;

	let titleAnchorSelector = template.content.querySelector(".title");
	titleAnchorSelector.addEventListener("click", _ => {
		chrome.tabs.create({ url: article.url, active: false });
		markAsRead(article.id);
	});

	let siteAnchorSelector = template.content.querySelector(".site-link");
	siteAnchorSelector.addEventListener("click", _ => {
		chrome.tabs.create({ url: domainLink, active: false });
	});

	let readButton = template.content.querySelector(".read-button");
	readButton.addEventListener("click", _ => markAsRead(article.id));

	let expandButton = template.content.querySelector(".body-button");
	expandButton.addEventListener("click", _ => {
		let cl = document.querySelector(`#${bodyID}-body`).classList
		if (cl.contains("hide-body")) {
			cl.remove("hide-body")
		} else {
			cl.add("hide-body")
		}
		cl = document.querySelector(`#${bodyID}-button`).classList
		if (cl.contains("hide-body")) {
			cl.remove("hide-body")
		} else {
			cl.add("hide-body")
		}
	});

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


function millisecondsToStr(seconds) {
	//TODO localize

	function numberEnding(number) {
		return (number > 1) ? 's' : '';
	}

	var temp = seconds
	//TODO: Months or weeks? 
	var days = Math.floor((temp %= 31536000) / 86400);
	if (days) {
		return days + ' day' + numberEnding(days);
	}
	var hours = Math.floor((temp %= 86400) / 3600);
	if (hours) {
		return hours + ' hour' + numberEnding(hours);
	}
	var minutes = Math.floor((temp %= 3600) / 60);
	if (minutes) {
		return minutes + ' minute' + numberEnding(minutes);
	}
	var seconds = temp % 60;
	if (seconds) {
		return seconds + ' second' + numberEnding(seconds);
	}
	return 'less than a second'; //'just now' //or other string you like;
}