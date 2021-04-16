function getNewsUrl() {
    if (localStorage["url"] != null) {
        return localStorage.getItem("url");
    } else {
        console.log('No Nextcloud URL set');
    }
}

function getUsername() {
    return localStorage.getItem("username");
}

function getPassword() {
    return localStorage.getItem("password");
}

function getApiUrl() {
    return getNewsUrl() + "api/v1-2";
}

function performApiRequest(callback, url, method, body) {

    if (!method) {
        method = "GET";
    }
    let options = {
        method: method,
        headers: {
            "Authorization": "Basic " + btoa(getUsername() + ":" + getPassword()),
			"OCS-APIREQUEST": "true"
        },

    };
    if (body != undefined) {
        options["body"] = body;
        options.headers["Content-Type"] = "application/json";
    }
    fetch(getApiUrl() + url, options).then(
        response => {
            response.json().then(callback);
        }
    );
}

function updateUnreadArticles(callback) {
    performApiRequest(response => {
        let articles = response.items;
        localStorage.setItem("unreadArticles", JSON.stringify(articles));
        if (callback != undefined) {
            callback(articles);
        }

    }, "/items?type=3&getRead=false&batchSize=-1");
}

function getUnreadArticles() {
    let articles = localStorage.getItem("unreadArticles");
    if (articles === null) {
        return [];
    }
    return JSON.parse(articles);
}

function updateUnreadCount(callback) {
    updateUnreadArticles(articles => {
        let unreadCount = articles.length;
        console.log(`Found ${unreadCount} unread Articles`);
        chrome.browserAction.setBadgeText({
            text: "" + unreadCount
        });
        localStorage.setItem("unreadCount", unreadCount + "");
        if (callback != undefined) {
            callback(unreadCount);
        }
    });
}

function getUnreadCount() {
    let count = localStorage.getItem("unreadCount");
    if (count === null) {
        return 0
    }
    return Number(count);
}

function markAsRead(callback, items) {
    if (!(items instanceof Array)) {
        items = [items];
    }
    console.log(items);

    body = JSON.stringify({
        "items": items
    });
    performApiRequest(callback, "/items/read/multiple", "PUT", body);
}

function markAllAsRead(callback) {
    items = getUnreadArticles();
    ids = items.map(item => item.id).slice(0, 99);
    markAsRead(callback, ids);
}

function update(callback) {
    updateUnreadCount(callback);
}

function goToInbox() {
    if ((localStorage['oc_url'] == '') || (!localStorage.hasOwnProperty('oc_url'))) {
        alert(chrome.i18n.getMessage("owncloudnewscheck_url_error"));
        console.log(chrome.i18n.getMessage("owncloudnewscheck_url_error"));
    } else {
        if (!backgroundStarted) {
            console.log('Background not yet started, starting...');
            startBackground();
        }
        console.log('Going to ownCloud News...');
        chrome.tabs.getAllInWindow(undefined, function (tabs) {
            for (var i = 0, tab; tab = tabs[i]; i++) {
                if (tab.url && isOwnCloudNewsUrl(tab.url)) {
                    console.log('Found ownCloud tab: ' + tab.url + '. ' +
                        'Focusing and refreshing count...');
                    chrome.tabs.update(tab.id, {
                        selected: true
                    });
                    startRequest({
                        scheduleRequest: false,
                        showLoadingAnimation: false
                    });
                    return;
                }
            }
            console.log('Could not find ownCloud News tab. Creating one...');
            chrome.tabs.create({
                url: getOwnCloudNewsUrl()
            });
        });
    }
}