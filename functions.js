function getNewsUrl() {
    if (localStorage["url"] != null) {
        return localStorage["url"] + "/index.php/apps/news";
    }
    return null;
}

function getNewsApiUrl(endpoint="") {
    return "/index.php/apps/news/api/v1-2"+ endpoint;
}

function getAuthorizationHeader() {
    return localStorage.getItem("authorization");
}

function fetchApi(endpoint, method="GET", body=undefined) {
    if (localStorage["url"] != null) {
        let url =  endpoint.startsWith("http") ? endpoint : localStorage.getItem("url") + endpoint;

        let options = {
            method: method,
            headers: {
                "OCS-APIREQUEST": "true",
            },
        };
        
        if(getAuthorizationHeader()) {
            options.headers["Authorization"] = getAuthorizationHeader();
        }
    
        if (body != undefined) {
            options["body"] = JSON.stringify(body);
            options.headers["Content-Type"] = "application/json";
        }

        return fetch(url, options);
    } else {
        console.log('No Nextcloud URL set');
    }
    
}

/**
 * Removes existing authorization information
 */
function startLoginFlow(callback) {
    localStorage.removeItem("authorization");
    function loginSuccess(authResponse) {
        console.log(authResponse);
        localStorage.setItem("authorization", "Basic " + btoa(authResponse.loginName + ":" + authResponse.appPassword));
        callback();
    }
    
    fetchApi("/index.php/login/v2", "POST").then(response => {
        response.json().then(flowInformation => {
            let pollEndpoint = flowInformation.poll.endpoint;
            let body = {
                token: flowInformation.poll.token
            };
            
            chrome.tabs.create({
                url: flowInformation.login
            });

            function poll(r) {
                if(r.status == 404) {
                    fetchApi(pollEndpoint, "POST", body).then(rr => {
                        setTimeout(_ => poll(rr), 1000);
                    })
                } else {
                    r.json().then(loginSuccess);
                }
                
            }

            poll({status: 404});
        });
    });
}

function updateUnreadArticles(callback) {
    fetchApi(getNewsApiUrl("/items?type=3&getRead=false&batchSize=-1")).then(response => {
        response.json().then(articles => {
            localStorage.setItem("unreadArticles", JSON.stringify(articles.items));
            if (callback != undefined) {
                callback(articles.items);
            }
        });
    });
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

    body = {
        items: items
    };
    fetchApi(getNewsApiUrl("/items/read/multiple"), "PUT", body).then(response => {
        callback(response.json())
    });
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