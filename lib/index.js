function loadLive2d(data, data2) {
  return new live2dHelper(data, data2)
}

function live2dHelper(data, data2) {
  let { canvas, baseUrl, model, imageUrl, soundUrl, interval, width, height, layout, debug, idle, view, initModelCallback, scaling, globalFollowPointer, binding, autoLoadAudio, allowSound } = data
  if (typeof data === 'string' || data instanceof HTMLElement) {
    canvas = data
    baseUrl = data2
  }
  if (!canvas || !baseUrl) {
    console.error('Not Found canvas or baseUrl')
    return
  }
  this.lid = (new Date()).valueOf()
  this.baseUrl = /\/$/.test(baseUrl) ? baseUrl : baseUrl + '/'
  this.imageUrl = imageUrl ? imageUrl : this.baseUrl // 图片资源的路径
  this.imageUrl = /\/$/.test(this.imageUrl) ? this.imageUrl : this.imageUrl + '/'
  this.soundUrl = soundUrl ? soundUrl : this.baseUrl // 音频资源的路径
  this.soundUrl = /\/$/.test(this.soundUrl) ? this.soundUrl : this.soundUrl + '/'


  if(typeof model === 'object'){
    this.modelUrl = ""
    this.modelJson = model
  }else{
    this.modelUrl = model && typeof model === 'string' ? model : this.baseUrl + 'model.json' // model.json的路径
  }



  this.platform = window.navigator.platform.toLowerCase();

  // obj.live2DMgr = new LAppLive2DManager(); 只用来管理多个模型现在不需要

  this.model = null /*new LAppModel();*/

  this.isDrawStart = false;
  this.isDelete = false // 当为true时会打断requestAnimationFrame不在更新模型

  this.gl = null;
  this.canvas = canvas instanceof HTMLElement ? canvas : document.getElementById(canvas)

  this.dragMgr = null; /*new L2DTargetPoint();*/
  this.viewMatrix = null; /*new L2DViewMatrix();*/
  this.projMatrix = null; /*new L2DMatrix44()*/
  this.deviceToScreen = null; /*new L2DMatrix44();*/

  this.drag = false;
  this.oldLen = 0;
  this.lastMouseX = 0;
  this.lastMouseY = 0;
  this.debug = debug || {
    DEBUG_LOG: false,
    DEBUG_MOUSE_LOG: false,
  }
  this.binding = binding || {}
  this.isModelShown = false;

  this.initModelCallback = initModelCallback

  this.interval = interval || 15000  // 自动播放间隔
  this.idle = idle || 'idle'
  this.layout = layout
  this.globalFollowPointer = typeof globalFollowPointer === 'boolean' ? globalFollowPointer : false
  this.scaling = typeof scaling === 'boolean' ? scaling : false
  this.autoLoadAudio = autoLoadAudio
  this.allowSound = typeof allowSound === 'boolean' ? allowSound : true
  this.audio = document.createElement("audio");
  this.audioCache = {}
  this.view = {
    VIEW_MAX_SCALE: 2,
    VIEW_MIN_SCALE: 0.8,
    VIEW_LOGICAL_LEFT: -1,
    VIEW_LOGICAL_RIGHT: 1,
    VIEW_LOGICAL_MAX_LEFT: -2,
    VIEW_LOGICAL_MAX_RIGHT: 2,
    VIEW_LOGICAL_MAX_BOTTOM: -2,
    VIEW_LOGICAL_MAX_TOP: 2
  }
  // this.startRandomMotion = startRandomMotion
  // this.startMotion = startMotion
  if (view) {
    for (let key in this.view) {
      if (view[key]) {
        this.view[key] = view[key]
      }
    }
  }
  this.clear()
  this.initL2dCanvas(width, height)
  this.initModel()
  this.initLive2d()
  this.canvas.live2d = this
}

live2dHelper.prototype.initLive2d = function () {
  let width = this.canvas.width;
  let height = this.canvas.height;

  this.dragMgr = new L2DTargetPoint(); // Live2dFramework.js


  let ratio = height / width;
  let left = this.view.VIEW_LOGICAL_LEFT;
  let right = this.view.VIEW_LOGICAL_RIGHT;
  let bottom = -ratio;
  let top = ratio;

  this.viewMatrix = new L2DViewMatrix(); // Live2dFramework.js


  this.viewMatrix.setScreenRect(left, right, bottom, top);


  this.viewMatrix.setMaxScreenRect(this.view.VIEW_LOGICAL_MAX_LEFT,
    this.view.VIEW_LOGICAL_MAX_RIGHT,
    this.view.VIEW_LOGICAL_MAX_BOTTOM,
    this.view.VIEW_LOGICAL_MAX_TOP);

  this.viewMatrix.setMaxScale(this.view.VIEW_MAX_SCALE);
  this.viewMatrix.setMinScale(this.view.VIEW_MIN_SCALE);

  this.projMatrix = new L2DMatrix44();
  this.projMatrix.multScale(1, (width / height));


  this.deviceToScreen = new L2DMatrix44();
  this.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0);
  this.deviceToScreen.multScale(2 / width, -2 / width);



  this.gl = this.getWebGLContext();
  if (!this.gl) {
    l2dError("Failed to create WebGL context.");
    return;
  }

  Live2D.setGL(this.gl);


  this.gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // changeModel(obj);

  this.startDraw();
}

live2dHelper.prototype.throttle = function (handle, wait) {
  let lastTime = 0;
  return function (e) {
    let nowTime = new Date().getTime()
    if (nowTime - lastTime > wait) {
      handle(e);
      lastTime = nowTime;
    }
  }

}

live2dHelper.prototype.initL2dCanvas = function (width, height) {
  this.canvas.setAttribute('width', this.canvas.getAttribute('width') || width || 500)
  this.canvas.setAttribute('height', this.canvas.getAttribute('height') || height || 500)
  this.mouseEventHandle = this.mouseEvent.bind(this)
  this.touchEventHandle = this.touchEvent.bind(this)
  this.gfpEventHandle = this.throttle(function (e) {
    self.mouseEvent(e)
  }, 50)
  var self = this
  if (this.canvas.addEventListener) {
    if (this.globalFollowPointer) {
      document.documentElement.addEventListener("mousemove", this.gfpEventHandle , false);
    } else {
      this.canvas.addEventListener("mousemove", this.mouseEventHandle, false);
      this.canvas.addEventListener("mouseout", this.mouseEventHandle, false);
    }
    if (this.scaling) {
      this.canvas.addEventListener("mousewheel", this.mouseEventHandle, false);
    }
    this.canvas.addEventListener("click", this.mouseEventHandle, false);
    this.canvas.addEventListener("mousedown", this.mouseEventHandle, false);
    this.canvas.addEventListener("mouseup", this.mouseEventHandle, false);
    this.canvas.addEventListener("contextmenu", this.mouseEventHandle, false);


    this.canvas.addEventListener("touchstart", this.touchEventHandle, false);
    this.canvas.addEventListener("touchend", this.touchEventHandle, false);
    this.canvas.addEventListener("touchmove", this.touchEventHandle, false);
  }
}
live2dHelper.prototype.mouseEvent = function (e) {
  e.preventDefault();
  if (e.type == "mousewheel") {
    if (e.clientX < 0 || this.canvas.clientWidth < e.clientX ||
      e.clientY < 0 || this.canvas.clientHeight < e.clientY) {
      return;
    }
    if (e.wheelDelta > 0) this.modelScaling(1.1);
    else this.modelScaling(0.9);
  } else if (e.type == "mousedown") {
    this.modelTurnHead(e);
  } else if (e.type == "mousemove") {
    this.followPointer(e);
  } else if (e.type == "mouseup") {
    this.lookFront();
  } else if (e.type == "mouseout") {
    this.lookFront();
  }
}
live2dHelper.prototype.touchEvent = function (e) {
  e.preventDefault();

  var touch = e.touches[0];

  if (e.type == "touchstart") {
    if (e.touches.length == 1) this.modelTurnHead(touch);
  } else if (e.type == "touchmove") {
    this.followPointer(touch);
    if (e.touches.length == 2) {
      var touch1 = e.touches[0];
      var touch2 = e.touches[1];
      var len = Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2);
      if (thisRef.oldLen - len < 0) this.modelScaling(1.025);
      else this.modelScaling(0.975);

      thisRef.oldLen = len;
    }

  } else if (e.type == "touchend") {
    this.lookFront();
  }
}
live2dHelper.prototype.transformViewX = function (deviceX) {
  var screenX = this.deviceToScreen.transformX(deviceX);
  return this.viewMatrix.invertTransformX(screenX);
}


live2dHelper.prototype.transformViewY = function (deviceY) {
  var screenY = this.deviceToScreen.transformY(deviceY);
  return this.viewMatrix.invertTransformY(screenY);
}


live2dHelper.prototype.transformScreenX = function (deviceX) {
  return this.deviceToScreen.transformX(deviceX);
}


live2dHelper.prototype.transformScreenY = function (deviceY) {
  return this.deviceToScreen.transformY(deviceY);
}
live2dHelper.prototype.getWebGLContext = function () {
  let NAMES = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];

  for (let i = 0; i < NAMES.length; i++) {
    try {
      let ctx = this.canvas.getContext(NAMES[i], { premultipliedAlpha: true });
      if (ctx) return ctx;
    }
    catch (e) { }
  }
  return null;
}

live2dHelper.prototype.followPointer = function (event) {
  var rect = event.target.getBoundingClientRect();

  var sx = this.transformScreenX(event.clientX - rect.left);
  var sy = this.transformScreenY(event.clientY - rect.top);
  var vx = this.transformViewX(event.clientX - rect.left);
  var vy = this.transformViewY(event.clientY - rect.top);

  if (this.debug.DEBUG_MOUSE_LOG)
    console.log("onMouseMove device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");
  if (this.drag || this.globalFollowPointer) {
    this.lastMouseX = sx;
    this.lastMouseY = sy;

    this.dragMgr.setPoint(vx, vy);
  }
}

live2dHelper.prototype.lookFront = function () {
  if (this.drag) {
    this.drag = false;
  }

  this.dragMgr.setPoint(0, 0);
}

live2dHelper.prototype.modelTurnHead = function (event) {
  this.drag = true;
  var rect = event.target.getBoundingClientRect();

  var sx = this.transformScreenX(event.clientX - rect.left);
  var sy = this.transformScreenY(event.clientY - rect.top);
  var vx = this.transformViewX(event.clientX - rect.left);
  var vy = this.transformViewY(event.clientY - rect.top);
  if (this.debug.DEBUG_MOUSE_LOG)
    console.log("onMouseDown device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");

  this.lastMouseX = sx;
  this.lastMouseY = sy;
  this.dragMgr.setPoint(vx, vy);

  // 遍历所有可点击区域
  if (this.model.modelSetting.json.hit_areas) {
    for (let item of this.model.modelSetting.json.hit_areas) {
      if (this.model.hitTest(item.name, vx, vy)) {
        if (this.debug.DEBUG_LOG) {
          console.log('Click on the ' + item.name)
        }
        if (this.binding[item.name]) {
          let motionName = this.binding[item.name].motion[parseInt(Math.random() * this.binding[item.name].motion.length)]
          this.model.startRandomMotion(motionName, 2, item.name, this.binding[item.name].callback);
        }
        break
      }
    }
  } else {
    // 自定义点击区域判定
    // hit_areas_custom:{
    //   head_x: [-0.35, 0.6],
    //   head_y: [0.19, -0.2],
    //   body_x: [-0.3, -0.25],
    //   body_y: [0.3, -0.9],
    //   binding
    // }
    for (let name in this.model.modelSetting.json.hit_areas_custom_data) {
      let item = this.model.modelSetting.json.hit_areas_custom_data[name]
      if (item.x[0] < vx && item.x[1] > vy && item.y[0] > vx && item.y[1] < vy) {// 点击命中自定义区域

        if (this.binding[name]) {
          let motionName = this.binding[name].motion[parseInt(Math.random() * this.binding[name].motion.length)]
          this.model.startRandomMotion(motionName, 2, name, this.binding[name].callback);
        }
        break
      }
    }
  }
}


live2dHelper.prototype.modelScaling = function (scale) {
  var isMaxScale = this.viewMatrix.isMaxScale();
  var isMinScale = this.viewMatrix.isMinScale();

  this.viewMatrix.adjustScale(0, 0, scale);


  if (!isMaxScale) {
    if (this.viewMatrix.isMaxScale()) {
      // obj.model.startRandomMotion();
      // 放到最大时的motion
      if (this.debug.DEBUG_LOG)
        console.log('isMaxScale')
    }
  }

  if (!isMinScale) {
    if (this.viewMatrix.isMinScale()) {
      //obj.model.startRandomMotion(LAppDefine.MOTION_GROUP_PINCH_OUT,LAppDefine.PRIORITY_NORMAL);
      // 缩到最小时的motion
      if (this.debug.DEBUG_LOG)
        console.log('isMinScale')
    }
  }
}
live2dHelper.prototype.startDraw = function () {
  var self = this
  if (!this.isDrawStart) {
    this.isDrawStart = true;
    var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;
    (function tick() {
      if(!self.isDelete){
        self.draw();
        self.requestID = requestAnimationFrame(tick, self.canvas);   // 浏览器api 自定义重绘方法
      }
    })();
  }
}

live2dHelper.prototype.draw = function () {
  // l2dLog("--> draw()");

  MatrixStack.reset();
  MatrixStack.loadIdentity();

  this.dragMgr.update();
  // obj.live2DMgr.setDrag(obj.dragMgr.getX(), obj.dragMgr.getY());
  this.model.setDrag(this.dragMgr.getX(), this.dragMgr.getY());
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  MatrixStack.multMatrix(this.projMatrix.getArray());
  MatrixStack.multMatrix(this.viewMatrix.getArray());
  MatrixStack.push();

  let model = this.model;
  if (model == null) return;

  if (model.initialized && !model.updating) {
    model.update();
    model.draw(this.gl);
  }

  MatrixStack.pop();
}

live2dHelper.prototype.initModel = function () {
  var self = this
  this.model = new LAppModel(this);
  Live2D.init();
  Live2DFramework.setPlatformManager(new PlatformManager);
  this.model.load(this.gl, {
    modelSetting: this.modelJson,
    modelSettingPath: this.modelUrl,
    modelHomeDir: this.baseUrl
  }, function () {
    self.initHit_areas_custom()
    self.initBinding()
    self.loadAudio()
    if (typeof self.initModelCallback == 'function') {
      self.initModelCallback(self)
    }
  });
}

live2dHelper.prototype.initHit_areas_custom = function () {
  if (this.model.modelSetting.json.hit_areas_custom) {
    // 自定义点击区域
    // hit_areas_custom
    // 初始化
    this.model.modelSetting.json.hit_areas_custom_data = {}
    for (let name in this.model.modelSetting.json.hit_areas_custom) {
      if (name === 'binding') continue
      let info = name.match(/(.*)?_(x|y)$/)
      if (!this.model.modelSetting.json.hit_areas_custom_data[info[1]]) {
        this.model.modelSetting.json.hit_areas_custom_data[info[1]] = {}
      }
      this.model.modelSetting.json.hit_areas_custom_data[info[1]][info[2]] = this.model.modelSetting.json.hit_areas_custom[name]
    }
  }
}
live2dHelper.prototype.initBinding = function () {



  // 把配置中的binding转换成标准格式
  for(let name in this.binding){
    let motion = []
    let callback = function({hitArea,motionPath,motionName,priority}) {}
    if(typeof this.binding[name] === 'string'){
      motion.push(this.binding[name])
    } else if(Array.isArray(this.binding[name])){
      motion.push(...this.binding[name])
    } else if(typeof this.binding[name] === 'function'){
      callback = this.binding[name]
    } else if(typeof this.binding[name] === 'object'){
      motion.push(...this.binding[name].motion)
      if(typeof this.binding[name].callback === 'function'){
        callback = this.binding[name].callback
      }
    }
    this.binding[name] = {
      motion,
      callback
    }
  }


  // 合并model和配置中的binding对象
  let json = this.model.modelSetting.json
  if(typeof json.hit_areas === 'object'){
    let jsonBinding = JSON.parse(JSON.stringify(json.hit_areas))
    for(let item of jsonBinding){
      let motion = []
      if(item.motion){
        if(typeof item.motion === 'string'){
          motion.push(item.motion)
        }else if(Array.isArray(item.motion)){
          motion.push(...item.motion)
        }
      }
      if(this.binding[item.name]){
        motion.forEach((name)=>{
          if(!this.binding[item.name].motion.includes(name)){
            this.binding[item.name].motion.push(name)
          }
        })
      }else{
        this.binding[item.name] = {
          motion,
          callback: function({hitArea,motionPath,motionName,priority}) {}
        }
      }
    }
  } else if(typeof json.hit_areas_custom === 'object'){
    let jsonBinding = JSON.parse(JSON.stringify(json.hit_areas_custom.binding))
    for(let area in jsonBinding){
      let motion = []
      if(typeof jsonBinding[area] === 'string'){
        motion.push(jsonBinding[area])
      }else if(Array.isArray(jsonBinding[area])){
        motion.push(...jsonBinding[area])
      }
      if(this.binding[area]){
        motion.forEach((name)=>{
          if(!this.binding[area].motion.includes(name)){
            this.binding[area].motion.push(name)
          }
        })
      }else{
        this.binding[area] = {
          motion,
          callback: function({hitArea,motionPath,motionName,priority}) {}
        }
      }
    }
  }
}
live2dHelper.prototype.startRandomMotion = function (motionName, priority) {
  this.model.startRandomMotion(motionName, priority)
}
live2dHelper.prototype.startMotion = function (motionName, no, priority) {
  this.model.startMotion(motionName, no, priority)
}
live2dHelper.prototype.clearTexture = function (obj) {
  obj = obj?obj:this
  obj.model.release(obj.gl)
  clearTimeout(obj.model.startRandomMotionTimer)
  obj.model.startRandomMotionTimer = null
  obj.audio.pause()
}
live2dHelper.prototype.clear = function(){
  if (this.canvas.live2d){
    let oldObj = this.canvas.live2d
    oldObj.isDelete = true
    oldObj.clearTexture(oldObj)
    setTimeout(()=>{
      let cancelAnimationFrame =window.cancelAnimationFrame ||window.mozCancelAnimationFrame;
      cancelAnimationFrame(oldObj.requestID);
    })
    document.documentElement.removeEventListener("mousemove", oldObj.gfpEventHandle);
    oldObj.canvas.removeEventListener("mousemove", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("mouseout", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("mousewheel", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("click", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("mousedown", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("mouseup", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("contextmenu", oldObj.mouseEventHandle);
    oldObj.canvas.removeEventListener("touchstart", oldObj.touchEventHandle);
    oldObj.canvas.removeEventListener("touchend", oldObj.touchEventHandle);
    oldObj.canvas.removeEventListener("touchmove", oldObj.touchEventHandle);
  }
}
live2dHelper.prototype.loadAudio = function () {
  var self = this
  if (this.autoLoadAudio !== false) {
    let motions = this.model.modelSetting.json.motions
    let sounds = []
    for (let motionName in motions) {
      for (let item of motions[motionName]) {
        if (item.sound) {
          if (Array.isArray(item.sound)) {
            item.sound.forEach((sound) => {
              if (!sounds.includes(sound)) {
                sounds.push(sound)
              }
            })
          } else {
            if (!sounds.includes(item.sound)) {
              sounds.push(item.sound)
            }
          }
        }
      }
    }
    let getAudioBlob = (url, callback) => {
      let xhr = new XMLHttpRequest();
      xhr.open('get', url);
      xhr.responseType = 'blob';
      xhr.onload = function () {
        callback(this.response);
      }
      xhr.send();
    }
    let i = 0
    let load = function () {
      if (i >= sounds.length) {
        if (typeof self.autoLoadAudio == "function") self.autoLoadAudio();
        return
      }
      getAudioBlob(self.soundUrl + sounds[i], (data) => {
        self.audioCache[sounds[i]] = data
        i++;
        load()
      })
    }
    load()
  }
}
