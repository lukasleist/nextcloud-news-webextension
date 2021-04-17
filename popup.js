document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("reload-button").addEventListener("click", event => {
        triggerUpdate();
    });
    document.getElementById("read-all-button").addEventListener("click", event => {
        document.getElementById("articles").innerHTML = "";
        markAsRead();
    })
    updateUi()
    chrome.runtime.onMessage.addListener(({command}) => {
        if(command == "updateUi") {
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
            linkElement.setAttribute("href", url);

            if (unreadCount) {
                document.getElementById("unread-count").innerHTML = `Unread articles: ${unreadCount}`;
            } else {
                document.getElementById("unread-count").innerHTML = `Unread articles: 0`;
            }
            if(unreadArticles) {
                let ul = document.getElementById("articles");
                ul.innerHTML = "";
                for (let article of unreadArticles) {
                    ul.appendChild(renderArticle(article));
                }
            }
        } else {
            linkElement.innerHTML = "URL not set, or not authenticated: go to config"
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
                <button title="Mark as read" class="button read-button"></button>
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
    chrome.runtime.sendMessage({command: "markAsRead", articleIds: articleIds});
}

function triggerUpdate() {
    chrome.runtime.sendMessage({command: "update"});
}