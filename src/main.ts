import { Setting } from "./Setting";
import { CubismSDK } from "./CubismSDK/CubismSDK";
import { ModelInfo } from "./ModelInfo";

export default class Live2dHelper {
  public setting: Setting;
  public cubismSDK: CubismSDK;

  public modelInfo: ModelInfo

  constructor(arg1: object | string, arg2?: string) {
    this.setting = new Setting();
    this.setting.init(arg1, arg2).then(() => {
      this.load();
    });

    this.setting.canvas["_Live2dHelper"] = this;
  }
  private load() {
    this.cubismSDK = new CubismSDK(this.setting);
    this.modelInfo = new ModelInfo(this.setting,this.cubismSDK)
  }
}
