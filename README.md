# 健康打卡平台 - 云端部署版

## 功能说明



* 数据持久化存储在飞书多维表格

* 多用户隔离：每个用户登录后只能看到自己的打卡数据

* 保留原有所有 UI、图表、主题切换功能



***

## 部署步骤（Cloudflare Pages 版，国内访问稳定）

### 第一步：创建飞书自建应用



1. 打开 [飞书开放平台](https://open.feishu.cn/app)，用你的飞书账号登录

2. 点击右上角「创建企业自建应用」

3. 填写：

* 应用名称：健康打卡后台

* 应用描述：随便填

1. 点击「创建」

2. 进入应用后，左侧菜单点「凭证与基础信息」

3. 复制两个关键值，先存好：

* **App ID**（`cli_` 开头）

* **App Secret**（点「显示」后复制）



***

### 第二步：给应用开通多维表格权限



1. 左侧菜单点「权限管理」

2. 搜索 `bitable:app`，开通「查看、评论、编辑和管理多维表格」

3. 搜索 `bitable:app:readonly`，也开通

4. 左侧菜单点「版本管理与发布」→「创建版本」

5. 版本号填 `1.0.0`，提交发布（个人版自动通过）



***

### 第三步：把应用添加到多维表格



1. 打开多维表格：

   [https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc](https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc)

2. 右上角「...」→「更多」→「添加应用」

3. 搜索「健康打卡后台」，添加，权限选「可编辑」



***

### 第四步：部署到 Cloudflare Pages

#### 4.1 注册 Cloudflare 账号



1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com)

2. 点「Sign Up」，用邮箱注册（或者直接用 GitHub 登录）

3. 验证邮箱后登录

#### 4.2 连接 GitHub 仓库



1. 左侧菜单点「Workers & Pages」

2. 点「Create application」→「Pages」标签

3. 选择「Connect to Git」

4. 第一次会让你授权 GitHub，选你那个 `health-tracker-cloud` 仓库，授权

5. 选中 `health-tracker-cloud` 仓库，点「Begin setup」

#### 4.3 项目配置



1. Project name：随便填，比如 `health-tracker`

2. Production branch：`main`

3. Framework preset：选「None」

4. Build command：**留空**（不需要构建）

5. Build output directory：填 `public`

6. 点「Save and Deploy」

#### 4.4 配置环境变量

部署第一次会失败，因为还没配环境变量。没关系，我们现在来配：



1. 部署完成后，进入项目，点顶部「Settings」→「Environment variables」

2. 点「Add variable」，依次添加下面 5 个：



| 变量名 (Key)         | 值 (Value)                     |
| ----------------- | ----------------------------- |
| `APP_ID`          | 第一步复制的 App ID                 |
| `APP_SECRET`      | 第一步复制的 App Secret             |
| `BASE_TOKEN`      | `PSafbNdZlawco6sGFlPc3hbUnEc` |
| `RECORD_TABLE_ID` | `tblOVs03uyGTXPfy`            |
| `USER_TABLE_ID`   | `tblBiXgaa3rnWuZ3`            |



1. Environment 选「Production」

2. 全部加完后，点顶部「Deployments」→ 最新那次部署右边的「Retry deployment」

#### 4.5 访问网站

等 1 分钟部署完成后，点「Visit」按钮就能打开你的打卡页面了。

域名格式类似：`https://health-tracker.pages.dev`



***

### 第五步：验证



1. 打开你的 Cloudflare 域名

2. 输入昵称和密码，点进入

3. 随便打个勾，去飞书多维表格刷新，应该能看到数据

4. 开无痕窗口换个昵称登录，应该看不到第一个人的数据



***

## 分享给朋友

部署完成后，把你的 `xxx.pages.dev` 链接发给朋友就行。

每个人输入自己的昵称密码（第一次自动注册），各自看各自的数据。



***

## 项目结构说明



```
health-tracker-cloud/

├── functions/

│   └── api/

│       └── \[...path].js    ← 后端接口（Cloudflare Functions）

├── public/

│   └── index.html           ← 前端打卡页面

└── package.json
```



***

## 数据说明

所有数据都存在你自己的飞书多维表格里：

[https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc](https://fcnxnjin8mjw.feishu.cn/base/PSafbNdZlawco6sGFlPc3hbUnEc)
