import { Readable, PassThrough } from "stream";
import { EventEmitter } from "events";
import type { Express } from "express";

export interface TestResponse {
  status: number;
  headers: Record<string, any>;
  data: any;
  rawBody: string;
}

export function invokeApp(
  app: Express,
  options: {
    method: string;
    url: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<TestResponse> {
  return new Promise((resolve) => {
    const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : "";

    const req: any = new Readable({
      read() {
        if (bodyStr) {
          this.push(Buffer.from(bodyStr));
        }
        this.push(null);
      },
    });

    req.method = options.method;
    req.url = options.url;
    req.originalUrl = options.url;
    req.headers = {
      "content-type": "application/json",
      ...(options.headers || {}),
    };
    if (bodyStr) {
      req.headers["content-length"] = Buffer.byteLength(bodyStr).toString();
    }

    const socket: any = new PassThrough();
    socket.remoteAddress = "127.0.0.1";
    req.socket = socket;

    const res: any = new EventEmitter();
    const resHeaders: Record<string, any> = {};
    let rawBody = "";
    res.statusCode = 200;

    res.setHeader = (key: string, val: any) => {
      resHeaders[key.toLowerCase()] = val;
    };
    res.getHeader = (key: string) => resHeaders[key.toLowerCase()];
    res.writeHead = (code: number, headers?: any) => {
      res.statusCode = code;
      if (headers) {
        Object.entries(headers).forEach(([k, v]) => {
          resHeaders[k.toLowerCase()] = v;
        });
      }
    };
    res.write = (chunk: any) => {
      rawBody += chunk?.toString() || "";
    };
    res.end = (chunk?: any) => {
      if (chunk) rawBody += chunk.toString();
      let data: any = rawBody;
      try {
        data = JSON.parse(rawBody);
      } catch {}
      resolve({
        status: res.statusCode,
        headers: resHeaders,
        data,
        rawBody,
      });
    };

    app(req, res);
  });
}
