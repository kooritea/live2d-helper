import { Live2DCubismFramework as csmvector } from "../Framework/type/csmvector";
import Csm_csmVector = csmvector.csmVector;
import csmVector_iterator = csmvector.iterator;
import { Webgl } from "./Webgl";
import { Utils } from "../Utils";

export class TextureManager {
  _textures: Csm_csmVector<TextureInfo>;
  webgl: Webgl;
  constructor(webgl: Webgl) {
    this._textures = new Csm_csmVector<TextureInfo>();
    this.webgl = webgl;
  }
  public release(): void {
    for (
      let ite: csmVector_iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      this.webgl.gl.deleteTexture(ite.ptr().id);
    }
    this._textures = null;
  }
  /**
   *
   * @param fileName
   * @param usePremultiply
   * @return textureInfo
   */
  public async createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean
  ): Promise<TextureInfo> {
    return new Promise(async (reslove, reject) => {
      for (
        let ite: csmVector_iterator<TextureInfo> = this._textures.begin();
        ite.notEqual(this._textures.end());
        ite.preIncrement()
      ) {
        if (
          ite.ptr().fileName == fileName &&
          ite.ptr().usePremultply == usePremultiply
        ) {
          reslove(ite.ptr());
          return;
        }
      }

      let img = new Image();
      img.onload = () => {
        let tex: WebGLTexture = this.webgl.gl.createTexture();

        this.webgl.gl.bindTexture(this.webgl.gl.TEXTURE_2D, tex);

        this.webgl.gl.texParameteri(
          this.webgl.gl.TEXTURE_2D,
          this.webgl.gl.TEXTURE_MIN_FILTER,
          this.webgl.gl.LINEAR_MIPMAP_LINEAR
        );
        this.webgl.gl.texParameteri(
          this.webgl.gl.TEXTURE_2D,
          this.webgl.gl.TEXTURE_MAG_FILTER,
          this.webgl.gl.LINEAR
        );

        if (usePremultiply) {
          this.webgl.gl.pixelStorei(
            this.webgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
            1
          );
        }

        this.webgl.gl.texImage2D(
          this.webgl.gl.TEXTURE_2D,
          0,
          this.webgl.gl.RGBA,
          this.webgl.gl.RGBA,
          this.webgl.gl.UNSIGNED_BYTE,
          img
        );

        this.webgl.gl.generateMipmap(this.webgl.gl.TEXTURE_2D);

        this.webgl.gl.bindTexture(this.webgl.gl.TEXTURE_2D, null);

        let textureInfo: TextureInfo = new TextureInfo();
        textureInfo.fileName = fileName;
        textureInfo.width = img.width;
        textureInfo.height = img.height;
        textureInfo.id = tex;
        textureInfo.img = img;
        textureInfo.usePremultply = usePremultiply;
        this._textures.pushBack(textureInfo);

        reslove(textureInfo);
      };
      img.src = URL.createObjectURL(await Utils.getBlob(fileName));
    });
  }
  public releaseTextures(): void {
    for (let i: number = 0; i < this._textures.getSize(); i++) {
      this._textures.set(i, null);
    }

    this._textures.clear();
  }
  /**
   * @param texture
   */
  public releaseTextureByTexture(texture: WebGLTexture) {
    for (let i: number = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).id != texture) {
        continue;
      }

      this._textures.set(i, null);
      this._textures.remove(i);
      break;
    }
  }
  /**
   * @param fileName
   */
  public releaseTextureByFilePath(fileName: string): void {
    for (let i: number = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).fileName == fileName) {
        this._textures.set(i, null);
        this._textures.remove(i);
        break;
      }
    }
  }
}
export class TextureInfo {
  img: HTMLImageElement;
  id: WebGLTexture = null;
  width: number = 0;
  height: number = 0;
  usePremultply: boolean;
  fileName: string;
}
