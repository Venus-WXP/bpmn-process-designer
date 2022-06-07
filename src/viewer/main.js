import "element-ui/lib/theme-chalk/loading.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";
import Vue from "vue";
import App from "@/viewer/App";

new Vue({
  render: h => h(App)
}).$mount("#app");
