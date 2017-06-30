## 简介
- TQD：TQD69780【IM应用门户】-PBL后台二期优化
- 任务：配置日志组件（config logs）
- 需求：配置台修改前后对比及日志
- 工时：6 个工作日
- 兼容性：IE10+（含 IE10）

## 演示代码
```js
/**
 * 配置日志类
 */
class ConfigLogs {
  /**
   * 弹出框形式显示日志
   * @param {number} configAppID 配置应用 ID
   * @param {number} configID 配置 ID
   * @param {object} configFieldsMap 配置表单域名称字典
   */
  showLogs (configAppID, configID, configFieldsMap) {}

  /**
   * 保存日志
   * @param {number} configAppID 配置应用 ID
   * @param {number} configID 配置 ID
   * @param {string} diff 比对内容
   * @param {string} remark 备注
   * @return {Promise}
   */
  saveLog (configAppID, configID, diff, remark) {}

  /**
   * 显示配置修改前后差异
   * @param {object} oldData 原来的配置数据
   * @param {object} newData 修改后的配置数据
   */
  showDiff (oldData, newData) {}
}

const cl = new ConfigLogs()

cl.showLogs()
cl.saveLog()
cl.showDiff()
```

## 交互：
1. 在**保存**按钮旁边加一个**修改比对**按钮，点击触发`showDiff`；
2. 在**修改比对**按钮旁边加一个**查看修改日志**按钮，点击触发`showLogs`；
3. 点击**保存**按钮时，弹出提示框，要求填写**修改日志**，点击**确认**，触发`saveLog`，并保存配置。

## 问题
1. 是否需要显示配置表单字段名称（object 的 key）？
2. 兼容性要求：IE10+（含 IE10）？

## diff 算法
1. 以原配置数据为基准做比较；
2. 修改、删除、新增。

## 日志服务端
### 数据结构
```
LOG = {
  "id": "日志 ID",
  "config_app_id": "配置应用 ID", // 如：养成管理后台.任务配置.任务管理.修改任务
  "config_id": "配置 ID",         // 如：flower_c07775388d524fa0b92849ffe0187bda
  "user_id": "配置人员",          // 如：820514
  "diff": "比对内容",             // 如：[diff, diff]
  "remark": "备注"                // 如：修改任务名称
  "create_at": "配置时间",        // 如：2017-06-26T11:00:40.000+0800
}
```

#### diff 数据结构
```
{
  "type": "操作类型",    // 如：update、add、delete
  "key": "表单字段 key", // 如：task_name
  "old": "旧值",          
  "new": "新值"           
}
```

#### 场景
1.修改字段
> 修改了：任务名称，旧值为：日清，新值为：签到。
```
{
  "type": "update",  
  "key": "task_name",
  "old": "签到",          
  "new": "日清"    
}
```

2. 新增字段
> 新增了：任务名称，值为：签到。
```
{
  "type": "add",  
  "key": "task_name",
  "old": "",          
  "new": "日清"    
}
```

3. 删除字段
> 删除了字段：任务名称，旧值为：签到。
```
{
  "type": "delete"  
  "key": "task_name",
  "old": "签到",          
  "new": ""    
}
```

#### 接口
1. 保存日志
```
[POST] /v1.0/logs
REQUEST：
LOG（无需 id 字段）
```

2. 查询日志
```
[GET] /v1.0/logs?configAppID=1&configID=2[&$offset=0][&$limit=5]
RESPONSE：
{
  "error": null,
  "data": {
    "total": 123,
    "items": [
      LOG,
      LOG,
      ...
    ]
  }
}
```
