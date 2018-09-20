function loadLive2d(data, data2) {
  let {canvasId, baseUrl, modelUrl, interval, width, height, layout, debug, idle, view, crossOrigin, initModelCallback, scaling, globalollowPointer, binding} = data
  if(typeof data === 'string'){
    canvasId = data
    baseUrl = data2
  }
  if(!canvasId || !baseUrl){
    return
  }
  let obj = {}
  obj.baseUrl = /\/$/.test(baseUrl)?baseUrl:baseUrl+'/'
  obj.modelUrl = modelUrl // model.json的路径
  obj.platform = window.navigator.platform.toLowerCase();

  // obj.live2DMgr = new LAppLive2DManager(); 只用来管理多个模型现在不需要

  obj.model = null /*new LAppModel();*/

  obj.isDrawStart = false;

  obj.gl = null;
  obj.canvas = null;

  obj.crossOrigin = crossOrigin
  obj.dragMgr = null; /*new L2DTargetPoint();*/
  obj.viewMatrix = null; /*new L2DViewMatrix();*/
  obj.projMatrix = null; /*new L2DMatrix44()*/
  obj.deviceToScreen = null; /*new L2DMatrix44();*/

  obj.drag = false;
  obj.oldLen = 0;
  obj.lastMouseX = 0;
  obj.lastMouseY = 0;
  obj.debug = debug || {
    DEBUG_LOG: false,
    DEBUG_MOUSE_LOG : false,
  }
  obj.binding = binding || {}
  obj.isModelShown = false;

  obj.initModelCallback = initModelCallback

  obj.interval = interval || 15000  // 自动播放间隔
  obj.idle = idle || 'idle'
  obj.layout = layout
  obj.globalollowPointer = typeof globalollowPointer === 'boolean'?globalollowPointer: false
  obj.scaling = typeof scaling === 'boolean'?scaling: false
  obj.audio = document.createElement("audio");
  obj.view = {
    VIEW_MAX_SCALE : 2,
    VIEW_MIN_SCALE : 0.8,
    VIEW_LOGICAL_LEFT : -1,
    VIEW_LOGICAL_RIGHT : 1,
    VIEW_LOGICAL_MAX_LEFT : -2,
    VIEW_LOGICAL_MAX_RIGHT : 2,
    VIEW_LOGICAL_MAX_BOTTOM : -2,
    VIEW_LOGICAL_MAX_TOP : 2
  }
  if(view){
    for(let key in obj.view){
      if(view[key]){
        obj.view[key] = view[key]
      }
    }
  }
  initL2dCanvas(obj,canvasId,width,height)
  initModel(obj)
  initLive2d(obj)
  return obj
}
function initLive2d (obj) {
  let width = obj.canvas.width;
  let height = obj.canvas.height;

  obj.dragMgr = new L2DTargetPoint(); // Live2dFramework.js


  let ratio = height / width;
  let left = obj.view.VIEW_LOGICAL_LEFT;
  let right = obj.view.VIEW_LOGICAL_RIGHT;
  let bottom = -ratio;
  let top = ratio;

  obj.viewMatrix = new L2DViewMatrix(); // Live2dFramework.js


  obj.viewMatrix.setScreenRect(left, right, bottom, top);


  obj.viewMatrix.setMaxScreenRect(obj.view.VIEW_LOGICAL_MAX_LEFT,
                                   obj.view.VIEW_LOGICAL_MAX_RIGHT,
                                   obj.view.VIEW_LOGICAL_MAX_BOTTOM,
                                   obj.view.VIEW_LOGICAL_MAX_TOP);

  obj.viewMatrix.setMaxScale(obj.view.VIEW_MAX_SCALE);
  obj.viewMatrix.setMinScale(obj.view.VIEW_MIN_SCALE);

  obj.projMatrix = new L2DMatrix44();
  obj.projMatrix.multScale(1, (width / height));


  obj.deviceToScreen = new L2DMatrix44();
  obj.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0);
  obj.deviceToScreen.multScale(2 / width, -2 / width);



  obj.gl = getWebGLContext(obj);
  if (!obj.gl) {
      l2dError("Failed to create WebGL context.");
      return;
  }

  Live2D.setGL(obj.gl);


  obj.gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // changeModel(obj);

  startDraw(obj);
}

function initL2dCanvas (obj, canvasId, width, height) {
  obj.canvas = document.getElementById(canvasId);
  obj.canvas.setAttribute('width',obj.canvas.getAttribute('width') || width || 500)
  obj.canvas.setAttribute('height',obj.canvas.getAttribute('height') || height || 500)
  if(obj.canvas.addEventListener) {
      if(obj.globalollowPointer){
        document.documentElement.addEventListener("mousemove", mouseEvent(obj), false);
      } else {
        obj.canvas.addEventListener("mousemove", mouseEvent(obj), false);
        obj.canvas.addEventListener("mouseout", mouseEvent(obj), false);
      }
      if(obj.scaling){
        obj.canvas.addEventListener("mousewheel", mouseEvent(obj), false);
      }
      obj.canvas.addEventListener("click", mouseEvent(obj), false);

      obj.canvas.addEventListener("mousedown", mouseEvent(obj), false);
      obj.canvas.addEventListener("mouseup", mouseEvent(obj), false);
      obj.canvas.addEventListener("contextmenu", mouseEvent(obj), false);


      obj.canvas.addEventListener("touchstart", touchEvent(obj), false);
      obj.canvas.addEventListener("touchend", touchEvent(obj), false);
      obj.canvas.addEventListener("touchmove", touchEvent(obj), false);

  }
}
function mouseEvent(obj)
{
  return function (e) {
    e.preventDefault();
    if (e.type == "mousewheel") {
        if (e.clientX < 0 || obj.canvas.clientWidth < e.clientX ||
        e.clientY < 0 || obj.canvas.clientHeight < e.clientY)
        {
            return;
        }
        if (e.wheelDelta > 0) modelScaling(obj,1.1);
        else modelScaling(obj,0.9);
    } else if (e.type == "mousedown") {
        modelTurnHead(obj,e);
    } else if (e.type == "mousemove") {
        followPointer(obj,e);
    } else if (e.type == "mouseup") {
        lookFront(obj);
    } else if (e.type == "mouseout") {
        lookFront(obj);
    }
  }
}
function touchEvent(obj)
{
  return function (e) {
    e.preventDefault();

    var touch = e.touches[0];

    if (e.type == "touchstart") {
        if (e.touches.length == 1) modelTurnHead(obj,touch);
    } else if (e.type == "touchmove") {
        followPointer(obj,touch);
        if (e.touches.length == 2) {
            var touch1 = e.touches[0];
            var touch2 = e.touches[1];
            var len = Math.pow(touch1.pageX - touch2.pageX, 2) + Math.pow(touch1.pageY - touch2.pageY, 2);
            if (thisRef.oldLen - len < 0) modelScaling(obj,1.025);
            else modelScaling(obj,0.975);

            thisRef.oldLen = len;
        }

    } else if (e.type == "touchend") {
        lookFront(obj);
    }
  }

}
function transformViewX(obj, deviceX)
{
    var screenX = obj.deviceToScreen.transformX(deviceX);
    return obj.viewMatrix.invertTransformX(screenX);
}


function transformViewY(obj, deviceY)
{
    var screenY = obj.deviceToScreen.transformY(deviceY);
    return obj.viewMatrix.invertTransformY(screenY);
}


function transformScreenX(obj, deviceX)
{
    return obj.deviceToScreen.transformX(deviceX);
}


function transformScreenY(obj, deviceY)
{
    return obj.deviceToScreen.transformY(deviceY);
}
function getWebGLContext(obj)
{
    let NAMES = [ "webgl" , "experimental-webgl" , "webkit-3d" , "moz-webgl"];

    for( let i = 0; i < NAMES.length; i++ ){
        try{
            let ctx = obj.canvas.getContext(NAMES[i], {premultipliedAlpha : true});
            if(ctx) return ctx;
        }
        catch(e){}
    }
    return null;
}

function followPointer(obj,event)
{
    var rect = event.target.getBoundingClientRect();

    var sx = transformScreenX(obj,event.clientX - rect.left);
    var sy = transformScreenY(obj,event.clientY - rect.top);
    var vx = transformViewX(obj,event.clientX - rect.left);
    var vy = transformViewY(obj,event.clientY - rect.top);

    if (obj.debug.DEBUG_MOUSE_LOG)
        console.log("onMouseMove device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");
    if (obj.drag || obj.globalollowPointer)
    {
        obj.lastMouseX = sx;
        obj.lastMouseY = sy;

        obj.dragMgr.setPoint(vx, vy);
    }
}

function lookFront(obj)
{
    if (obj.drag)
    {
        obj.drag = false;
    }

    obj.dragMgr.setPoint(0, 0);
}

function modelTurnHead(obj,event)
{
    obj.drag = true;

    var rect = event.target.getBoundingClientRect();

    var sx = transformScreenX(obj,event.clientX - rect.left);
    var sy = transformScreenY(obj,event.clientY - rect.top);
    var vx = transformViewX(obj,event.clientX - rect.left);
    var vy = transformViewY(obj,event.clientY - rect.top);
    if (obj.debug.DEBUG_MOUSE_LOG)
        console.log("onMouseDown device( x:" + event.clientX + " y:" + event.clientY + " ) view( x:" + vx + " y:" + vy + ")");

    obj.lastMouseX = sx;
    obj.lastMouseY = sy;
    obj.dragMgr.setPoint(vx, vy);

    // 遍历所有可点击区域
    if(obj.model.modelSetting.json.hit_areas){
      for (let item of obj.model.modelSetting.json.hit_areas) {
        if (obj.model.hitTest(item.name, vx, vy)) {
          if(obj.binding[item.name]){
            let motionName
            if(Array.isArray(obj.binding[item.name])){
              motionName = obj.binding[item.name][parseInt(Math.random() * obj.binding[item.name].length)]
            } else {
              motionName = obj.binding[item.name]
            }
            obj.model.startRandomMotion(motionName,2);
            if (obj.debug.DEBUG_LOG) {
              console.log('Click on the ' + item.name)
              console.log('Start motion: ' + motionName)
            }
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
      //   body_y: [0.3, -0.9]
      // }
      for (let name in obj.model.modelSetting.json.hit_areas_custom_data) {
        let item = obj.model.modelSetting.json.hit_areas_custom_data[name]
        if(item.x[0]<vx&&item.x[1]>vy&&item.y[0]>vx&&item.y[1]<vy){// 点击命中自定义区域
          if(obj.binding[name]){
            let motionName
            if(Array.isArray(obj.binding[name])){
              motionName = obj.binding[name][parseInt(Math.random() * obj.binding[name].length)]
            } else {
              motionName = obj.binding[name]
            }
            obj.model.startRandomMotion(motionName,2);
            if (obj.debug.DEBUG_LOG) {
              console.log('Click on the ' + name)
              console.log('Start motion: ' + motionName)
            }
          }
          break
        }
      }
    }
}


function modelScaling(obj,scale)
{
    var isMaxScale = obj.viewMatrix.isMaxScale();
    var isMinScale = obj.viewMatrix.isMinScale();

    obj.viewMatrix.adjustScale(0, 0, scale);


    if (!isMaxScale)
    {
        if (obj.viewMatrix.isMaxScale())
        {
            // obj.model.startRandomMotion();
            // 放到最大时的mation
            if (obj.debug.DEBUG_LOG)
                console.log('isMaxScale')
        }
    }

    if (!isMinScale)
    {
        if (obj.viewMatrix.isMinScale())
        {
            //obj.model.startRandomMotion(LAppDefine.MOTION_GROUP_PINCH_OUT,LAppDefine.PRIORITY_NORMAL);
            // 缩到最小时的mation
            if (obj.debug.DEBUG_LOG)
                console.log('isMinScale')
        }
    }
}

function startDraw(obj) {
    if(!obj.isDrawStart) {
        obj.isDrawStart = true;
        (function tick() {
                draw(obj);

                var requestAnimationFrame =
                    window.requestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.msRequestAnimationFrame;


                requestAnimationFrame(tick ,obj.canvas);   // 浏览器api 自定义重绘方法
        })();
    }
}

function draw(obj)
{
    // l2dLog("--> draw()");

    MatrixStack.reset();
    MatrixStack.loadIdentity();

    obj.dragMgr.update();
    // obj.live2DMgr.setDrag(obj.dragMgr.getX(), obj.dragMgr.getY());
    obj.model.setDrag(obj.dragMgr.getX(), obj.dragMgr.getY());
    obj.gl.clear(obj.gl.COLOR_BUFFER_BIT);

    MatrixStack.multMatrix(obj.projMatrix.getArray());
    MatrixStack.multMatrix(obj.viewMatrix.getArray());
    MatrixStack.push();

    let model = obj.model;
    if(model == null) return;

    if (model.initialized && !model.updating)
    {
        model.update();
        model.draw(obj.gl);
    }

    MatrixStack.pop();
}

function initModel(obj){
  obj.model = new LAppModel(obj);
  Live2D.init();
  Live2DFramework.setPlatformManager(new PlatformManager);
  obj.model.load(obj.gl, {
    modelSettingPath:obj.modelUrl?obj.modelUrl:obj.baseUrl+'model.json',
    modelHomeDir:obj.baseUrl
  },function(){
    initHit_areas_custom(obj)
    obj.initModelCallback()
  });
}

function initHit_areas_custom(obj){
  if(obj.model.modelSetting.json.hit_areas_custom) {
      // 自定义点击区域
      // hit_areas_custom
      // 初始化
      obj.model.modelSetting.json.hit_areas_custom_data = {}
      for (let name in obj.model.modelSetting.json.hit_areas_custom) {
        let info = name.match(/(.*)?_(x|y)$/)
        if(!obj.model.modelSetting.json.hit_areas_custom_data[info[1]]){
          obj.model.modelSetting.json.hit_areas_custom_data[info[1]] = {}
        }
        obj.model.modelSetting.json.hit_areas_custom_data[info[1]][info[2]] = obj.model.modelSetting.json.hit_areas_custom[name]
      }
    }
}
