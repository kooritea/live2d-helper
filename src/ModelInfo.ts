import { CubismSDK } from "./CubismSDK/CubismSDK";
import { Setting } from "./Setting";

export class ModelInfo {

  private readonly _setting: Setting
  private readonly _cubismSDK: CubismSDK

  constructor(setting: Setting, cubismSDK: CubismSDK) {
    this._setting = setting
    this._cubismSDK = cubismSDK
  }

  get HitAreasList(){
    return this._cubismSDK._model.getDrawableIds()
  }

}