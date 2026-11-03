# Public Prototypes · 公开产品原型

仅存放已明确允许公开的产品原型与方案，不包含私有项目、业务数据或服务凭据。

## 产品规格书配置

- 可编辑交互源码：`docs/product-spec-config/`
- 产品方案：`docs/product-spec-config/product-plan.html`
- 支持模板继承、字段编辑、版本管理、发布演示与前端联动预览。
- 仅为本地前端模拟，不包含生产登录、服务端权限或实际业务发布。
- 保存只作用于当前浏览器、当前站点的 localStorage；不同用户不会共享修改。
- 本仓库是本次授权原型的公开副本，不含本地工作台中的其他业务原型。

## 本地运行

无需安装前端依赖：

```sh
python -m http.server 8080 --directory docs
```

浏览器打开 `http://localhost:8080/product-spec-config/`。

## 模型测试

使用 Node.js：

```sh
node --test tests/model.test.cjs
```

## 发布

GitHub Pages 从默认分支的 `/docs` 目录发布。后续修改公开内容前，应确认不含私有资料或密钥。仅提交当前允许公开的项目文件，不上传整个本地工作区。
