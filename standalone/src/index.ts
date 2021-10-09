import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import MainComponent from './main.vue';

export default async function (arg) {
  Vue.use(BootstrapVue);
  Vue.use(IconsPlugin);

  new Vue({
    el: `#${arg.package}-${arg.pod}`,
    render: h => h(MainComponent),
  });
}
