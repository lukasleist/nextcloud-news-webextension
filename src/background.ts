import browser from "webextension-polyfill";

export type article = {
  id: number;
  guid: string;
  guidHash: string;
  url: string;
  title: string;
  author: string;
  pubDate: number; //unix Timestamp
  updatedDate: number; //unix Timestamp
  body: string;
  enclosureMime: any;
  enclosureLink: any;
  mediaThumbnail: any;
  mediaDescription: any;
  feedId: number;
  unread: boolean;
  starred: boolean;
  lastModified: number; //unix Timestamp
  rtl: boolean;
  fingerprint: string;
  contentHash: string;
};

function fetchApi(
  endpoint: string,
  method = "GET",
  body: any = undefined,
): Promise<any> {
  return browser.storage.local
    .get(["url", "authorization"])
    .then(({ url, authorization }) => {
      if (authorization) {
        url = url + endpoint;
      } else {
        url = endpoint;
      }
      if (url.startsWith("http")) {
        const options: any = {
          method: method,
          headers: {
            "OCS-APIREQUEST": "true",
          },
        };

        if (authorization) {
          options.headers["Authorization"] = authorization;
        }

        if (body !== undefined) {
          options["body"] = JSON.stringify(body);
          options.headers["Content-Type"] = "application/json";
        }

        return fetch(url, options);
      } else {
        return Promise.reject("notAuthenticated");
      }
    });
}

function update(): void {
  //update article list
  fetchApi(
    "/index.php/apps/news/api/v1-2/items?type=3&getRead=false&batchSize=-1",
  )
    .then((response) => response.json())
    .then((articles: any) => {
      const unreadCount = articles.items.length;
      console.log(`Fetched ${unreadCount} unread articles`);

      const action = browser.action ? browser.action : browser.browserAction;
      action.setBadgeText({
        text: `${unreadCount}`,
      });

      const sortedArticles = articles.items.toSorted(
        (a: article, b: article) => {
          return a.pubDate > b.pubDate ? -1 : a.pubDate < b.pubDate ? 1 : 0;
        },
      );

      return browser.storage.local.set({
        unreadArticles: sortedArticles,
        unreadCount: unreadCount,
      });
    })
    .then(() => {
      browser.runtime.sendMessage({ command: "updateUi" });
    })
    .catch(console.log);

  //update feed list.
  console.log("fetching feed list");
  fetchApi("/index.php/apps/news/api/v1-2/feeds")
    .then((response) => response.json())
    .then((feeds: any) => {
      console.log(`loaded metadata for ${feeds.feeds.length} feeds`);
      const feedMap: any = {};
      feeds.feeds.forEach((feed: any) => {
        feedMap[feed.id] = feed;
      });
      browser.storage.local.set({ feedMetadata: feedMap }).then(() => {
        browser.runtime.sendMessage({ command: "updateUi" });
      });
    })
    .catch(console.log);
}

update();

//const periodInMinutes = 0.2;
const periodInMinutes = 10;
browser.alarms.create("refresh", { periodInMinutes: periodInMinutes });
browser.alarms.onAlarm.addListener(update);
console.log(`Scheduled refresh to run every ${periodInMinutes} minutes`);

browser.runtime.onMessage.addListener(({ command, callback, articleIds }) => {
  if (command === "update") {
    update();
  }
  if (command === "markAsRead") {
    fetchApi("/index.php/apps/news/api/v1-2/items/read/multiple", "PUT", {
      items: articleIds,
    })
      .then((response) => response.json())
      .then(update);
  }
});

browser.storage.local.onChanged.addListener(({ url }) => {
  if (url) {
    //start login flow
    browser.storage.local.remove("authorization").then(() => {
      function loginSuccess(authResponse: any) {
        browser.storage.local
          .set({
            authorization:
              "Basic " +
              btoa(authResponse.loginName + ":" + authResponse.appPassword),
          })
          .then(() => {
            console.log("Login Flow Completed Successfully");
            update();
          });
      }

      fetchApi(`${url.newValue}/index.php/login/v2`, "POST").then(
        (response) => {
          response.json().then((flowInformation: any) => {
            const pollEndpoint = flowInformation.poll.endpoint;
            const body = {
              token: flowInformation.poll.token,
            };

            browser.tabs.create({
              url: flowInformation.login,
            });

            function poll(r: any) {
              if (r.status === 404) {
                fetchApi(pollEndpoint, "POST", body).then((rr) => {
                  setTimeout((_) => poll(rr), 1500);
                });
              } else {
                r.json().then(loginSuccess);
              }
            }

            poll({ status: 404 });
          });
        },
      );
    });
  }
});
