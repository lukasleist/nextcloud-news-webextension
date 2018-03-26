document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("refresh-button").addEventListener("click", event => {
        console.log("Refresh");
        update(_ => updateUi());
    });
    updateUi()
});


function updateUi() {

    let url = getNewsUrl();
    let linkElement = document.getElementById("nextcloud-link")
    if (url) {
        linkElement.setAttribute("href", url);
    } else {
        linkElement.innerHTML = "URL not set, go to config"
        linkElement.setAttribute("href", "/config.html");
    }
    document.getElementById("feeds").innerHTML = getUnreadCount();

    let ul = document.getElementById("articles");
    ul.innerHTML = "";
    for (let article of getUnreadArticles()) {
        ul.appendChild(renderArticle(article));
    }
}

function renderArticle(article) {
    let li = document.createElement("li");
    let a = document.createElement("a");
    a.setAttribute("href", article.url);
    a.innerHTML = article.title;

    a.addEventListener("click", _ => {
        chrome.tabs.create({url: article.url, active: false});
        markAsRead(response => {
            update(updateUi);
        }, article.id);
        a.parentElement.remove();
    });

    li.appendChild(a);
    return li;
}