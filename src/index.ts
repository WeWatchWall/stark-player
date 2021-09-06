import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';

import MainComponent from './main.vue';
import { ConfigState } from './objectmodels/configState';

// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap-vue/dist/bootstrap-vue.css';

export default async function (arg) {
  Vue.use(BootstrapVue);
  Vue.use(IconsPlugin);

  let config = new ConfigState(arg);
  config.init();

  new Vue({
    el: `#${arg.package}-${arg.pod}`,
    render: h => h(MainComponent),
  });
}
