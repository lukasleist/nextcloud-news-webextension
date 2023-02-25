<template>
  <div class="wrapper">
    <form class="inner" @submit.prevent="auth">
      <h1>{{ "optionsPageTitle" | i18n }}</h1>
      <div class="instructions">
        <div class="hint">
          <span>{{ "optionsPageHint" | i18n }}</span>
          <NcButton aria-label="Show Help" @click="showHelp = !showHelp">
            <template #icon>
              <HelpCircle fill-color="gray" :size="16" />
            </template>
          </NcButton>
        </div>
        <div class="help">
          <div v-if="showHelp" v-html="'optionsPageHelp' | i18n"></div>
        </div>
      </div>

      <NcTextField
        class="url-input"
        label="Nextcloud URL"
        :label-visible="true"
        :value.sync="url"
        placeholder="https://nextcloud.example.com"
        trailing-button-icon="close"
        :show-trailing-button="url.length > 0"
        @trailing-button-click="url = ''"
      >
      </NcTextField>

      <NcButton class="auth-button" nativeType="submit" type="primary">
        <template>Authorize</template>
      </NcButton>
    </form>
  </div>
</template>
<script lang="ts">
import browser from "webextension-polyfill";
import NcTextField from "@nextcloud/vue/dist/Components/NcTextField";
import NcButton from "@nextcloud/vue/dist/Components/NcButton";
import HelpCircle from "vue-material-design-icons/HelpCircle.vue";

export default {
  components: {
    NcTextField,
    NcButton,
    HelpCircle,
  },
  data() {
    return {
      url: "",
      showHelp: false,
    };
  },
  mounted() {
    browser.storage.local.get("url").then(({ url = "" }) => {
      this.url = url;
    });
  },
  methods: {
    auth() {
      browser.storage.local.clear().then(() => {
        if (this.url[this.url.length - 1] == "/") {
          this.url = this.url.slice(0, -1);
        }
        browser.storage.local.set({ url: this.url }).then();
      });
    },
  },
};
</script>
<style scoped>
h1 {
  margin: 0;
}
.wrapper,
.inner {
  display: inline-flex;
  align-items: center;
  flex-direction: column;
}
.wrapper {
  padding: 0;
  width: 100%;
  height: 100%;
  justify-content: center;
}
.inner {
  padding: 32px;
  border: 1px solid rgb(232, 232, 232);
  border-radius: var(--border-radius-large);
}
.url-input {
  margin-bottom: 1em;
}
.auth-button {
  align-self: flex-end;
}
.instructions {
  width: 100%;
  display: inline-block;
}
.hint {
  display: flex;
  align-items: center;
}
.help div {
  flex-grow: 1;
  width: 0;
  background: lightgray;
  padding: 0.67em;
  margin-bottom: 1em;
  border-radius: var(--border-radius);
  border-left: gray solid 4px;
}
.help {
  display: flex;
}
</style>
