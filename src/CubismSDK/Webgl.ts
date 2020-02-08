export class Webgl {
  public gl: WebGLRenderingContext;
  public frameBuffer: any;
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext("webgl");
    this.frameBuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  public createShader(): WebGLProgram {
    let vertexShaderId = this.gl.createShader(this.gl.VERTEX_SHADER);

    if (vertexShaderId == null) {
      // LAppPal.printLog("failed to create vertexShader");
      return null;
    }

    const vertexShader: string =
      "precision mediump float;" +
      "attribute vec3 position;" +
      "attribute vec2 uv;" +
      "varying vec2 vuv;" +
      "void main(void)" +
      "{" +
      "   gl_Position = vec4(position, 1.0);" +
      "   vuv = uv;" +
      "}";

    this.gl.shaderSource(vertexShaderId, vertexShader);
    this.gl.compileShader(vertexShaderId);

    let fragmentShaderId = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    if (fragmentShaderId == null) {
      // LAppPal.printLog("failed to create fragmentShader");
      return null;
    }

    const fragmentShader: string =
      "precision mediump float;" +
      "varying vec2 vuv;" +
      "uniform sampler2D texture;" +
      "void main(void)" +
      "{" +
      "   gl_FragColor = texture2D(texture, vuv);" +
      "}";

    this.gl.shaderSource(fragmentShaderId, fragmentShader);
    this.gl.compileShader(fragmentShaderId);

    let programId = this.gl.createProgram();
    this.gl.attachShader(programId, vertexShaderId);
    this.gl.attachShader(programId, fragmentShaderId);

    this.gl.deleteShader(vertexShaderId);
    this.gl.deleteShader(fragmentShaderId);

    this.gl.linkProgram(programId);

    this.gl.useProgram(programId);

    return programId;
  }
}
