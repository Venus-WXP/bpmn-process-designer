<template>
  <div id="app" v-loading="initLoading">
    <process-designer
      :options="{
        taskResizingEnabled: true,
        eventResizingEnabled: true
      }"
      v-model="xmlString"
      v-bind="controlForm"
      keyboard
      ref="processDesigner"
      @init-finished="initModeler"
    />
    <properties-panel :bpmn-modeler="modeler" :process-key-and-name-disabled="processKeyAndNameDisabled" :process-form="processForm" class="process-panel" />
  </div>
</template>

<script>
// 颜色插件
import ColorPicker from "bpmn-js-color-picker";
// 自定义元素选中时的弹出菜单（修改 默认任务 为 用户任务）
import CustomContentPadProvider from "./bpmn-modeler/designer/plugins/content-pad";
// 自定义左侧菜单（修改 默认任务 为 用户任务）
import CustomPaletteProvider from "./bpmn-modeler/designer/plugins/palette";
import Log from "./bpmn-modeler/log";
// 图形大小拖拽
import TaskResizer from "bpmn-js-task-resize/lib";

export default {
  name: "App",
  data() {
    return {
      xmlString: "",
      modeler: null,
      controlForm: {
        processId: "",
        processName: "",
        events: ["element.click", "element.contextmenu"],
        additionalModel: [CustomContentPadProvider, CustomPaletteProvider, TaskResizer, ColorPicker]
      },
      initLoading: false,
      processKeyAndNameDisabled: false,
      processForm: null
    };
  },
  created() {
    this.$bus.$on("produce", eventType => {
      window.parent.postMessage(
        {
          type: "produce",
          produceType: eventType
        },
        "*"
      );
    });
    window.addEventListener("message", this.onMessage);
  },
  mounted() {
    window.parent.postMessage(
      {
        type: "initialized"
      },
      "*"
    );
  },
  beforeDestroy() {
    this.$bus.$off("produce");
    window.removeEventListener("message", this.onMessage);
  },
  methods: {
    onMessage({ data }) {
      if (!(typeof data === "object")) {
        return;
      }
      if (data.type === "init") {
        // Log.prettyPrimary("收到初始化事件：", JSON.stringify(data.data));
        if (data.data.processKeyAndNameDisabled) {
          this.processKeyAndNameDisabled = true;
        }
        this.processForm = data.data.processForm;
        const xml = data.data.processDefinitionXml;
        if (xml) {
          this.$refs.processDesigner.createNewDiagram(xml);
        } else {
          const processId = data.data.processId;
          const processName = data.data.processName;

          if (processId && processName) {
            this.controlForm.processId = processId;
            this.controlForm.processName = processName;
            this.$nextTick(() => this.$refs.processDesigner.createNewDiagram());
          }
        }
      } else {
        // 派发给别的组件
        this.$bus.$emit(data.type, data.data);
      }
    },
    initModeler(modeler) {
      setTimeout(() => {
        this.modeler = modeler;
        const canvas = modeler.get("canvas");
        const rootElement = canvas.getRootElement();
        Log.prettyPrimary("流程ID：", rootElement.id);
        Log.prettyPrimary("流程名称：", rootElement.businessObject.name);
      }, 10);
    }
  }
};
</script>

<style lang="scss">
body {
  overflow: hidden;
  margin: 0;
  box-sizing: border-box;
}
#app {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  display: inline-grid;
  grid-template-columns: auto max-content;
}

body,
body * {
  /* 滚动条 */
  &::-webkit-scrollbar-track-piece {
    background-color: #fff; /*滚动条的背景颜色*/
    -webkit-border-radius: 0; /*滚动条的圆角宽度*/
  }
  &::-webkit-scrollbar {
    width: 10px; /*滚动条的宽度*/
    height: 8px; /*滚动条的高度*/
  }
  &::-webkit-scrollbar-thumb:vertical {
    /*垂直滚动条的样式*/
    height: 50px;
    background-color: rgba(153, 153, 153, 0.5);
    -webkit-border-radius: 4px;
    outline: 2px solid #fff;
    outline-offset: -2px;
    border: 2px solid #fff;
  }
  &::-webkit-scrollbar-thumb {
    /*滚动条的hover样式*/
    background-color: rgba(159, 159, 159, 0.3);
    -webkit-border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    /*滚动条的hover样式*/
    background-color: rgba(159, 159, 159, 0.5);
    -webkit-border-radius: 4px;
  }
}
</style>
