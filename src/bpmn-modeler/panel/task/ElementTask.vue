<template>
  <div class="panel-tab__content">
    <el-form label-width="90px" @submit.native.prevent>
      <el-form-item label="异步执行">
        <el-checkbox v-model="taskConfigForm.async" label="启用异步" @change="changeTaskAsync('async')" />
        <el-checkbox v-model="taskConfigForm.exclusive" v-if="taskConfigForm.async" label="排它执行" @change="changeTaskAsync" />
      </el-form-item>
      <component :is="whichTaskComponent" v-bind="$props" />
    </el-form>
  </div>
</template>

<script>
import UserTask from "./task-components/UserTask";
import ScriptTask from "./task-components/ScriptTask";
import ReceiveTask from "./task-components/ReceiveTask";

export default {
  name: "ElementTaskConfig",
  components: { UserTask, ScriptTask, ReceiveTask },
  props: {
    id: String,
    type: String
  },
  data() {
    return {
      taskConfigForm: {
        async: false,
        exclusive: false
      },
      whichTaskComponent: "",
      installedComponent: {
        // 手工任务与普通任务一致，不需要其他配置
        // 接收消息任务，需要在全局下插入新的消息实例，并在该节点下的 messageRef 属性绑定该实例
        // 发送任务、服务任务、业务规则任务共用一个相同配置
        UserTask: "UserTask", // 用户任务配置
        ScriptTask: "ScriptTask", // 脚本任务配置
        ReceiveTask: "ReceiveTask" // 消息接收任务
      }
    };
  },
  watch: {
    id: {
      immediate: true,
      handler() {
        this.bpmnElement = window.bpmnInstances.bpmnElement;
        this.taskConfigForm.async = this.bpmnElement?.businessObject?.async;
        this.taskConfigForm.exclusive = this.bpmnElement?.businessObject?.exclusive;
      }
    },
    type: {
      immediate: true,
      handler() {
        this.whichTaskComponent = this.installedComponent[this.type];
      }
    }
  },
  methods: {
    changeTaskAsync(key) {
      if (!this.taskConfigForm.async) {
        this.taskConfigForm.exclusive = false;
      } else if (key === "async") {
        this.taskConfigForm.exclusive = true;
      }
      window.bpmnInstances.modeling.updateProperties(window.bpmnInstances.bpmnElement, {
        ...this.taskConfigForm
      });
    }
  }
};
</script>
