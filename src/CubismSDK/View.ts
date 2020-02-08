import { Webgl } from "./Webgl";

export class View {
  _programId: WebGLProgram;
  _webgl: Webgl;
  constructor(webgl: Webgl) {
    this._webgl = webgl;
  }
  public render(): void {
    this._webgl.gl.useProgram(this._programId);

    this._webgl.gl.flush();
  }
}
