import { Logger } from "./Logger";
import { Utils } from "./Utils";

export class Setting {
  public canvas: HTMLCanvasElement;
  public baseUrl: string;
  public model: any = "";
  public modelBuffer: ArrayBuffer;
  public imageUrl: string = "";
  public soundUrl: string = "";
  public interval: number = 15000;
  public width: number = 300;
  public height: number = 300;
  public layout: {
    width: number;
    height: number;
    x: number;
    y: number;
    center_x: number;
    center_y: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
  } = {
    width: null,
    height: null,
    x: null,
    y: null,
    center_x: null,
    center_y: null,
    top: null,
    bottom: null,
    left: null,
    right: null
  };
  public debug: boolean
  public idle: string = "idle";
  public view: {
    VIEW_MAX_SCALE: number; // 最大缩放比例
    VIEW_MIN_SCALE: number; // 最小缩放比例
    VIEW_LOGICAL_LEFT: number;
    VIEW_LOGICAL_RIGHT: number;
    VIEW_LOGICAL_MAX_LEFT: number;
    VIEW_LOGICAL_MAX_RIGHT: number;
    VIEW_LOGICAL_MAX_BOTTOM: number;
    VIEW_LOGICAL_MAX_TOP: number;
  } = {
    VIEW_MAX_SCALE: 2,
    VIEW_MIN_SCALE: 0.8,
    VIEW_LOGICAL_LEFT: -1.0,
    VIEW_LOGICAL_RIGHT: 1.0,
    VIEW_LOGICAL_MAX_LEFT: -2.0,
    VIEW_LOGICAL_MAX_RIGHT: 2.0,
    VIEW_LOGICAL_MAX_BOTTOM: -2.0,
    VIEW_LOGICAL_MAX_TOP: 2.0
  };
  public initModelCallback: (live2dHelper) => void = live2dHelper => {};
  public scaling: boolean = false;
  public globalFollowPointer: boolean = false;
  public binding: {
    [propName: string]: {
      motion: Array<string>;
      callback: (options: {
        hitArea: string;
        motionPath: string;
        motionName: string;
        priority: number;
      }) => void;
    };
  } = {};
  public autoLoadAudio: {
    canLoad: boolean;
    callback: () => void;
  } = {
    canLoad: true,
    callback: () => {}
  };
  public allowSound: boolean = true;
  public readonly Priority = {
    None: 0,
    Idle: 1,
    Normal: 2,
    Force: 3
  };

  public async init(arg1: any, arg2?: string) {
    let _binding;
    if (
      (typeof arg1 === "string" || arg1 instanceof HTMLCanvasElement) &&
      typeof arg2 === "string"
    ) {
      this.baseUrl = /\/$/.test(arg2) ? arg2 : arg2 + "/";
      if (typeof arg1 === "string") {
        this.canvas = document.querySelector(arg1);
        if (!this.canvas) {
          Logger.error("Not Found HTMLCanvasElement");
          throw new Error("Not Found HTMLCanvasElement");
        }
      } else {
        this.canvas = arg1;
      }
    } else {
      let {
        canvas,
        baseUrl,
        model,
        imageUrl,
        soundUrl,
        interval,
        width,
        height,
        layout,
        debug,
        idle,
        view,
        initModelCallback,
        scaling,
        globalFollowPointer,
        binding,
        autoLoadAudio,
        allowSound
      } = arg1;

      this.canvas =
        canvas instanceof HTMLElement ? canvas : document.querySelector(canvas);
      this.baseUrl = /\/$/.test(baseUrl) ? baseUrl : baseUrl + "/";
      this.imageUrl = imageUrl ? imageUrl : this.baseUrl; // 图片资源的路径
      this.imageUrl = /\/$/.test(this.imageUrl)
        ? this.imageUrl
        : this.imageUrl + "/";
      this.soundUrl = soundUrl ? soundUrl : this.baseUrl; // 音频资源的路径
      this.soundUrl = /\/$/.test(this.soundUrl)
        ? this.soundUrl
        : this.soundUrl + "/";
      this.interval = interval || 15000;
      this.width = isNaN(Number(width)) ? 800 : Number(width);
      this.height = isNaN(Number(height)) ? 800 : Number(height);
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.layout = layout;
      this.debug = debug || this.debug;
      this.idle = idle;
      if (view) {
        for (let key in this.view) {
          if (view[key]) {
            this.view[key] = view[key];
          }
        }
      }
      this.initModelCallback =
        typeof initModelCallback === "function"
          ? initModelCallback
          : live2dHelper => {};
      this.scaling = typeof scaling === "boolean" ? scaling : false;
      this.globalFollowPointer =
        typeof globalFollowPointer === "boolean" ? globalFollowPointer : false;
      if (typeof autoLoadAudio === "function") {
        this.autoLoadAudio = {
          canLoad: true,
          callback: autoLoadAudio
        };
      } else if (typeof autoLoadAudio === "boolean") {
        this.autoLoadAudio = {
          canLoad: autoLoadAudio,
          callback: () => {}
        };
      }
      this.model = model;
      _binding = binding;
      this.allowSound = typeof allowSound === "boolean" ? allowSound : true;
    }
    if (this.model === undefined || typeof this.model === "string") {
      this.model = this.model ? this.model : `${this.baseUrl}model.json`;
      this.modelBuffer = await Utils.getArraybuffer(this.model);
      this.model = JSON.parse(Utils.arrayBuffer2String(this.modelBuffer));
    } else {
      this.model = this.model;
    }
    this.initBind(_binding || {});

    if (!this.canvas || !this.baseUrl) {
      Logger.error("Not Found HTMLCanvasElement OR baseUrl");
      throw new Error("Not Found HTMLCanvasElement OR baseUrl");
    }
  }

  private initBind(binding: object) {
    for (let id in binding) {
      let motion = [];
      let callback = function({ hitArea, motionPath, motionName, priority }) {};
      if (typeof binding[id] === "string") {
        motion.push(binding[id]);
      } else if (Array.isArray(binding[id])) {
        motion.push(...binding[id]);
      } else if (typeof binding[id] === "function") {
        callback = binding[id];
      } else if (typeof binding[id] === "object") {
        if (Array.isArray(binding[id].motion)) {
          motion.push(...binding[id].motion);
        } else {
          motion.push(binding[id].motion);
        }
        if (typeof binding[id].callback === "function") {
          callback = binding[id].callback;
        }
      }
      this.binding[name] = {
        motion,
        callback
      };
    }
    // 合并model和配置中的binding对象
    if (this.model.HitAreas) {
      let jsonBinding = JSON.parse(JSON.stringify(this.model.HitAreas));
      for (let item of jsonBinding) {
        let motion = [];
        if (item.Motion) {
          if (typeof item.Motion === "string") {
            motion.push(item.Motion);
          } else if (Array.isArray(item.Motion)) {
            motion.push(...item.Motion);
          }
        }
        if (this.binding[item.Id]) {
          motion.forEach(name => {
            if (!this.binding[item.Id].motion.includes(name)) {
              this.binding[item.Id].motion.push(name);
            }
          });
        } else {
          this.binding[item.Id] = {
            motion,
            callback: function({ hitArea, motionPath, motionName, priority }) {}
          };
        }
      }
    } else {
      Logger.warn("Not Found HitAreas In model.json");
    }
  }
}
