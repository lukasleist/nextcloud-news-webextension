import Vue from "vue";
import App from "./App.vue";
import { i18n, pageTitleI18n } from "../fiters";

pageTitleI18n();

Vue.filter("i18n", i18n);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
