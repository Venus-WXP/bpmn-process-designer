<template>
  <div class="panel-tab__content">
    <div class="panel-tab__content--title">
      <span><i class="el-icon-menu" style="margin-right: 8px; color: #555555"></i>消息列表</span>
      <el-button type="primary" icon="el-icon-plus" @click="openModel('message')">创建新消息</el-button>
    </div>
    <el-table :data="messageList" size="mini" border>
      <el-table-column type="index" label="序号" width="60px" align="center" />
      <el-table-column label="消息ID" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column label="消息名称" prop="name" max-width="300px" show-overflow-tooltip />
      <el-table-column label="操作" width="60px" align="center">
        <template #default="{ row }">
          <el-button size="mini" type="text" style="color: #ff4d4f" @click="removeObject('message', row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="panel-tab__content--title" style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #eeeeee">
      <span><i class="el-icon-menu" style="margin-right: 8px; color: #555555"></i>信号列表</span>
      <el-button type="primary" icon="el-icon-plus" @click="openModel('signal')">创建新信号</el-button>
    </div>
    <el-table :data="signalList" size="mini" border>
      <el-table-column type="index" label="序号" width="60px" align="center" />
      <el-table-column label="信号ID" prop="id" max-width="300px" show-overflow-tooltip />
      <el-table-column label="信号名称" prop="name" max-width="300px" show-overflow-tooltip />
      <el-table-column label="操作" width="60px" align="center">
        <template #default="{ row }">
          <el-button size="mini" type="text" style="color: #ff4d4f" @click="removeObject('signal', row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :visible.sync="modelVisible" :title="modelConfig.title" :close-on-click-modal="false" width="600px" append-to-body destroy-on-close>
      <el-form
        ref="form"
        :model="modelObjectForm"
        :validate-on-rule-change="false"
        status-icon
        :rules="validationRules"
        label-width="90px"
        @submit.native.prevent
      >
        <el-form-item :label="modelConfig.idLabel" prop="id">
          <el-input v-model="modelObjectForm.id" clearable />
        </el-form-item>
        <el-form-item :label="modelConfig.nameLabel" prop="name">
          <el-input v-model="modelObjectForm.name" clearable />
        </el-form-item>
      </el-form>
      <template slot="footer">
        <el-button icon="el-icon-close" @click="modelVisible = false">取 消</el-button>
        <el-button type="success" icon="el-icon-finished" @click="addNewObject">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script>
import { buildValidationRules } from "@/designer/bpmn-modeler/utils";

export default {
  name: "SignalAndMassage",
  data() {
    return {
      signalList: [],
      messageList: [],
      modelVisible: false,
      modelType: "",
      modelObjectForm: {}
    };
  },
  computed: {
    modelConfig() {
      if (this.modelType === "message") {
        return { title: "创建消息", idLabel: "消息ID", nameLabel: "消息名称" };
      } else {
        return { title: "创建信号", idLabel: "信号ID", nameLabel: "信号名称" };
      }
    },
    validationRules() {
      if (this.modelType === "message") {
        return buildValidationRules([
          { prop: "id", name: "消息ID", trigger: "blur" },
          { prop: "name", name: "消息名称", trigger: "blur" }
        ]);
      } else {
        return buildValidationRules([
          { prop: "id", name: "信号ID", trigger: "blur" },
          { prop: "name", name: "信号名称", trigger: "blur" }
        ]);
      }
    }
  },
  mounted() {
    this.initDataList();
  },
  methods: {
    initDataList() {
      this.rootElements = window.bpmnInstances.modeler.getDefinitions().rootElements;
      this.messageIdMap = {};
      this.signalIdMap = {};
      this.messageList = [];
      this.signalList = [];
      this.rootElements.forEach(el => {
        if (el.$type === "bpmn:Message") {
          this.messageIdMap[el.id] = true;
          this.messageList.push({ ...el });
        }
        if (el.$type === "bpmn:Signal") {
          this.signalIdMap[el.id] = true;
          this.signalList.push({ ...el });
        }
      });
    },
    openModel(type) {
      this.modelType = type;
      this.modelObjectForm = {};
      this.modelVisible = true;
    },
    addNewObject() {
      this.$refs.form.validate(valid => {
        if (valid) {
          if (this.modelType === "message") {
            if (this.messageIdMap[this.modelObjectForm.id]) {
              return this.$message.error("该消息已存在，请修改ID后重新保存");
            }
            const messageRef = window.bpmnInstances.moddle.create("bpmn:Message", this.modelObjectForm);
            this.rootElements.push(messageRef);
          } else {
            if (this.signalIdMap[this.modelObjectForm.id]) {
              return this.$message.error("该信号已存在，请修改ID后重新保存");
            }
            const signalRef = window.bpmnInstances.moddle.create("bpmn:Signal", this.modelObjectForm);
            this.rootElements.push(signalRef);
          }
          this.modelVisible = false;
          this.initDataList();
          this.$refs.form.resetFields();
        }
      });
    },
    removeObject(type, row) {
      this.$confirm(`确认移除该${type === "message" ? "消息" : "信号"}吗？`, "提示", {
        type: "warning",
        confirmButtonText: "确 认",
        cancelButtonText: "取 消"
      })
        .then(() => {
          const elIndex = this.rootElements.findIndex(
            el => ((type === "message" && el.$type === "bpmn:Message") || type === "signal" || el.$type === "bpmn:Signal") && el.id === row.id
          );
          if (elIndex > -1) {
            this.rootElements.splice(elIndex, 1);
            this.initDataList();
          }
        })
        .catch(() => {});
    }
  }
};
</script>
