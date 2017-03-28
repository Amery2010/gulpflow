# gulpflow

适用于 gulp 的任务流，你可以很容易的用来构建项目开发环境。

The task flow for gulp, you can easily build a project development environment.

## 开始项目

1. 运行 `npm install` 以安装项目依赖；

2. 使用 `gulp start` 开始项目；

3. 使用 `gulp build` 打包项目;

3. 使用 `gulp staging` 压缩并打包项目文件;

4. 使用 `gulp production` 压缩并打包项目文件、上传静态文件至 CDN;

5. 使用 `gulp help` 可查看项目可用的 gulp 指令。

### 注意事项：

* 在开始项目前请确保已经安装全局的 gulp，安装方法如下: `npm install gulp -g`。

* 该项目是基于 `gulp` 搭建的，因此自身不带自启动服务器，需要使用 Nginx 或 IDE 来访问。

* 可依据情况修改目录下的 `config.js` 配置。

* 部分语法错误可能导致 gulp crash，需要重新使用 `npm start`。
