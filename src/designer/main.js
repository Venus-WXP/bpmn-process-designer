import Vue from "vue";
import App from "./App.vue";

import axios from "axios";
Vue.prototype.$axios = axios;

// ElementUI
import "@/designer/bpmn-modeler/style/element-variables.scss";
import ElementUI from "element-ui";
Vue.use(ElementUI);

// 加载建模器
import "@/designer/bpmn-modeler/style/index.scss";
import BpmnModeler from "@/designer/bpmn-modeler";
Vue.use(BpmnModeler);

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css";

Vue.prototype.$bus = new Vue();

new Vue({
  render: h => h(App)
}).$mount("#app");
