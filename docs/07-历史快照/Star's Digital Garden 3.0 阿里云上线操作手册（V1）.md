# Star's Digital Garden 3.0 阿里云上线操作手册（V1）

## 第一阶段：购买服务器

### Step1：登录阿里云

进入：

[https://www.aliyun.com](https://www.aliyun.com/)

登录自己的账号。

------

### Step2：购买 ECS 云服务器

搜索：

ECS

点击：

云服务器 ECS

------

推荐配置：

系统：

Ubuntu 24.04 LTS

配置：

2核4G

硬盘：

80GB ESSD

带宽：

5Mbps

地区：

华东2（上海）
或
华南1（深圳）

都可以。

------

预算参考：

新人活动：

99~300元/年

优先买包年。

不要按量付费。

------

购买后记录：

公网IP

例如：

47.xxx.xxx.xxx

后面要一直使用。

------

## 第二阶段：连接服务器

### Windows 推荐工具

PuTTY

或者

FinalShell

推荐：

FinalShell

下载：

[https://www.hostbuf.com](https://www.hostbuf.com/)

------

安装完成后：

新建连接

主机：

你的公网IP

用户名：

root

密码：

购买服务器时设置的密码

------

连接成功后会看到：

root@i-xxxxx:~#

说明进入服务器成功。

------

## 第三阶段：安装宝塔面板

执行：

```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

输入：

y

回车

等待安装。

时间：

5~15分钟。

------

安装完成后会看到：

外网面板地址

用户名

密码

例如：

[http://47.xxx.xxx.xxx:8888](http://47.xxx.xxx.xxx:8888/)

username: xxxxx

password: xxxxx

保存好。

------

浏览器访问：

[http://你的IP:8888](http://xn--ip-0p3cm89l:8888/)

登录宝塔。

------

## 第四阶段：安装运行环境

登录宝塔后。

左侧：

软件商店

安装：

Nginx

Node.js

PM2管理器

MySQL（可不装）

Redis（可不装）

------

重点：

Node.js

选择：

22 LTS

安装。

------

## 第五阶段：上传项目

方式一：

Git

方式二：

压缩包上传

推荐 Git。

------

服务器执行：

```bash
mkdir -p /www/wwwroot
cd /www/wwwroot

git clone 你的仓库地址 garden
```

进入：

```bash
cd garden
```

------

检查：

package.json

是否存在。

------

## 第六阶段：上传资源库

你的项目约11GB。

其中：

resource/

不能放仓库。

------

服务器创建：

```bash
mkdir -p /data/resource
```

------

上传：

resource/

到：

```bash
/data/resource
```

------

后续代码引用：

统一读取：

```bash
/data/resource
```

------

## 第七阶段：环境变量

项目根目录：

创建：

```bash
.env.production
```

内容示例：

DATABASE_URL="file:./prisma/dev.db"

GARDEN_USERNAME="admin"

GARDEN_PASSWORD="你的密码"

DEEPSEEK_API_KEY="sk-xxxxxxxx"

DEEPSEEK_BASE_URL="[https://api.deepseek.com](https://api.deepseek.com/)"

NODE_ENV="production"

PORT=3000

------

保存。

```
---

## 第八阶段：安装依赖

进入项目：

```bash
cd /www/wwwroot/garden
```

执行：

```bash
npm install
```

第一次：

3~10分钟。

------

生成 Prisma：

```bash
npx prisma generate
```

------

构建：

```bash
npm run build
```

------

看到：

Compiled successfully

即可。

------

## 第九阶段：启动项目

推荐 PM2。

安装：

```bash
npm install -g pm2
```

启动：

```bash
pm2 start npm --name garden -- start
```

查看：

```bash
pm2 list
```

出现：

online

表示成功。

------

保存开机启动：

```bash
pm2 save

pm2 startup
```

复制提示命令执行一次。

------

## 第十阶段：配置域名

购买域名。

例如：

starsgarden.cn

------

阿里云：

域名

解析

添加：

A记录

主机记录：

@

记录值：

服务器公网IP

------

等待解析。

一般：

5分钟~2小时。

------

## 第十一阶段：Nginx反向代理

宝塔：

网站

添加站点

域名：

starsgarden.cn

------

反向代理：

目标：

[http://127.0.0.1:3000](http://127.0.0.1:3000/)

------

保存。

------

访问：

[https://你的域名](https://xn--6qqv7i2xdt95b/)

即可进入花园。

------

## 第十二阶段：备案

国内服务器必须备案。

阿里云控制台：

备案

按照流程提交。

------

准备：

身份证

手机号

人脸识别

------

时间：

7~14天。

------

备案通过后正式开放。

------

## 项目更新流程

本地开发：

git commit

git push

------

服务器：

```bash
cd /www/wwwroot/garden

git pull

npm install

npm run build

pm2 restart garden
```

即可完成更新。

------

## Git 安全规范（必须执行）

每次开发新功能：

先创建分支：

```bash
git checkout -b feature/xxx
```

开发完成：

```bash
git add .

git commit -m "feat: xxx"
```

推送：

```bash
git push
```

确认稳定后：

再合并主分支。

------

禁止：

连续开发数天不提交。

禁止：

大改后不做 commit。

禁止：

直接在 master 上实验。