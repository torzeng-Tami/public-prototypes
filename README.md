# Public Prototypes · 公开产品原型

仅存放明确允许公开的原型，不包含私有项目、业务数据、内部截图或服务凭据。

## 产品规格书模板管理（2026-11-03 更新）

- 在线原型：https://torzeng-tami.github.io/public-prototypes/product-spec-config/
- 产品方案：https://torzeng-tami.github.io/public-prototypes/product-spec-config/product-plan.html
- 源码：`docs/product-spec-config/`。

规格书按名称维护，归属唯一一级品线。模板端可多选关联同一级下的二级品线；品线管理中可设置一级默认、二级多选关联和唯一主模板。新增 SPU 演示默认使用二级主模板，可选范围仅为该品线关联模板。

初始化以与现有老模板一致的规格书为一级默认，补齐缺失的二级关联和主模板；不覆盖已配置主模板，不在本次改写历史 SPU。示例数据虚构，真实模板核对、权限及生产迁移另行实施。

### 本地运行与验证

`python -m http.server 8080 --directory docs` 后打开 `http://localhost:8080/product-spec-config/`。

`npm test` 执行 44 项新旧模型兼容测试，无需安装运行依赖。

### 保存与兼容

仅使用当前浏览器、当前 origin 的 localStorage；不会自动提交 Git，不同用户的编辑结果不共享。新键为 starmerx-spec-template-studio-v2，旧键 starmerx-spec-field-studio-v1 保留，原字段差异转换成独立规格书。不同地址、端口或浏览器不互通。

页面为交互原型，不创建真实 SPU，不包含真实登录、后端鉴权或多人协作。请勿录入敏感资料。

GitHub Pages 从 main 的 /docs 发布。后续仅上传明确获准公开的文件。

## 浏览器批注修订

- 关联品线列改为“是否设为该品线主模板”：是／否。未勾选禁用，新勾选默认否；是会更新唯一主模板，现有主模板不能直接改否造成空缺。
- 字段标识不展示，内部继续保留，新增自动生成。
- 上传附件支持单个 .xls/.xlsx/.doc/.docx，最大 10 MB（10485760 bytes）。仅本地选择与格式／大小校验，不上传、不读取内容、不持久化文件。实际上传与服务端校验不在原型范围。

## 关联方式调整

新增规格书不再绑定一级品线。规格书页面不再关联品线。品线管理可以从全部规格书中设置一级默认模板和二级品线关联；新增二级品线继承一级默认规格书作为唯一主模板，也可以改选其他已关联规格书。主模板只能有一个。
