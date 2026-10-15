# 健康打卡平台 - 云端部署版

## 功能说明



* 数据持久化存储在飞书多维表格

* 多用户隔离：每个用户登录后只能看到自己的打卡数据

* 保留原有所有 UI、图表、主题切换功能



***

## 部署步骤（约 10 分钟）

### 第一步：创建飞书自建应用



1. 打开 [飞书开放平台](https://open.feishu.cn/app)，登录你的飞书账号

2. 点击「创建企业自建应用」

3. 填写应用名称：健康打卡后台，描述随便填，创建

4. 进入应用后，在「凭证与基础信息」页面，复制两个值：

* **App ID**（cli\_ 开头）

* **App Secret**

### 第二步：给应用授权多维表格权限



1. 在应用左侧菜单，找到「权限管理」

2. 搜索并开通以下权限：

* `bitable:app`（多维表格全部权限）

* 或者只开这两个更细的：


  * `bitable:app:readonly`（读）

  * `bitable:app`（写）

1. 点击「发布版本」→ 创建版本 → 申请发布（个人版会自动通过）

### 第三步：把应用添加到多维表格



1. 打开你刚才创建的多维表格：[https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc](https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc)

2. 点击右上角「...」→「更多」→「添加应用」

3. 搜索你刚才创建的「健康打卡后台」应用，添加进去

4. 确保权限是「可编辑」

### 第四步：部署到 Vercel



1. 把整个 `health-tracker-cloud` 文件夹上传到 GitHub 新建一个仓库

* 或者直接去 [vercel.com](https://vercel.com) 用 GitHub 登录，然后 Import 你的仓库

1. Vercel 会自动识别项目，不需要改配置

2. 在 Vercel 项目设置里，找到「环境变量」，添加以下 5 个：



| 变量名               | 值                           |
| ----------------- | --------------------------- |
| APP\_ID           | 第一步复制的 App ID               |
| APP\_SECRET       | 第一步复制的 App Secret           |
| BASE\_TOKEN       | PSafbNdZlawco6sGFlPc3hbUnEc |
| RECORD\_TABLE\_ID | tblOVs03uyGTXPfy            |
| USER\_TABLE\_ID   | tblBiXgaa3rnWuZ3            |



1. 点击「Deploy」，等 1-2 分钟部署完成

2. 部署成功后，你会得到一个域名，比如 `https://health-tracker-xxx.vercel.app`

### 第五步：验证



1. 打开你的 Vercel 域名

2. 输入昵称和密码，点击进入

3. 打个勾试试，然后去飞书多维表格里看，应该能看到对应的数据

4. 换一个浏览器（或者无痕窗口），用另一个昵称密码登录，应该看不到第一个人的数据



***

## 分享给朋友

部署完成后，把你的 Vercel 链接发给朋友就行。

每个人打开后输入自己的昵称和密码（第一次用自动注册），各自看各自的数据。



***

## 数据说明

所有数据都存在你自己的飞书多维表格里，你可以随时在飞书里查看、导出、修改。

多维表格地址：[https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc](https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc)