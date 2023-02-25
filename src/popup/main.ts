import Vue from "vue";
import App from "./App.vue";
import { i18n, pageTitleI18n } from "../filters";

pageTitleI18n();

Vue.filter("i18n", i18n);

export default new Vue({
  render: (h) => h(App),
}).$mount("#app");
