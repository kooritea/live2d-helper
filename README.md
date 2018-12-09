# Live2d-helper

[![npm](https://img.shields.io/npm/v/live2d-helper.svg?style=flat)](https://www.npmjs.com/package/live2d-helper)

基于官方live2d.js的、更加简单易用的live2d-helper，通过简单的配置在网页上显示live2d(waifu)

## 如何使用

### 下载 live2d-helper

```bash
npm install live2d-helper
```
### 引入 live2d-helper
```html
<script src="./dist/index.js"></script>
```
 or
```javascript
var loadLive2d = require('live2d-helper')
```
or
```javascript
import loadLive2d from 'live2d-helper'
```
### 简单版

```html
<canvas id="canvasId" width="300" height="300"></canvas>
<script>
  loadLive2d('canvasId', 'baseUrl')
  // baseUrl即所有Live2d的资源原始路径  默认model.json路径为baseUrl/model.json
</script>
```

### 详细设置

html

```html
<canvas id="canvasId"></canvas>
```
javascript

```javascript
loadLive2d({
  canvasId:'live2d', // canvas的id
  baseUrl: './model/kaguya', // 资源原始路径
  modelUrl: './model/kaguya/model.json', // 自定义model.json路径 方便用于一键换装
  crossOrigin: false, // 是否允许跨域获取数据(前提是http header中已有允许的跨域字段) def:false
  interval: 15000, // 自动mation的开始时间点到下一个mation的开始点之间的间隔
  idle: 'idle', // 自动触发的mation
  width: "800", // html上的width属性优先级更高
  height: "800",// html上的height属性优先级更高
  globalollowPointer: false, // 焦点跟随鼠标 def:false
  scaling: true, // 是否允许使用滚轮放大缩小 def:false
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
    VIEW_MIN_SCALE: 0.8, // 最小缩放比例
    VIEW_LOGICAL_LEFT: -1,
    VIEW_LOGICAL_RIGHT: 1,
    VIEW_LOGICAL_MAX_LEFT: -2,
    VIEW_LOGICAL_MAX_RIGHT: 2,
    VIEW_LOGICAL_MAX_BOTTOM: -2,
    VIEW_LOGICAL_MAX_TOP: 2
  },
  binding:{ // 需要自行根据不同模型的model.json将mation绑定到对应的hit_areas 支持hit_areas_custom
    head: 'flick_head',
    face: 'tap_face',
    breast: ['tap_breast','shake'],
    belly: 'tap_belly',
    leg: function(){console.log('hentai!')}
  },
  autoLoadAudio:function(){console.log('audio loaded')}, // 自动下载音频 def：true
  initModelCallback(waifu){
    console.log(waifu)
    console.log('加载完毕')
  }
})
```

## 点击区域绑定模型动作和回调函数
1、在模型初始化的时候传入binding字段绑定

```javascript
loadLive2d({
  "...": "...",
  binding:{
    head: {motion:['flick_head','shake'],callback:function(hitArea,motionName,name){console.log(hitArea);console.log(motionName);console.log(name)}},
    face: 'tap_face',
    breast: ['tap_breast','shake'],
    belly: 'tap_belly',
    leg: function(){console.log('hentai!')}
  },
  "...": "...",
})
```

2、直接修改model.json绑定
该方法不能绑定回调函数
```json
// model.json
{
  "...": "...",
  "hit_areas":
	[
		{"name":"head", "id":"D_CORE.HEAD", "motion": "flick_head"},
		{"name":"face", "id":"D_CORE.FACE", "motion": "tap_face"},
		{"name":"breast", "id":"D_CORE.BREAST", "motion": ["tap_breast","shake"]},
		{"name":"belly", "id":"D_CORE.BELLY", "motion": "tap_belly"},
		{"name":"leg", "id":"D_CORE.LEG", "motion": "tap_leg"}
	],
  "...": "..."
}
```
```json
// model.json
{
  "...": "...",
  "hit_areas_custom": {
		"head_x": [-0.35, 0.6],
		"head_y": [0.19, -0.2],
		"body_x": [-0.3, -0.25],
		"body_y": [0.3, -0.9],
    "binding": {
      "head": ["thanking"],
      "body": {
        "motion": ["tap_body","thanking"]
      }
    }
	},
  "...": "..."
}
```


注意：

  model.json中的motion优先级更高


### 进阶

loadLive2d和initModelCallback 将会返回一个对象，该对象包含了官方demo所有的属性和方法

为了方便,startRandomMotion和startMotion都可以通过该对象直接使用

```javascript
var waifu = loadLive2d('canvasId', 'baseUrl')

waifu.startRandomMotion(mationName:string, priority:number)
// 随机进行mationName下的一个mation,优先级为priority

waifu.startMotion(mationName:string, no:number, priority:number)
// 进行mationName下第no个mation,优先级为priority


```

|  官方名称  |  优先级  |        备注     |
| :------: | :------: | :------------: |
| PRIORITY_NONE | 0 |  无权执行   |
| PRIORITY_IDLE | 1 | 可被2,3打断          |
| PRIORITY_NORMAL | 2 | 只能被3打断          |
| PRIORITY_FORCE | 3 | 只能被3打断          |
