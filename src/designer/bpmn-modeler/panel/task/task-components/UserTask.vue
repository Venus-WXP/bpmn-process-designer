<template>
  <div style="margin-top: 16px">
    <el-form-item label="任务类型">
      <el-select v-model="userTaskForm.category" filterable clearable @change="updateElementTask('category')">
        <el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="处理用户">
      <el-select v-model="userTaskForm.assignee" filterable clearable @change="updateElementTask('assignee')">
        <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="候选用户">
      <el-select v-model="userTaskForm.candidateUsers" filterable clearable multiple collapse-tags @change="updateElementTask('candidateUsers')">
        <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="候选分组">
      <el-select v-model="userTaskForm.candidateGroups" filterable clearable multiple collapse-tags @change="updateElementTask('candidateGroups')">
        <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
      </el-select>
    </el-form-item>
    <el-form-item label="到期时间">
      <el-date-picker
        style="width: 100%"
        v-model="userTaskForm.dueDate"
        type="datetime"
        value-format="yyyy-MM-dd HH:mm:ss"
        clearable
        :editable="false"
        @change="updateElementTask('dueDate')"
      />
    </el-form-item>
    <el-form-item label="跟踪时间">
      <el-input v-model="userTaskForm.followUpDate" clearable @change="updateElementTask('followUpDate')" />
    </el-form-item>
    <el-form-item label="优先级">
      <el-input v-model="userTaskForm.priority" clearable @change="updateElementTask('priority')" />
    </el-form-item>
  </div>
</template>

<script>
let principalsData = null;

export default {
  name: "UserTask",
  props: {
    id: String,
    type: String
  },
  data() {
    return {
      defaultTaskForm: {
        category: "GLOBAL",
        assignee: "",
        candidateUsers: [],
        candidateGroups: [],
        dueDate: "",
        followUpDate: "",
        priority: ""
      },
      userTaskForm: {},
      categories: [
        {
          id: "GLOBAL",
          name: "全局任务"
        },
        {
          id: "DEPARTMENT",
          name: "部门任务"
        }
      ],
      users: [],
      groups: []
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
  created() {
    if (principalsData) {
      const copy = { ...principalsData };
      this.users = copy.users;
      this.groups = copy.groups;
    } else {
      this.$bus.$once("principalsData", data => {
        principalsData = { ...data };
        this.users = data.users;
        this.groups = data.groups;
      });
      this.$bus.$emit("produce", "principalsData");
    }
  },
  methods: {
    resetTaskForm() {
      for (let key in this.defaultTaskForm) {
        let value;
        if (key === "candidateUsers" || key === "candidateGroups") {
          value = this.bpmnElement?.businessObject[key] ? this.bpmnElement.businessObject[key].split(",") : [];
        } else {
          value = this.bpmnElement?.businessObject[key] || this.defaultTaskForm[key];
        }
        this.$set(this.userTaskForm, key, value);
      }
      if (!this.bpmnElement?.businessObject["category"]) {
        this.updateElementTask("category");
      }
    },
    updateElementTask(key) {
      const taskAttr = Object.create(null);
      if (key === "candidateUsers" || key === "candidateGroups") {
        taskAttr[key] = this.userTaskForm[key] && this.userTaskForm[key].length ? this.userTaskForm[key].join() : null;
      } else {
        taskAttr[key] = this.userTaskForm[key] || null;
      }
      window.bpmnInstances.modeling.updateProperties(this.bpmnElement, taskAttr);
    }
  },
  beforeDestroy() {
    this.bpmnElement = null;
  }
};
</script>
