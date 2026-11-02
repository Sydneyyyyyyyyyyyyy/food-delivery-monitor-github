# 上传 GitHub 并开启在线展示

本项目已生成根目录 `index.html`，可用 GitHub Pages 展示，不需要安装服务器。

## 1. 创建仓库

登录 GitHub，点击右上角「+」→「New repository」。建议名称为 `food-delivery-monitor`。选择 Public；仓库描述可写：

> 外卖平台指标监测仪｜CSV 导入、月度经营小结、需求与用户分析、数据质量检查

如果你使用 GitHub Free，GitHub Pages 需要公开仓库。这个包已自带 README，可以先初始化 README，上传时用本包的 README 替换它。

## 2. 上传文件

先解压作品包。进入仓库，选择「Add file」→「Upload files」。上传解压文件夹里面的文件和子目录，不要只上传 ZIP。

最关键的是：在仓库首页必须直接看到 `index.html` 和 `README.md`；不要多套一层 `food-delivery-monitor-github/` 文件夹。上传时同时保留 `src/`、`data/`、`scripts/` 和 `tests/` 的层级。

检查文件列表，填写提交说明，例如「Add food delivery monitoring dashboard」，按页面提示提交到默认分支；若提示创建分支和 Pull Request，完成合并后再发布。

## 3. 开启 Pages

在仓库进入「Settings」→「Pages」，在 Build and deployment 中设置：

- Source：`Deploy from a branch`
- Branch：`main`（若仓库默认分支不同，选实际分支）
- Folder：`/ (root)`

点击 Save，等页面显示已发布地址。若暂未显示，可到 Actions 查看部署状态，然后回 Pages 点击 Visit site。

项目站点地址通常为 `https://你的用户名.github.io/food-delivery-monitor/`。这是格式示例，不是已经生成的真实网址。

## 4. 检查公开作品

打开在线地址，依次检查：载入合成演示、切换月份、切换分析板块、小时累计/日均切换、CSV 模板下载与数据质量展开。确认演示数据标识可见。

在仓库首页 About 设置中，把上线网址填进 Website。可以将该仓库置顶在个人主页，便于招聘者发现。简历可写「在线演示 + GitHub 源码」，重点说明你的指标定义、口径校验、变化拆解与业务边界。

## 后续更新

修改 `src/` 后先执行 `python scripts/build.py`，再上传更新后的源码和根目录 `index.html`。仅改源码但未重新生成入口文件时，线上页面不会体现改动。发布分支有更新时，Pages 会重新部署。

## 常见情况

- **404：**检查根目录文件名是小写 `index.html`，Pages 选对分支和 `/ (root)`，部署已成功。
- **只有下载链接，没有网页：**你可能只上传了 ZIP，需解压后上传内部文件。
- **页面还是旧版本：**确认重新生成并上传了 `index.html`，检查 Actions 部署是否结束，再刷新网页。
- **看见真实订单：**本包只包含合成订单；不要把另一本地 HTML（已内嵌原始 CSV 的版本）替换进来，除非你明确准备公开其数据。

官方说明：

- [创建 GitHub Pages 网站](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [通过网页上传文件](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
