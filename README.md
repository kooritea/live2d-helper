# Live2d-helper

[![npm](https://img.shields.io/npm/v/live2d-helper.svg?style=flat)](https://www.npmjs.com/package/live2d-helper)

## Live2d-helper2.x.x 主体基本开发完成,现在还缺一些语音功能及一些人性化接口

## [Live2d-helper1.x.x](https://github.com/kooritea/live2d-helper/tree/master)基本完善,但只能加载 2.x 版本的 live2d 模型,其他版本的模型需要转换

> Live2d-helper2.x.x 主要为加载 3.x 版本的模型

Live2d-helper @2.x.x 基于官方 live2d.js 和(SDK4.0.0) 的、更加简单易用的 live2d-helper，通过简单的配置在网页上显示 live2d

不依赖任何其他框架,你只需要一个 canvas 元素和模型资源地址!就可以显示!

## 如何使用

### 下载 live2d-helper

```bash
npm install live2d-helper
```

### 准备 live2d 模型

基本上按照 demo 里面那样子放置资源即可  
live2d-helper @2.x.x 使用的是 3.x 版本的模型  
3.x 版本的模型的 model 一般的命名方式为 name_3.model3.json  
并且有一个`"version": 3`的字段
其他版本的模型可能不通用!

### 引入 live2d-helper

```html
<script src="./dist/index.js"></script>
<script>
  new Live2dHelper();
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

### 配置基本和 1.x.x 相同,完善之后再写

#### motionLoadMode

motion 加载方式

- 'lazy' 触发 motion 时进行加载(default),缺点是首次触发 motion 会有卡顿感
- 'greedy' 模型加载时立即加载所有 motion,加载完毕后再显示模型,缺点是 motion 多的时候显示模型加载时间较长
- 'textures_first' 贴图优先,优先显示模型,再加载所有 motion,缺点是加载 motion 时模型会因为 js 的限制卡住不动
