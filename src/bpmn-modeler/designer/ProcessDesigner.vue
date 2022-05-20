<template>
  <div class="process-designer">
    <div class="process-designer__header" ref="header">
      <slot name="control-header"></slot>
      <template v-if="!$slots['control-header']">
        <el-button-group key="file-control">
          <el-button type="primary" icon="el-icon-document-checked">保存流程定义</el-button>
          <el-button type="primary" icon="el-icon-view" @click="previewProcessXML">预览XML</el-button>
        </el-button-group>
        <el-button-group key="align-control">
          <el-tooltip effect="light" content="水平居中">
            <el-button class="align align-center" icon="el-icon-s-data" @click="elementsAlign('center')" />
          </el-tooltip>
          <el-tooltip effect="light" content="垂直居中">
            <el-button class="align align-middle" icon="el-icon-s-data" @click="elementsAlign('middle')" />
          </el-tooltip>
        </el-button-group>
        <el-button-group key="scale-control">
          <el-tooltip effect="light" content="缩小视图">
            <el-button :disabled="defaultZoom < 0.2" icon="el-icon-zoom-out" @click="processZoomOut()" />
          </el-tooltip>
          <el-button>{{ Math.floor(this.defaultZoom * 10 * 10) + "%" }}</el-button>
          <el-tooltip effect="light" content="放大视图">
            <el-button :disabled="defaultZoom > 4" icon="el-icon-zoom-in" @click="processZoomIn()" />
          </el-tooltip>
          <el-tooltip effect="light" content="重置视图并居中">
            <el-button icon="el-icon-c-scale-to-original" @click="processReZoom()" />
          </el-tooltip>
        </el-button-group>
        <el-button-group key="stack-control">
          <el-tooltip effect="light" content="撤销">
            <el-button :disabled="!revocable" icon="el-icon-refresh-left" @click="processUndo()" />
          </el-tooltip>
          <el-tooltip effect="light" content="恢复">
            <el-button :disabled="!recoverable" icon="el-icon-refresh-right" @click="processRedo()" />
          </el-tooltip>
          <el-tooltip effect="light" content="重新绘制">
            <el-button icon="el-icon-refresh" @click="processRestart" />
          </el-tooltip>
        </el-button-group>
      </template>
    </div>
    <div class="process-designer__container">
      <div class="process-designer__canvas" ref="bpmn-canvas"></div>
    </div>
    <el-dialog class="code-dialog" title="流程定义XML预览" width="70%" :visible.sync="previewModelVisible" append-to-body destroy-on-close>
      <pre>
        <code class="hljs xml" v-html="previewResult"></code>
      </pre>
      <template #footer>
        <el-button icon="el-icon-download" type="success" @click="downloadProcess('bpmn', currentProcessName)">下载流程定义文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import BpmnModeler from "bpmn-js/lib/Modeler";
import defaultEmptyXML from "./plugins/empty-template";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
hljs.registerLanguage("xml", xml);
// 翻译方法
import customTranslate from "./plugins/translate/custom-translate";
import translationsCN from "./plugins/translate/zh";
// 标签解析 Moddle
import activitiModdleDescriptor from "./plugins/descriptor/activiti-descriptor.json";
// 标签解析 Extension
import activitiModdleExtension from "./plugins/extension-moddle/activiti";
import { debounce } from "min-dash";

export default {
  name: "ProcessDesigner",
  props: {
    value: String, // xml 字符串
    processId: String,
    processName: String,
    options: {
      type: Object,
      default: () => ({})
    }, // 自定义的翻译文件
    additionalModel: [Object, Array], // 自定义model
    moddleExtension: Object, // 自定义moddle
    events: {
      type: Array,
      default: () => ["element.click"]
    }
  },
  data() {
    return {
      defaultZoom: 1,
      previewModelVisible: false,
      previewResult: "",
      recoverable: false,
      revocable: false,
      currentProcessName: ""
    };
  },
  computed: {
    additionalModules() {
      const Modules = [];

      // 插入用户自定义扩展模块
      if (Object.prototype.toString.call(this.additionalModel) === "[object Array]") {
        Modules.push(...this.additionalModel);
      } else {
        this.additionalModel && Modules.push(this.additionalModel);
      }

      // 翻译模块
      const TranslateModule = {
        translate: ["value", customTranslate(translationsCN)]
      };
      Modules.push(TranslateModule);

      // 根据需要的流程类型设置扩展元素构建模块
      Modules.push(activitiModdleExtension);

      return Modules;
    },
    moddleExtensions() {
      const Extensions = {};

      // 插入用户自定义模块
      if (this.moddleExtension) {
        for (let key in this.moddleExtension) {
          Extensions[key] = this.moddleExtension[key];
        }
      }

      // 设置流程解析文件
      Extensions.activiti = activitiModdleDescriptor;

      return Extensions;
    }
  },
  mounted() {
    this.initBpmnModeler();
    this.createNewDiagram(this.value);
    this.$once("hook:beforeDestroy", () => {
      if (this.bpmnModeler) this.bpmnModeler.destroy();
      this.$emit("destroy", this.bpmnModeler);
      this.bpmnModeler = null;
    });
  },
  methods: {
    initBpmnModeler() {
      if (this.bpmnModeler) return;
      this.bpmnModeler = new BpmnModeler({
        container: this.$refs["bpmn-canvas"],
        keyboard: { bindTo: document },
        additionalModules: this.additionalModules,
        moddleExtensions: this.moddleExtensions,
        ...this.options
      });
      this.$emit("init-finished", this.bpmnModeler);
      this.initModelListeners();
    },
    initModelListeners() {
      const EventBus = this.bpmnModeler.get("eventBus");
      // 注册需要的监听事件，将 . 替换为 - 避免解析异常
      this.events.forEach(event => {
        EventBus.on(event, eventObj => {
          const eventName = event.replace(/\./g, "-");
          const element = eventObj ? eventObj.element : null;
          this.$emit(eventName, element, eventObj);
        });
      });
      // 监听图形改变返回xml
      EventBus.on(
        "commandStack.changed",
        debounce(async event => {
          try {
            this.recoverable = this.bpmnModeler.get("commandStack").canRedo();
            this.revocable = this.bpmnModeler.get("commandStack").canUndo();
            this.currentProcessName = this.bpmnModeler.get("canvas").getRootElement().businessObject.name;
            const { xml } = await this.bpmnModeler.saveXML({ format: true });
            this.$emit("commandStack-changed", event);
            this.$emit("input", xml);
            this.$emit("change", xml);
          } catch (e) {
            console.error(`获取流程定义XML内容出现错误：${e.message || e}`);
          }
        }, 500)
      );
      // 监听视图缩放变化
      this.bpmnModeler.on("canvas.viewbox.changed", ({ viewbox }) => {
        this.$emit("canvas-viewbox-changed", { viewbox });
        const { scale } = viewbox;
        this.defaultZoom = Math.floor(scale * 100) / 100;
      });
    },
    /* 创建新的流程图 */
    async createNewDiagram(xml) {
      // 将字符串转换成图显示出来
      const newId = this.processId || `Process_${new Date().getTime()}`;
      const newName = this.processName || `业务流程_${new Date().getTime()}`;
      this.currentProcessName = newName;
      const xmlString = xml || defaultEmptyXML(newId, newName);
      try {
        const { warnings } = await this.bpmnModeler.importXML(xmlString);
        if (warnings && warnings.length) {
          warnings.forEach(warn => console.warn(warn));
        }
      } catch (e) {
        this.$message.error(`渲染流程定义XML出现错误：${e?.message || e}`);
        console.error(`渲染流程定义XML出现错误：${e?.message || e}`);
      }
    },
    // 下载流程定义到本地
    /**
     * @param {string} type
     * @param {*} name
     */
    async downloadProcess(type, name) {
      try {
        // 按需要类型创建文件并下载
        if (type === "bpmn") {
          const { err, xml } = await this.bpmnModeler.saveXML();
          // 读取异常时抛出异常
          if (err) {
            this.$message.error(`保存流程定义XML出错：${err.message || err}`);
            console.error(`保存流程定义XML出错：${err.message || err}`);
            return;
          }
          const { href, filename } = this.setEncoded("bpmn20.xml", name, xml);
          downloadFunc(href, filename);
        } else {
          const { err, svg } = await this.bpmnModeler.saveSVG();
          // 读取异常时抛出异常
          if (err) {
            this.$message.error(`保存流程定义SVG出错：${err.message || err}`);
            console.error(`保存流程定义SVG出错：${err.message || err}`);
            return;
          }
          const { href, filename } = this.setEncoded("svg", name, svg);
          downloadFunc(href, filename);
        }
      } catch (e) {
        this.$message.error(`保存流程定义内容出错：${e.message || e}`);
        console.error(`保存流程定义内容出错：${e.message || e}`);
      }
      // 文件下载方法
      function downloadFunc(href, filename) {
        if (href && filename) {
          const a = document.createElement("a");
          a.download = filename; // 指定下载的文件名
          a.href = href; // URL对象
          a.click(); // 模拟点击
          URL.revokeObjectURL(a.href); // 释放URL 对象
        }
      }
    },
    // 根据所需类型进行转码并返回下载地址
    setEncoded(type, filename = "流程定义文件", data) {
      const encodedData = encodeURIComponent(data);
      return {
        filename: `${filename}.${type}`,
        href: `data:application/${type === "svg" ? "text/xml" : "bpmn20-xml"};charset=UTF-8,${encodedData}`,
        data: data
      };
    },
    /* ------------------------------------------------ refs methods ------------------------------------------------------ */
    processRedo() {
      this.bpmnModeler.get("commandStack").redo();
    },
    processUndo() {
      this.bpmnModeler.get("commandStack").undo();
    },
    processZoomIn(zoomStep = 0.1) {
      let newZoom = Math.floor(this.defaultZoom * 100 + zoomStep * 100) / 100;
      if (newZoom > 4) {
        throw new Error("[Process Designer Warn ]: The zoom ratio cannot be greater than 4");
      }
      this.defaultZoom = newZoom;
      this.bpmnModeler.get("canvas").zoom(this.defaultZoom);
    },
    processZoomOut(zoomStep = 0.1) {
      let newZoom = Math.floor(this.defaultZoom * 100 - zoomStep * 100) / 100;
      if (newZoom < 0.2) {
        throw new Error("[Process Designer Warn ]: The zoom ratio cannot be less than 0.2");
      }
      this.defaultZoom = newZoom;
      this.bpmnModeler.get("canvas").zoom(this.defaultZoom);
    },
    processZoomTo(newZoom = 1) {
      if (newZoom < 0.2) {
        throw new Error("[Process Designer Warn ]: The zoom ratio cannot be less than 0.2");
      }
      if (newZoom > 4) {
        throw new Error("[Process Designer Warn ]: The zoom ratio cannot be greater than 4");
      }
      this.defaultZoom = newZoom;
      this.bpmnModeler.get("canvas").zoom(newZoom);
    },
    processReZoom() {
      this.defaultZoom = 1;
      this.bpmnModeler.get("canvas").zoom("fit-viewport", "auto");
    },
    processRestart() {
      this.recoverable = false;
      this.revocable = false;
      this.createNewDiagram(null);
    },
    elementsAlign(align) {
      const Align = this.bpmnModeler.get("alignElements");
      const Selection = this.bpmnModeler.get("selection");
      const SelectedElements = Selection.get();
      if (!SelectedElements || SelectedElements.length <= 1) {
        this.$message.warning("请按住 Ctrl 键选择多个元素后再进行对齐操作");
        return;
      }
      this.$confirm("自动对齐可能造成图形变形，是否继续？", "提示", {
        confirmButtonText: "确 定",
        cancelButtonText: "取 消",
        type: "warning"
      }).then(() => Align.trigger(SelectedElements, align));
    },
    /*-----------------------------    方法结束     ---------------------------------*/
    previewProcessXML() {
      this.bpmnModeler.saveXML({ format: true }).then(({ xml }) => {
        this.previewResult = hljs.highlight(xml, {
          language: "xml"
        }).value;
        this.previewModelVisible = true;
      });
    }
  }
};
</script>
