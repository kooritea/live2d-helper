# Live2d-helper

[![npm](https://img.shields.io/npm/v/live2d-helper.svg?style=flat)](https://www.npmjs.com/package/live2d-helper)

## Live2d-helper2.x.x主体基本开发完成,现在还缺一些语音功能及一些人性化接口 

## [Live2d-helper1.x.x](https://github.com/kooritea/live2d-helper/tree/master)基本完善,但只能加载2.x版本的live2d模型,其他版本的模型需要转换

> Live2d-helper2.x.x 主要为加载3.x版本的模型

Live2d-helper @2.x.x基于官方 live2d.js和(SDK4.0.0) 的、更加简单易用的 live2d-helper，通过简单的配置在网页上显示 live2d

不依赖任何其他框架,你只需要一个canvas元素和模型资源地址!就可以显示!

## 如何使用

### 下载 live2d-helper

```bash
npm install live2d-helper
```

### 准备 live2d 模型

基本上按照 demo 里面那样子放置资源即可  
这里内置的 live2d.js 使用的是`2.1`的版本模型  
其他版本的模型可能不通用!

### 引入 live2d-helper

```html
<script src="./dist/index.js"></script>
<script>
  new Live2dHelper()
</script>
```

or

```javascript
var Live2dHelper = require("live2d-helper");
```

or

```javascript
import Live2dHelper from "live2d-helper";
```

### 配置基本和1.x.x相同,完善之后再写