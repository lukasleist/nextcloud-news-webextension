<template>
  <div class="wrapper">
    <div class="header authenticated" v-if="!url">
      <h1>{{ "popupPageTitle" | i18n }}</h1>
      <div class="connection-config-message">
        <h2>{{ "notAuthenticated" | i18n }}</h2>
        <a target="_blank" :href="'/options/options.html'">
          <NcButton type="primary" :aria-label="'notAuthenticated' | i18n">
            <template #icon>
              <ArrowRight fill-color="white" />
            </template>
          </NcButton>
        </a>
      </div>
    </div>
    <UnreadCountHeader v-else-if="unreadCount" :url="url" :unreadCount="unreadCount" @reload="triggerUpdate"
      @markAllAsRead="markAsRead" />
    <div class="feed">
      <ul ref="articlesList" id="articles">
        <Article v-if="feedMetadata" v-for="article in articles" :key="article.id" :article="article"
          :feedMetadata="feedMetadata" @markAsRead="markAsRead"></Article>
      </ul>
    </div>
  </div>
</template>
<script lang="ts">
import browser from "webextension-polyfill";
import { defineComponent } from "vue";
import type { article } from "./Article.vue";
import Article from "./Article.vue";
import UnreadCountHeader from "./UnreadCountHeader.vue";
import NcButton from "@nextcloud/vue/dist/Components/NcButton";
import ArrowRight from 'vue-material-design-icons/ArrowRight.vue';

export default defineComponent({
  components: {
    Article,
    UnreadCountHeader,
    ArrowRight,
    NcButton
  },
  data() {
    return {
      authorization: <string | null>null,
      url: <string | null>null,
      unreadCount: <number | null>null,
      articles: <any[] | null>null,
      feedMetadata: <any | null>null,
    };
  },
  mounted() {
    this.updateUi();
    browser.runtime.onMessage.addListener(({ command }) => {
      if (command == "updateUi") {
        this.updateUi();
      }
    });
  },
  methods: {
    triggerUpdate() {
      browser.runtime.sendMessage({ command: "update" }).then((value) => {
        console.log(value);
        this.updateUi();
      });
    },
    markAsRead(articleIds?: number | number[]) {
      if (articleIds) {
        if (!(articleIds instanceof Array)) {
          articleIds = [articleIds];
        }
        this.articles = <any>this.articles?.filter(
          (value: article, index, array) => {
            return !(<number[]>articleIds).includes(value.id);
          }
        );
      }

      browser.runtime.sendMessage({
        command: "markAsRead",
        articleIds: articleIds,
      });
    },
    updateUi() {
      browser.storage.local
        .get([
          "url",
          "authorization",
          "unreadCount",
          "unreadArticles",
          "feedMetadata",
        ])
        .then(
          ({
            url,
            authorization,
            unreadCount,
            unreadArticles,
            feedMetadata,
          }) => {
            this.url = url;
            this.authorization = authorization;
            this.unreadCount = unreadCount;
            this.articles = unreadArticles as any[];
            this.feedMetadata = feedMetadata;

            if (authorization && url != null) {
              if (this.articles) {
                this.articles.sort((a: article, b: article) => {
                  return a.pubDate > b.pubDate
                    ? -1
                    : a.pubDate < b.pubDate
                      ? 1
                      : 0;
                });
              }
            }
          }
        );
    },
  },
});
</script>
<style>
.wrapper {
  padding: 0.65em;
  font-family: var(--font-face);
  color: var(--color-main-text);
}

.header {
  display: block;
  overflow: hidden;
}

.header h1 {
  margin: 0;
}

.connection-config-message {
  display: flex;
  align-items: center;
}

.connection-config-message h2 {
  font-weight: normal;
  margin: 0 0.5em 0 0;
}

.feed {}

ul#articles {
  list-style: none;
  padding: 0px;
  margin: 0;
}

ul#articles li {
  border-bottom-color: var(--color-border);
  border-bottom-style: solid;
  border-bottom-width: 2px;
  padding-top: 0.5em;
  padding-bottom: 0.5em;
}

ul#articles li:last-child {
  border-bottom: none;
  padding-bottom: 0em;
}

.article {
  display: flex;
  justify-content: space-between;
}

.title {
  font-weight: bold;
  font-size: 1.25em;
  text-decoration: none;
  color: var(--color-main-text);
}

.button-set {
  min-width: fit-content;
  margin-left: 1em;
}

.button {
  width: 1.25rem;
  height: 1.25rem;
  margin-left: auto;
  background-size: cover;
  background-color: unset;
  border: 2px #222 solid;
  border-radius: 4px;
}

.button:hover {
  background-color: gray;
}

.read-button {
  background-image: var(--icon-checkmark-000);
}

.site-info {
  display: flex;
  align-items: center;
  margin-top: 0.2em;
}

.site-icon {
  margin-right: 0.5em;
}

.article-teaser,
.site-link {
  font-weight: normal;
  font-size: 1.1em;
  color: var(--color-main-text);
  text-decoration: none;
  margin: 0;
}

.body-button {
  background-image: var(--icon-triangle-n-000);
}

.body-button.hide-body {
  background-image: var(--icon-triangle-s-000);
}

.body-info {
  margin-top: 3px;
  padding: 5px;
  border-style: solid;
  border-radius: 3px;
  border-width: 1px;
  border-color: var(--color-primary);
  font-size: 1em;
}

.body-info.hide-body {
  display: none;
}

.body-info img,
.body-info iframe {
  max-width: 100%;
  height: auto;
}
</style>
