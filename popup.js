document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("reload-button").addEventListener("click", event => {
        console.log("Reload");
        update(_ => updateUi());
    });
    document.getElementById("read-all-button").addEventListener("click", event => {
        console.log("Mark all as read");
        document.getElementById("articles").innerHTML = "";
        markAllAsRead(_ => {});
    })
    updateUi()
});


function updateUi() {

    getNewsUrl(url => {
        let linkElement = document.getElementById("nextcloud-link")
        if (url) {
            linkElement.setAttribute("href", url);
        } else {
            linkElement.innerHTML = "URL not set, or not authenticated: go to config"
            linkElement.setAttribute("href", "/config.html");
        }
    });

    getUnreadCount(count => {
        document.getElementById("unread-count").innerHTML = `Unread articles: ${count}`;
    });

    let ul = document.getElementById("articles");
    ul.innerHTML = "";
    getUnreadArticles((articles) => {
        for (let article of articles) {
            ul.appendChild(renderArticle(article));
        }
    });
}

function renderArticle(article) {
    let li = document.createElement("li");

    function markAsReadListener(_) {
        markAsRead(response => { }, article.id);
        a.parentElement.parentElement.remove();
    }

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
        markAsReadListener();
    });

    let readButton = template.content.querySelector(".read-button");
    readButton.addEventListener("click", markAsReadListener);

    return template.content;
}