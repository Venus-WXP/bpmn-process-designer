<template>
  <div class="container">
    <div id="viewer-container"></div>
    <div
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center"
      v-if="!loadingInstance && !hasImported"
    >
      <h1 style="color: #dcdfe6; font-size: 84px">暂无流程图</h1>
    </div>
  </div>
</template>

<script>
import Viewer from "bpmn-js/lib/Viewer";
import ModelingModule from "bpmn-js/lib/features/modeling";
import TouchModule from "diagram-js/lib/navigation/touch";
import { debounce } from "min-dash";
import { Loading } from "element-ui";

const colorConfig = {
  current: {
    fill: "#ecf5ff",
    stroke: "#2979ff"
  },
  finished: {
    fill: "#dbf1e1",
    stroke: "#19be6b"
  }
};

let viewer = null;

export default {
  name: "App",
  data() {
    return {
      hasImported: false,
      loadingInstance: null,
      loadingTimer: null
    };
  },
  created() {
    this.loadingInstance = Loading.service({
      fullscreen: true,
      body: true,
      text: "流程图初始化中..."
    });

    this.loadingTimer = setTimeout(() => {
      if (this.loadingInstance) {
        this.loadingInstance.close();
      }
    }, 6000);

    window.addEventListener("resize", this.moveCenter);
    window.addEventListener("message", this.onMessage);
  },
  mounted() {
    viewer = new Viewer({
      additionalModules: [ModelingModule, TouchModule],
      container: document.querySelector("#viewer-container")
    });
    window.parent.postMessage(
      {
        type: "initialized"
      },
      "*"
    );
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.moveCenter);
    window.removeEventListener("message", this.onMessage);
  },
  methods: {
    onMessage({ data }) {
      if (!(typeof data === "object")) {
        return;
      }
      if (data.type === "render") {
        if (data.data.processDefinitionXml) {
          this.importXml(data.data);
        }
      }
    },
    async importXml(toRenderConfig) {
      if (this.loadingInstance == null) {
        this.loadingInstance = Loading.service({
          fullscreen: true,
          body: true,
          text: "流程图初始化中..."
        });
      } else if (this.loadingTimer) {
        clearTimeout(this.loadingTimer);
      }

      if (viewer == null) {
        this.$nextTick(() => this.importXml(toRenderConfig));
        return;
      }
      await viewer.importXML(toRenderConfig.processDefinitionXml);
      this.hasImported = true;
      this.drawColor(toRenderConfig.highlightActivities || []);
      this.doMoveCenter();
      if (this.loadingInstance) {
        this.loadingInstance.close();
      }
    },
    moveCenter: debounce(function () {
      this.doMoveCenter();
    }, 50),
    doMoveCenter() {
      if (this.hasImported) {
        viewer.get("canvas").zoom("fit-viewport", "auto");
      }
    },
    drawColor(activities) {
      if (!this.hasImported) {
        return;
      }

      const modeling = viewer.get("modeling");
      const elementRegistry = viewer.get("elementRegistry");

      activities.forEach(activity => {
        const elem = elementRegistry.get(activity.id);
        if (elem && colorConfig[activity.status]) {
          modeling.setColor(elem, colorConfig[activity.status]);
        }
      });
    }
  }
};
</script>

<style lang="scss">
#helper-svg {
  position: fixed;
}
body {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  height: 100vh;
}
.container {
  height: 100%;
}
.bjs-powered-by {
  display: none;
}
#viewer-container {
  height: 100%;
}
</style>
