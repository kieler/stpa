import { AstNode, AstNodeDescription, DefaultScopeProvider, getDocument, Scope, SimpleScope, Stream, stream } from "langium";
import {  isResps, isSystemUCAs, Model, Node} from "./generated/ast";
import { StpaServices } from "./stpa-module";


export class STPAScopeProvider extends DefaultScopeProvider {

    constructor(services: StpaServices) {
        super(services);
    }

    override  getScope(node: AstNode, referenceId: string): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = [];
        const referenceType = this.reflection.getReferenceType(referenceId);

        const precomputed = getDocument(node).precomputedScopes;
        if (precomputed) {
            let currentNode: AstNode | undefined = node;
            if ((isResps(node) || isSystemUCAs(node)) && referenceType == Node) {
                const model = node.$container as Model
                currentNode = model.controlStructure
            }
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, referenceType)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(referenceType);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }


}
