import Vue from "vue";
import App from "./App.vue";

import axios from "axios";
Vue.prototype.$axios = axios;

// ElementUI
import "@/bpmn-modeler/style/element-variables.scss";
import ElementUI from "element-ui";
Vue.use(ElementUI);

// 加载建模器
import "@/bpmn-modeler/style/index.scss";
import BpmnModeler from "@/bpmn-modeler/index.js";
Vue.use(BpmnModeler);

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";

new Vue({
  render: h => h(App)
}).$mount("#app");
