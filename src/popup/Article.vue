<template>
  <li v-if="article">
    <div class="article">
      <div>
        <a :href="article.url" class="title" @click="openArticle">
          {{ article.title }}
        </a>
        <div class="site-info">
          <img class="site-icon" height="16" width="16" :src="faviconSrc" />
          <span class="article-teaser"
            ><a class="site-link" :href="domainLink" @click="openSite">
              {{ articleLinkText }}</a
            ><span v-if="article.pubDate" class="article-age"
              >, {{ article.pubDate | ageDescriptor }}</span
            ></span
          >
        </div>
      </div>
      <div class="button-set">
        <button
          :title="'expandShowExtraContent' | i18n"
          class="button body-button hide-body"
          @click="
            () => {
              previewOpened = !previewOpened;
            }
          "
        ></button>
        <button
          :title="'markAsReadTitle' | i18n"
          class="button read-button"
          @click="markAsRead"
        ></button>
      </div>
    </div>
    <div v-if="previewOpened" class="body-info">
      <p>{{ article.author }}</p>
      <div v-if="article.body" v-html="article.body"></div>
      {{ article.mediaThumbnail }}
      {{ article.mediaDescription }}
      <img v-if="article.mediaThumbnail" :src="article.mediaThumbnail" />
      <p v-if="article.mediaDescription">{{ article.mediaDescription }}</p>
    </div>
  </li>
</template>
<script lang="ts">
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

export default {
  data() {
    return {
      previewOpened: false,
    };
  },
  props: {
    article: Object,
    feedMetadata: Object,
  },
  computed: {
    feed(): any {
      return this.feedMetadata![this.article!.feedId];
    },
    /**
     * This needs to check for the link in the full rss feed. If the rss feed has a link, use that.
     * Otherwise, default to the url in the feed.
     * @returns
     */
    sourceURL(): string {
      if (this.feed.link) {
        return this.feed.link;
      } else {
        return this.article!.url;
      }
    },
    /**
     * articleDomain is JUST the domain portion for usage in getting the ico.
     */
    articleDomain(): string {
      return this.sourceURL
        .replace("http://", "")
        .replace("https://", "")
        .split(/[/?#]/)[0];
    },
    articleLinkText(): string {
      return this.feed.title
        ? this.feed.title
        : this.article!.author
        ? this.article!.author
        : this.articleDomain;
    },
    /**
     * calculate the domain for the icon and site link.
     */
    faviconSrc(): string {
      if (this.feed.faviconLink) {
        return this.feed.faviconLink;
      } else {
        return `https://icons.duckduckgo.com/ip3/${this.articleDomain}.ico`;
      }
    },
    /**
     * domainLink is the link that you go to if you click on the "author" instead of the article.
     */
    domainLink(): string {
      const protoMatchRegex = /https:\/\//gm;
      if (protoMatchRegex.exec(this.sourceURL)) {
        return "https://" + this.articleDomain;
      } else {
        return "http://" + this.articleDomain;
      }
    },
  },
  methods: {
    openArticle(): void {
      browser.tabs.create({ url: this.article!.url, active: false });
      this.markAsRead();
    },
    openSite(): void {
      browser.tabs.create({ url: this.domainLink, active: false });
    },
    markAsRead(): void {
      this.$emit("markAsRead", this.article!.id);
    },
  },
  filters: {
    ageDescriptor: function (pubDateTimestamp: number): string {
      let secondsLeft = Math.floor(Date.now() / 1000 - pubDateTimestamp);
      let days = Math.floor((secondsLeft %= 31536000) / 86400);
      if (days) {
        if (days == 1) return browser.i18n.getMessage("oneDayAgo");
        else return browser.i18n.getMessage("daysAgo", [days.toString()]);
      }
      let hours = Math.floor((secondsLeft %= 86400) / 3600);
      if (hours) {
        if (hours == 1) return browser.i18n.getMessage("oneHourAgo");
        else return browser.i18n.getMessage("hoursAgo", [hours.toString()]);
      }
      var minutes = Math.floor((secondsLeft %= 3600) / 60);
      if (minutes && minutes > 1) {
        return browser.i18n.getMessage("minutesAgo", [minutes.toString()]);
      }
      return browser.i18n.getMessage("justNow");
    },
  },
};
</script>
<style scoped></style>
