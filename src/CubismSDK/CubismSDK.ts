import {
  Live2DCubismFramework as live2dcubismframework,
  Option as Csm_Option
} from "../Framework/live2dcubismframework";
import { Live2DCubismFramework as cubismmatrix44 } from "../Framework/math/cubismmatrix44";
import Csm_CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import Csm_CubismFramework = live2dcubismframework.CubismFramework;

import { Logger } from "../Logger";
import { Setting } from "../Setting";
import { TextureManager } from "./TextureManager";
import { Webgl } from "./Webgl";
import { View } from "./View";
import { Model } from "./Model";
import { TouchManager } from "./TouchManager";

export class CubismSDK {
  _cubismOption: Csm_Option = new Csm_Option();
  _view: View;
  _webgl: Webgl;
  _textureManager: TextureManager;
  _model: Model;
  _touchManage: TouchManager;
  constructor(setting: Setting) {
    this._webgl = new Webgl(setting.canvas);
    this._view = new View(this._webgl);
    this._textureManager = new TextureManager(this._webgl);
    this._cubismOption.logFunction = Logger.log;
    this._cubismOption.loggingLevel = 0;
    Csm_CubismFramework.startUp(this._cubismOption);
    Csm_CubismFramework.initialize();
    let projection: Csm_CubismMatrix44 = new Csm_CubismMatrix44();
    this._model = new Model(setting, this._textureManager, this._webgl);
    this._touchManage = new TouchManager(setting, this._view, this._model);
    this.loop();
  }
  private loop(): void {
    this._model.updateTime();
    this._webgl.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this._webgl.gl.enable(this._webgl.gl.DEPTH_TEST);
    this._webgl.gl.depthFunc(this._webgl.gl.LEQUAL);
    this._webgl.gl.clear(
      this._webgl.gl.COLOR_BUFFER_BIT | this._webgl.gl.DEPTH_BUFFER_BIT
    );

    this._webgl.gl.clearDepth(1.0);
    this._webgl.gl.enable(this._webgl.gl.BLEND);
    this._webgl.gl.blendFunc(
      this._webgl.gl.SRC_ALPHA,
      this._webgl.gl.ONE_MINUS_SRC_ALPHA
    );
    this._view.render();
    this._model.onUpdate();
    requestAnimationFrame(() => {
      this.loop();
    });
  }
}
