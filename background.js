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

function update() {
    fetchApi("/index.php/apps/news/api/v1-2/items?type=3&getRead=false&batchSize=-1").then(response => {
        response.json().then(articles => {
            let unreadCount = articles.items.length;
            console.log(`Fetched ${unreadCount} unread articles`);
            chrome.action.setBadgeText({
                text: "" + unreadCount
            });
            
            chrome.storage.local.set({
                unreadArticles: articles.items,
                unreadCount: unreadCount
            }, () => {
				chrome.runtime.sendMessage({command: "updateUi"});
			});
        });
    }).catch(console.log);
}

update();

const periodInMinutes = 0.2;
chrome.alarms.create('refresh', {periodInMinutes: periodInMinutes});
chrome.alarms.onAlarm.addListener(update);
console.log(`Scheduled refresh to run every ${periodInMinutes} minutes`);

chrome.runtime.onMessage.addListener(({command, callback, articleIds}) => {
	if(command == "update") {
		update();
	}
	if(command == "markAsRead") {
		
		function markAsRead(items) {
			if (!(items instanceof Array)) {
				items = [items];
			}
			fetchApi("/index.php/apps/news/api/v1-2/items/read/multiple", "PUT", {
				items: items
			}).then(response => response.json()).then(update);   
		}
		if(!articleIds) {	//if no particular ids are given, mark all as read
			chrome.storage.local.get("unreadArticles", ({unreadArticles}) => {
				if(unreadArticles) {
					ids = unreadArticles.map(item => item.id).slice(0, 99);
					markAsRead(ids);
				} 
			});
		}
		markAsRead(articleIds);
	}
});

chrome.storage.local.onChanged.addListener(({url}) => {
	if(url) {
		//start login flow
		chrome.storage.local.remove("authorization", () => {
		
			function loginSuccess(authResponse) {
				chrome.storage.local.set({
					authorization: "Basic " + btoa(authResponse.loginName + ":" + authResponse.appPassword)
				}, () => {
					console.log("Login Flow Completed Successfully")
					update();
				});
			}
	
			fetchApi(url.newValue + "/index.php/login/v2", "POST").then(response => {
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
								setTimeout(_ => poll(rr), 1500);
							})
						} else {
							r.json().then(loginSuccess);
						}
						
					}
		
					poll({status: 404});
				});
			});
		});
	}
})
