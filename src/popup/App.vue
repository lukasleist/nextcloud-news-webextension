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
    <UnreadCountHeader v-else-if="unreadCount != null" :url="url" :unreadCount="unreadCount" @reload="triggerUpdate"
      @markAllAsRead="markAsRead" />
    <div class="feed">
      <LoadingOverlay v-if="loading"></LoadingOverlay>
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
import Article from "./Article.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import UnreadCountHeader from "./UnreadCountHeader.vue";
import NcButton from "@nextcloud/vue/dist/Components/NcButton";
import ArrowRight from 'vue-material-design-icons/ArrowRight.vue';

export default defineComponent({
  components: {
    Article,
    LoadingOverlay,
    UnreadCountHeader,
    ArrowRight,
    NcButton
  },
  data() {
    return {
      loading: false,
      authorization: <string | null>null,
      url: <string | null>null,
      unreadCount: <number | null>null,
      articles: <any[] | null>null,
      feedMetadata: <any | null>null,
    };
  },
  mounted() {
    browser.storage.local
      .get([
        "url",
        "authorization"]).then(({
          url,
          authorization, }) => {
          this.url = url;
          this.authorization = authorization
        });
    this.updateUi();
    browser.runtime.onMessage.addListener(({ command }) => {
      if (command == "updateUi") {
        this.updateUi();
      }
    });
  },
  methods: {
    triggerUpdate() {
      this.loading = true;
      browser.runtime.sendMessage({ command: "update" }).then((value) => {
        console.log(value);
        this.updateUi();
      }).then(_ => this.loading = false);
    },
    /**
     * Marks the articles with the given is as read, which triggers an update and should remove the article from the list
     * if no article Ids are passed. All articles get marked as read.
     * @param articleIds 
     */
    markAsRead(articleIds?: number | number[]) {
      if (!articleIds) {
        this.loading = true;
        articleIds = this.articles!.map(article => article.id);
      }
      browser.runtime.sendMessage({
        command: "markAsRead",
        articleIds: [articleIds].flat(),  //makes sure article Ids get passed as a List, even, if original is an atomic value
      }).then(_ => this.loading = false);
    },
    updateUi() {
      browser.storage.local
        .get([
          "unreadCount",
          "unreadArticles",
          "feedMetadata",
        ])
        .then(
          ({
            unreadCount,
            unreadArticles,
            feedMetadata,
          }) => {
            this.unreadCount = unreadCount;
            this.articles = unreadArticles as any[];
            this.feedMetadata = feedMetadata;
          }
        );
    },
  },
});
</script>
<style>
.wrapper {
  padding: 0.65em;
  margin-right: 0.65em;
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

.feed {
  position: relative;
}

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

.button-set {
  min-width: fit-content;
  margin-left: 1em;
}

.button {
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 3px;
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
</style>
