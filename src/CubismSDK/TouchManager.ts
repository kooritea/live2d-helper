import { Live2DCubismFramework as cubismMatrix44 } from "../Framework/math/cubismmatrix44";
import { Live2DCubismFramework as cubismviewmatrix } from "../Framework/math/cubismviewmatrix";

import Csm_CubismViewMatrix = cubismviewmatrix.CubismViewMatrix;
import Csm_CubismMatrix44 = cubismMatrix44.CubismMatrix44;

import { Setting } from "../Setting";
import { View } from "./View";
import { Model } from "./Model";
import { Logger } from "../Logger";
import { Utils } from "../Utils";

export class TouchManager {
  _setting: Setting;
  _view: View;
  _captured: boolean = false;
  _coordinateManager: CoordinateManager = new CoordinateManager();
  _deviceToScreen: Csm_CubismMatrix44 = new Csm_CubismMatrix44();
  _viewMatrix: Csm_CubismViewMatrix = new Csm_CubismViewMatrix();
  _model: Model;
  constructor(setting: Setting, view: View, model: Model) {
    this._setting = setting;
    this._view = view;
    this._model = model;
    let width: number, height: number;
    width = setting.canvas.width;
    height = setting.canvas.height;

    let ratio: number = height / width;
    let left: number = setting.view.VIEW_LOGICAL_LEFT;
    let right: number = setting.view.VIEW_LOGICAL_RIGHT;
    let bottom: number = -ratio;
    let top: number = ratio;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // デバイスに対応する画面の範囲。 Xの左端、Xの右端、Yの下端、Yの上端

    let screenW: number = Math.abs(left - right);
    this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 表示範囲の設定
    this._viewMatrix.setMaxScale(setting.view.VIEW_MAX_SCALE); // 限界拡張率
    this._viewMatrix.setMinScale(setting.view.VIEW_MIN_SCALE); // 限界縮小率

    // 表示できる最大範囲
    this._viewMatrix.setMaxScreenRect(
      setting.view.VIEW_LOGICAL_MAX_LEFT,
      setting.view.VIEW_LOGICAL_MAX_RIGHT,
      setting.view.VIEW_LOGICAL_MAX_BOTTOM,
      setting.view.VIEW_LOGICAL_MAX_TOP
    );

    this.bindEvent();
  }
  bindEvent() {
    let supportTouch: boolean = "ontouchend" in this._setting.canvas;
    if (supportTouch) {
      this._setting.canvas.ontouchstart = e => {
        this.onTouchBegan(e);
      };
      this._setting.canvas.ontouchmove = e => {
        this.onTouchMoved(e);
      };
      this._setting.canvas.ontouchend = e => {
        this.onTouchEnded(e);
      };
      this._setting.canvas.ontouchcancel = e => {
        this.onTouchCancel(e);
      };
    } else {
      this._setting.canvas.onmousedown = e => {
        this.onClickBegan(e);
      };
      this._setting.canvas.onmousemove = e => {
        this.onMouseMoved(e);
      };
      this._setting.canvas.onmouseup = e => {
        this.onClickEnded(e);
      };
    }
  }
  onClickBegan(e: MouseEvent): void {
    this._captured = true;

    let posX: number = e.pageX;
    let posY: number = e.pageY;

    this.onTouchesBegan(posX, posY);
  }
  onMouseMoved(e: MouseEvent): void {
    if (!this._captured) {
      return;
    }
    let rect = (<Element>e.target).getBoundingClientRect();
    let posX: number = e.clientX - rect.left;
    let posY: number = e.clientY - rect.top;
    this.onTouchesMoved(posX, posY);
  }
  onClickEnded(e: MouseEvent): void {
    this._captured = false;
    let rect = (<Element>e.target).getBoundingClientRect();
    let posX: number = e.clientX - rect.left;
    let posY: number = e.clientY - rect.top;

    this.onTouchesEnded(posX, posY);
  }
  onTouchBegan(e: TouchEvent): void {
    this._captured = true;

    let posX = e.changedTouches[0].pageX;
    let posY = e.changedTouches[0].pageY;

    this.onTouchesBegan(posX, posY);
  }
  onTouchMoved(e: TouchEvent): void {
    if (!this._captured) {
      return;
    }

    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    this.onTouchesMoved(posX, posY);
  }
  onTouchEnded(e: TouchEvent): void {
    this._captured = false;

    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    this.onTouchesEnded(posX, posY);
  }
  onTouchCancel(e: TouchEvent): void {
    this._captured = false;
    let rect = (<Element>e.target).getBoundingClientRect();

    let posX = e.changedTouches[0].clientX - rect.left;
    let posY = e.changedTouches[0].clientY - rect.top;

    this.onTouchesEnded(posX, posY);
  }

  /**
   * タッチされた時に呼ばれる。
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
  private onTouchesBegan(pointX: number, pointY: number): void {
    this._coordinateManager.touchesBegan(pointX, pointY);
  }

  /**
   * タッチしているときにポインタが動いたら呼ばれる。
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
  private onTouchesMoved(pointX: number, pointY: number): void {
    let viewX: number = this.transformViewX(this._coordinateManager.getX());
    let viewY: number = this.transformViewY(this._coordinateManager.getY());

    this._coordinateManager.touchesMoved(pointX, pointY);
    this._model.setDragging(viewX, viewY);
  }

  /**
   * タッチが終了したら呼ばれる。
   *
   * @param pointX スクリーンX座標
   * @param pointY スクリーンY座標
   */
  private onTouchesEnded(pointX: number, pointY: number): void {
    this._model.setDragging(0.0, 0.0);
    // シングルタップ
    let x: number = this._deviceToScreen.transformX(
      this._coordinateManager.getX()
    ); // 論理座標変換した座標を取得。
    let y: number = this._deviceToScreen.transformY(
      this._coordinateManager.getY()
    ); // 論理座標変化した座標を取得。

    this.onTap(x, y);
  }

  /**
   * X座標をView座標に変換する。
   *
   * @param deviceX デバイスX座標
   */
  private transformViewX(deviceX: number): number {
    let screenX: number = this._deviceToScreen.transformX(deviceX); // 論理座標変換した座標を取得。
    return this._viewMatrix.invertTransformX(screenX); // 拡大、縮小、移動後の値。
  }

  /**
   * Y座標をView座標に変換する。
   *
   * @param deviceY デバイスY座標
   */
  private transformViewY(deviceY: number): number {
    let screenY: number = this._deviceToScreen.transformY(deviceY); // 論理座標変換した座標を取得。
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * X座標をScreen座標に変換する。
   * @param deviceX デバイスX座標
   */
  private transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * Y座標をScreen座標に変換する。
   *
   * @param deviceY デバイスY座標
   */
  private transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  /**
   * 点击区域可以通过binding绑定多个motion group,每个motion group里面可以包含多个动作
   * @param x
   * @param y
   */
  public onTap(x: number, y: number): void {
    Logger.log(`onTap x: ${x} y: ${y}`, true);
    let hitList = this._model.getHitList(x, y)
    for(let drawId of hitList){
      if(this._setting.debug){
        Logger.log(`Hit drawId : ${drawId.id}`, true);
      }
      if(this._setting.binding[drawId.id]){
        this._model.startRandomMotion(
          Utils.getRandomItem(this._setting.binding[drawId.id].motion),
          2
        );
        return
      }else{
        if(this._setting.debug){
          Logger.log(`Hit drawId ${drawId.id} not found binding`, true);
        }
      }
    }
  }
}

class CoordinateManager {
  /**
   * コンストラクタ
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * タッチ開始時イベント
   * @param deviceX タッチした画面のxの値
   * @param deviceY タッチした画面のyの値
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * ドラッグ時のイベント
   * @param deviceX タッチした画面のxの値
   * @param deviceY タッチした画面のyの値
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * フリックの距離測定
   * @return フリック距離
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * 点１から点２への距離を求める
   *
   * @param x1 １つ目のタッチした画面のxの値
   * @param y1 １つ目のタッチした画面のyの値
   * @param x2 ２つ目のタッチした画面のxの値
   * @param y2 ２つ目のタッチした画面のyの値
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * ２つ目の値から、移動量を求める。
   * 違う方向の場合は移動量０。同じ方向の場合は、絶対値が小さい方の値を参照する。
   *
   * @param v1 １つ目の移動量
   * @param v2 ２つ目の移動量
   *
   * @return 小さい方の移動量
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    let sign: number = v1 > 0.0 ? 1.0 : -1.0;
    let absoluteValue1 = Math.abs(v1);
    let absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  _startY: number; // タッチを開始した時のxの値
  _startX: number; // タッチを開始した時のyの値
  _lastX: number; // シングルタッチ時のxの値
  _lastY: number; // シングルタッチ時のyの値
  _lastX1: number; // ダブルタッチ時の一つ目のxの値
  _lastY1: number; // ダブルタッチ時の一つ目のyの値
  _lastX2: number; // ダブルタッチ時の二つ目のxの値
  _lastY2: number; // ダブルタッチ時の二つ目のyの値
  _lastTouchDistance: number; // 2本以上でタッチしたときの指の距離
  _deltaX: number; // 前回の値から今回の値へのxの移動距離。
  _deltaY: number; // 前回の値から今回の値へのyの移動距離。
  _scale: number; // このフレームで掛け合わせる拡大率。拡大操作中以外は1。
  _touchSingle: boolean; // シングルタッチ時はtrue
  _flipAvailable: boolean; // フリップが有効かどうか
}
