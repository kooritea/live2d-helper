# Live2d-helper

基于官方live2d.js的、更加简单易用的live2d-helper，通过简单的配置在网页上显示live2d(waifu)

## 如何使用

### 引入 live2d-helper

1、
```bash
npm install live2d-helper
```
2、
```html
<script src="./dist/index.js"></script>
```

 or

```javascript
var loadLive2d = require('live2d-helper')
```

or

```javascript
import loadLive2d from 'loadLive2d'
```
### 简单版

html

```html

<canvas id="canvasId" width="300" height="300" class="live2d"></canvas>

```
javascript

```javascript
loadLive2d('canvasId', 'baseUrl')
// baseUrl即所有Live2d的资源原始路径  默认model.jsoon路径为baseUrl/model.jsoon
```

### 详细设置

html

```html

<canvas id="canvasId" width="800" height="800" class="live2d"></canvas>

```
javascript

```javascript
var kaguya = {
  canvasId:'live2d',
  baseUrl: './model/kaguya',
  modelUrl: './model/kaguya/model.json',
  crossOrigin: false, // 是否允许跨域获取数据(前提是http header中已有允许的跨域字段) def:false
  interval: 15000, // 自动mation的开始时间点到下一个mation的开始点之间的间隔
  idle: 'idle', // 自动触发的mation
  width: "800", // html上的width属性优先级更高
  height: "800",// html上的height属性优先级更高
  globalollowPointer: false, // 全局跟随鼠标 def:false
  scaling: true, // 允许滚轮放大缩小 def:false
  debug: {
    DEBUG_LOG: false,
    DEBUG_MOUSE_LOG : false,
  },
  layout: { // 布局设置 这个优先级最高，然后到model.json(字段正确的话)，再到默认
    width: '',
    height: '',
    x: '',
    y: '',
    center_x: '',
    center_y: '',
    top: '',
    bottom: '',
    left: '',
    right: ''
  },
  view: {
    VIEW_MAX_SCALE: 2, // 最大缩放比例
    VIEW_MIN_SCALE: 0.8,// 最小缩放比例
    VIEW_LOGICAL_LEFT: -1,
    VIEW_LOGICAL_RIGHT: 1,
    VIEW_LOGICAL_MAX_LEFT: -2,
    VIEW_LOGICAL_MAX_RIGHT: 2,
    VIEW_LOGICAL_MAX_BOTTOM: -2,
    VIEW_LOGICAL_MAX_TOP: 2
  },
  binding:{
    head: 'flick_head',
    face: 'tap_face',
    breast: ['tap_breast','shake'],
    belly: 'tap_belly',
    leg: 'tap_leg'
  },
  initModelCallback(){
    console.log('模型加载完毕')
  }
}

loadLive2d('canvasId', 'baseUrl')
```
