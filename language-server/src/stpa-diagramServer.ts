import { Action, DiagramServer, RequestAction, ResponseAction } from 'sprotty-protocol'

export class StpaDiagramServer extends DiagramServer {

    accept(action: Action): Promise<void> {
        console.log("received from client: " + action.kind)
        return super.accept(action)
    }

    request<Res extends ResponseAction>(action: RequestAction<Res>): Promise<Res> {
        console.log("request send from server to client: " + action.kind)
        return super.request(action)
    }

}