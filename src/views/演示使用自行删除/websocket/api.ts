import { defHttp } from '@/utils/http/axios';

enum Api {
  status = '/system/websocket/status',
  send = '/system/websocket/send',
  list = '/system/websocket/list',
  testEncrypt = '/system/websocket/testEncrypt',
}

export function websocketStatus() {
  return defHttp.get<boolean>({ url: Api.status });
}

export function websocketSend(message: string) {
  return defHttp.postWithMsg<void>({ url: Api.send, data: { message } });
}

export function websocketSendSomeone(sessionKey: number, message: string) {
  return defHttp.postWithMsg<void>({ url: Api.send + `/${sessionKey}`, data: { message } });
}

export function websocketList() {
  return defHttp.get<any>({ url: Api.list });
}

export function testEncrypt(message?: string) {
  return defHttp.post<string>(
    { url: Api.testEncrypt, data: { message } },
    { encrypt: true, isTransformResponse: false },
  );
}
