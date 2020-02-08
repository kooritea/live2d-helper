export class Utils {
  public static xhr(
    url,
    method,
    responseType: "arraybuffer" | "blob" | "document" | "json" | "text"
  ): Promise<any> {
    return new Promise((reslove, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = responseType;
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            reslove(xhr.response);
          } else {
            reject({
              status: xhr.status,
              message: xhr.responseText
            });
          }
        }
      };
      xhr.send();
    });
  }

  public static async getJson(url: string): Promise<JSON> {
    return await this.xhr(url, "get", "json");
  }

  public static async getBlob(url: string): Promise<Blob> {
    return await this.xhr(url, "get", "blob");
  }

  public static async getArraybuffer(url: string): Promise<ArrayBuffer> {
    return await this.xhr(url, "get", "arraybuffer");
  }

  public static arrayBuffer2String(buffer: ArrayBuffer): string {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  public static getRandomItem<T>(target: T[]): T {
    return target[Math.floor(Math.random() * target.length)];
  }
}
