# Live2d-helper

[![npm](https://img.shields.io/npm/v/live2d-helper.svg?style=flat)](https://www.npmjs.com/package/live2d-helper)

基于官方 live2d.js(2.1) 的、更加简单易用的 live2d-helper，通过简单的配置在网页上显示 live2d(waifu)

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
```

or

```javascript
var loadLive2d = require("live2d-helper");
```

or

```javascript
import loadLive2d from "live2d-helper";
```

### 简单版

```html
<canvas id="canvasId" width="300" height="300"></canvas>
<script>
  loadLive2d("canvasId", "baseUrl");
  // baseUrl即所有Live2d的资源原始路径  默认model.json路径为baseUrl/model.json
</script>
```

### 详细设置

html

```html
<canvas id="live2d"></canvas>
```

javascript

```javascript
// 除了canvas和baseUrl选项都是选填
loadLive2d({
  canvas: "live2d", // canvas的id亦可以是canvas的dom元素
  baseUrl: "./model/kaguya", // 资源原始路径
  model: "./model/kaguya/model.json", // 可以直接填写网络路径,也可以直接传入model对象
  imageUrl: "./model/kaguya", // 图片资源的根路径，最后获取资源的实际路径是这个路径加上model.json中定义的相对路径，不填该项则默认是baseUrl
  soundUrl: "./model/kaguya", // 音频资源的根路径，最后获取资源的实际路径是这个路径加上model.json中定义的相对路径，不填该项则默认是baseUrl
  allowSound: true, // 是否允许播放音频，如果有的话 def：true
  interval: 30000, // 自动mation的开始时间点到下一个mation的开始点之间的间隔,有语音的话从语音播放结束开始计算
  idle: "idle", // 自动触发的mation
  width: "800", // html上的width属性优先级更高
  height: "800", // html上的height属性优先级更高
  globalFollowPointer: false, // 老婆焦点跟随鼠标 def:false
  scaling: true, // 是否允许使用滚轮放大缩小 def:false
  debug: {
    DEBUG_LOG: false,
    DEBUG_MOUSE_LOG: false
  },
  layout: {
    // 布局设置 这个优先级最高，然后到model.json(字段正确的话)，再到默认
    width: "",
    height: "",
    x: "",
    y: "",
    center_x: "",
    center_y: "",
    top: "",
    bottom: "",
    left: "",
    right: ""
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
  binding: {// 详细配置方法在下一点
    // 需要自行根据不同模型的model.json将mation绑定到对应的hit_areas 支持hit_areas_custom
    head: "flick_head",
    face: "tap_face",
    breast: ["tap_breast", "shake"],
    belly: "tap_belly",
    leg: function() {
      console.log("hentai!");
    }
  },
  autoLoadAudio: function() {
    console.log("audio loaded");
  }, // 自动下载音频 def：true,设置为false时不自动加载音频,设置为false将不会播放音频
  initModelCallback(waifu) {
    console.log(waifu);
    console.log("加载完毕");
  }
});
```

## 点击区域绑定模型动作和回调函数

### 想要模型有点击反馈,这步一定要做!

1、在模型初始化的时候传入 binding 字段绑定

```javascript
loadLive2d({
  "...": "...",
  binding: {// 其中head等点击区域可以在model.json的hit_areas或者hit_areas_custom中找到
    head: {
      motion: ["flick_head", "shake"],
      callback: function({
        hitArea, // 点击区域,例如`head`
        motionPath,// 即将播放的motion地址,例如`motions/xxx.mtn`
        motionName,// 即将播放的motion名称,例如`shake`或者`flick_head`
        priority// 优先级,见附表
      }) {
        console.log(hitArea,motionPath,motionName,priority);
        return false // 如果return false 则不会做任何动作,此次点击将被取消
      }
    },
    face: "tap_face",
    breast: ["tap_breast", "shake"],
    belly: "tap_belly",
    leg: function() {
      console.log("hentai!");
    }
  },
  "...": "..."
});
```

2、直接修改 model.json 绑定
该方法不能绑定回调函数

```json
// model.json
{
  "...": "...",
  "hit_areas": [
    { "name": "head", "id": "D_CORE.HEAD", "motion": "flick_head" },
    { "name": "face", "id": "D_CORE.FACE", "motion": "tap_face" },
    {
      "name": "breast",
      "id": "D_CORE.BREAST",
      "motion": ["tap_breast", "shake"]
    },
    { "name": "belly", "id": "D_CORE.BELLY", "motion": "tap_belly" },
    { "name": "leg", "id": "D_CORE.LEG", "motion": "tap_leg" }
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
      "head": "thanking",
      "body": ["tap_body", "thanking"]
    }
  },
  "...": "..."
}
```

注意：

model.json和配置中的绑定会合并

### 进阶

loadLive2d 和 initModelCallback 将会返回一个对象，该对象包含了官方 demo 所有的属性和方法

为了方便,startRandomMotion 和 startMotion 都可以通过该对象直接使用

```javascript
var waifu = loadLive2d("canvasId", "baseUrl");

waifu.startRandomMotion((mationName: string), (priority: number));
// 随机进行mationName下的一个mation,优先级为priority

waifu.startMotion((mationName: string), (no: number), (priority: number));
// 进行mationName下第no个mation,优先级为priority
```

|    官方名称     | 优先级 |     备注      |
| :-------------: | :----: | :-----------: |
|  PRIORITY_NONE  |   0    |   无权执行    |
|  PRIORITY_IDLE  |   1    | 可被 2,3 打断 |
| PRIORITY_NORMAL |   2    | 只能被 3 打断 |
| PRIORITY_FORCE  |   3    | 只能被 3 打断 |
