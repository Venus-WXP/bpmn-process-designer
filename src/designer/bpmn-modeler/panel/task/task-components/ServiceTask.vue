<template>
  <div style="margin-top: 16px">
    <el-form-item label="实现方式">
      <el-select v-model="serviceTaskForm.implementationType">
        <el-option label="Java类" value="class" />
        <el-option label="代理表达式" value="delegateExpression" />
        <el-option label="表达式" value="expression" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="serviceTaskForm.implementationType === 'class'" label="Java类">
      <el-input v-model="serviceTaskForm.class" clearable @input="updateElementTask" @change="updateElementTask" />
    </el-form-item>
    <el-form-item v-if="serviceTaskForm.implementationType === 'delegateExpression'" label="代理表达式">
      <el-input v-model="serviceTaskForm.delegateExpression" clearable @input="updateElementTask" @change="updateElementTask" />
    </el-form-item>
    <el-form-item v-if="serviceTaskForm.implementationType === 'expression'" label="表达式">
      <el-input v-model="serviceTaskForm.expression" clearable @input="updateElementTask" @change="updateElementTask" />
    </el-form-item>
    <el-form-item label="结果变量">
      <el-input v-model="serviceTaskForm.resultVariable" clearable @input="updateElementTask" @change="updateElementTask" />
    </el-form-item>
    <el-form-item label="跳过表达式">
      <el-input v-model="serviceTaskForm.skipExpression" clearable @input="updateElementTask" @change="updateElementTask" />
    </el-form-item>

    <!--字段列表-->
    <div class="element-property list-property">
      <el-divider><i class="el-icon-menu"></i> 注入字段</el-divider>
      <el-table :data="injectionFields" size="mini" max-height="480" border fit>
        <el-table-column label="序号" width="50px" type="index" align="center" />
        <el-table-column label="字段名称" min-width="100px" prop="name" />
        <el-table-column label="字段类型" min-width="80px" show-overflow-tooltip :formatter="row => (row.fieldType === 'string' ? '字符串' : '表达式')" />
        <el-table-column label="字段值/表达式" min-width="100px" show-overflow-tooltip :formatter="row => row.string || row.expression" />
        <el-table-column label="操作" width="100px" align="center">
          <template #default="{ row, $index }">
            <el-button type="text" size="mini" @click="openInjectionFieldForm(row, $index)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button type="text" size="mini" style="color: #ff4d4f" @click="removeInjectionField(row, $index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="element-drawer__button">
      <el-button type="primary" icon="el-icon-plus" @click="openInjectionFieldForm(null, -1)">添加字段</el-button>
    </div>

    <!-- 注入字段 编辑/创建 部分 -->
    <el-dialog title="字段配置" :visible.sync="injectionFieldFormModelVisible" width="600px" append-to-body destroy-on-close>
      <el-form :model="injectionField" label-width="96px" ref="injectionFieldFormRef" style="height: 136px" @submit.native.prevent>
        <el-form-item label="字段名称" prop="name" :rules="{ required: true, message: '请输入字段名称', trigger: ['blur', 'change'] }">
          <el-input v-model="injectionField.name" clearable />
        </el-form-item>
        <el-form-item label="字段类型" prop="fieldType" :rules="{ required: true, message: '请选择字段类型', trigger: ['blur', 'change'] }">
          <el-select v-model="injectionField.fieldType">
            <el-option label="字符串" value="string" />
            <el-option label="表达式" value="expression" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="injectionField.fieldType === 'string'"
          label="字段值"
          prop="string"
          key="field-string"
          :rules="{ required: true, message: '请输入字段值', trigger: ['blur', 'change'] }"
        >
          <el-input v-model="injectionField.string" clearable />
        </el-form-item>
        <el-form-item
          v-if="injectionField.fieldType === 'expression'"
          label="表达式"
          prop="expression"
          key="field-expression"
          :rules="{ required: true, message: '请输入表达式', trigger: ['blur', 'change'] }"
        >
          <el-input v-model="injectionField.expression" clearable />
        </el-form-item>
      </el-form>
      <template slot="footer">
        <el-button icon="el-icon-close" @click="injectionFieldFormModelVisible = false">取 消</el-button>
        <el-button type="success" icon="el-icon-finished" @click="saveInjectionField">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { createFieldObject, updateElementExtensions } from "@/designer/bpmn-modeler/utils";

export default {
  name: "ServiceTask",
  inject: ["prefix"],
  props: {
    id: String,
    type: String
  },
  data() {
    return {
      defaultTaskForm: {
        implementType: "",
        class: "",
        expression: "",
        delegateExpression: "",
        resultVariable: "",
        skipExpression: ""
      },
      serviceTaskForm: {
        implementationType: "",
        class: "",
        expression: "",
        delegateExpression: "",
        resultVariable: "",
        skipExpression: ""
      },
      injectionFields: [],
      injectionField: {
        name: "",
        fieldType: "",
        string: "",
        expression: ""
      },
      injectionFieldFormModelVisible: false,
      editingInjectionFieldIndex: -1,
      otherExtensions: []
    };
  },
  watch: {
    id: {
      immediate: true,
      handler() {
        this.bpmnElement = window.bpmnInstances.bpmnElement;
        this.$nextTick(() => this.resetTaskForm());
      }
    }
  },
  methods: {
    resetTaskForm() {
      for (const key in this.defaultTaskForm) {
        const value = this.bpmnElement?.businessObject[key] || this.defaultTaskForm[key];
        this.$set(this.serviceTaskForm, key, value);
      }

      this.extensionFields = this.bpmnElement.businessObject?.extensionElements?.values?.filter(ex => ex.$type === `${this.prefix}:Field`) ?? [];
      // 保留剩余扩展元素，便于后面更新该元素对应属性
      this.otherExtensions = this.bpmnElement.businessObject?.extensionElements?.values?.filter(ex => ex.$type !== `${this.prefix}:Field`);
      this.injectionFields = this.extensionFields.map(field => {
        return {
          name: field.name,
          fieldType: field.string ? "string" : "expression",
          string: field.string,
          expression: field.expression
        };
      });
    },
    updateElementTask() {
      const taskAttr = Object.create(null);
      taskAttr.skipExpression = this.serviceTaskForm.skipExpression || null;
      taskAttr.resultVariable = this.serviceTaskForm.resultVariable || null;
      if (this.serviceTaskForm.implementationType === "class") {
        taskAttr.class = this.serviceTaskForm.class || null;
      } else if (this.serviceTaskForm.implementationType === "delegateExpression") {
        taskAttr.delegateExpression = this.serviceTaskForm.delegateExpression || null;
      } else if (this.serviceTaskForm.implementationType === "expression") {
        taskAttr.expression = this.serviceTaskForm.expression;
      }
      window.bpmnInstances.modeling.updateProperties(this.bpmnElement, taskAttr);
    },
    // 打开监听器字段编辑弹窗
    openInjectionFieldForm(field, index) {
      this.injectionField = field ? { ...field } : {};
      this.editingInjectionFieldIndex = field ? index : -1;
      this.injectionFieldFormModelVisible = true;
      this.$nextTick(() => {
        if (this.$refs["injectionFieldFormRef"]) this.$refs["injectionFieldFormRef"].clearValidate();
      });
    },
    // 保存注入字段
    saveInjectionField() {
      this.$refs["injectionFieldFormRef"].validate(valid => {
        if (valid) {
          if (this.editingInjectionFieldIndex === -1) {
            this.injectionFields.push(this.injectionField);
          } else {
            this.injectionFields.splice(this.editingInjectionFieldIndex, 1, this.injectionField);
          }
          this.updateExtensionFields();
          this.injectionFieldFormModelVisible = false;
          this.$nextTick(() => (this.injectionField = {}));
        }
      });
    },
    updateExtensionFields() {
      updateElementExtensions(this.bpmnElement, this.otherExtensions.concat(this.injectionFields.map(field => createFieldObject(field, this.prefix))));
    },
    // 移除注入字段
    removeInjectionField(field, index) {
      this.$confirm("确认移除该字段吗？", "提示", {
        type: "warning",
        confirmButtonText: "确 认",
        cancelButtonText: "取 消"
      })
        .then(() => {
          this.injectionFields.splice(index, 1);
          this.updateExtensionFields();
        })
        .catch(() => {});
    }
  },
  beforeDestroy() {
    this.bpmnElement = null;
  }
};
</script>
