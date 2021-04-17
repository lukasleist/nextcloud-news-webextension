function getNewsUrl(callback) {
    chrome.storage.local.get(["url", "authorization"], ({url, authorization}) => {
        if (authorization && url != null) {
            callback(url + "/index.php/apps/news");
        } else {
            callback(null);
        }
    });
}

function fetchApi(endpoint, method="GET", body=undefined) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["url", "authorization"], resolve)
    }).then(({url, authorization}) => {
        if(authorization) {
            url = url + endpoint;
        } else {
            url = endpoint;
        }
        if (url.startsWith("http")) {
            let options = {
                method: method,
                headers: {
                    "OCS-APIREQUEST": "true",
                },
            };
            
            if(authorization) {
                options.headers["Authorization"] = authorization;
            }
        
            if (body != undefined) {
                options["body"] = JSON.stringify(body);
                options.headers["Content-Type"] = "application/json";
            }
    
            return fetch(url, options);
        } else {
            //console.log(chrome.i18n.getMessage("owncloudnewscheck_url_error"));
            return Promise.reject("No Nextcloud url set or not yet authorized");
        }
    });
}



function updateUnreadArticles(callback) {
    fetchApi("/index.php/apps/news/api/v1-2/items?type=3&getRead=false&batchSize=-1").then(response => {
        response.json().then(articles => {
            chrome.storage.local.set({
                unreadArticles: articles.items
            }, () => {
                if (callback != undefined) {
                    callback(articles.items);
                }
            });
        });
    }).catch(console.log);
}

function getUnreadArticles(callback) {
    chrome.storage.local.get("unreadArticles", ({unreadArticles}) => {
        if(!unreadArticles) {
            callback([]);
        } else {
            callback(unreadArticles);
        }
    });
}

function updateUnreadCount(callback) {
    updateUnreadArticles(articles => {
        let unreadCount = articles.length;
        console.log(`Found ${unreadCount} unread Articles`);
        chrome.action.setBadgeText({
            text: "" + unreadCount
        });
        chrome.storage.local.set({
            unreadCount: unreadCount
        }, () => {
            if (callback != undefined) {
                callback(unreadCount);
            }
        })
    });
}

function getUnreadCount(callback) {
    chrome.storage.local.get("unreadCount", ({unreadCount}) => {
        if (unreadCount) {
            callback(unreadCount);
        } else {
            callback(0);
        }

    });
}

function markAsRead(callback, items) {
    if (!(items instanceof Array)) {
        items = [items];
    }
    console.log(items);

    body = {
        items: items
    };
    fetchApi("/index.php/apps/news/api/v1-2/items/read/multiple", "PUT", body).then(response => {
        callback(response.json())
    });
}

function markAllAsRead(callback) {
    getUnreadArticles((articles => {
        ids = articles.map(item => item.id).slice(0, 99);
        markAsRead(callback, ids);
    }));
}

function update(callback) {
    updateUnreadCount(callback);
}