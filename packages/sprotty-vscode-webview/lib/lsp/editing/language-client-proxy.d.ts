import { NotificationType, NotificationType0, RequestType, RequestType0 } from 'vscode-jsonrpc';
import { CancellationToken } from 'vscode-languageserver-protocol';
export declare class LanguageClientProxy {
    private currentNumber;
    private openRequestsResolves;
    private openRequestsRejects;
    constructor();
    sendRequest<R, E>(type: RequestType0<R, E>, token?: CancellationToken): Promise<R>;
    sendRequest<P, R, E>(type: RequestType<P, R, E>, params: P, token?: CancellationToken): Promise<R>;
    sendNotification(type: NotificationType0): void;
    sendNotification<P>(type: NotificationType<P>, params?: P): void;
}
//# sourceMappingURL=language-client-proxy.d.ts.map