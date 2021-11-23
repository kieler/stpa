import { AstNode, AstNodeDescription, DefaultScopeProvider, getDocument, PrecomputedScopes, Scope, SimpleScope, Stream, stream } from "langium";
import { isResps, isSystemUCAs, Model, Node, UCA} from "./generated/ast";
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
            if (referenceType == UCA) {
                return this.getUCAs(node, referenceType, precomputed)
            } else {
                let currentNode: AstNode | undefined = node;
                // responsibilities and UCAs should have references to the nodes in the control structure
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
        }

        let result: Scope = this.getGlobalScope(referenceType);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }
    
    private getUCAs(node: AstNode, referenceType: string, precomputed: PrecomputedScopes): Scope {
        const model = node.$container as Model
        const scopes: Array<Stream<AstNodeDescription>> = [];
        const allUCAs = model.allUCAs
        for (const systemUCAs of allUCAs) {
            let currentNode: AstNode | undefined = systemUCAs;
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
