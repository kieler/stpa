import { AstNode, AstNodeDescription, DefaultScopeProvider, EMPTY_SCOPE, getDocument, Scope, SimpleScope, Stream, stream } from "langium";
import { isResps, Node, Resps } from "./generated/ast";
import { StpaServices } from "./stpa-module";


export class STPAScopeProvider extends DefaultScopeProvider {

    constructor(services: StpaServices) {
        super(services);
    }

    override  getScope(node: AstNode, referenceId: string): Scope {
        /* if (isContConstraint(node)) {
            return this.getScopeForContConstraint(node, referenceId)
        } */
        if (isResps(node)) {
            return this.getScopeForResps(node, referenceId)
        } else {
            return super.getScope(node, referenceId)
        }
    }

    private getScopeForResps(node: Resps, referenceId: string) {
        const model = node.$container
        const systems = model.controlStructure.systems

        const scopes: Array<Stream<AstNodeDescription>> = [];
        const referenceType = this.reflection.getReferenceType(referenceId);

        if (referenceType == Node) {
            for (let system of systems) {
                const precomputed = getDocument(system).precomputedScopes
                if (precomputed) {
                    let currentNode: AstNode | undefined = system;
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
        } else {
            return super.getScope(node, referenceId)
        }
        return EMPTY_SCOPE
    }

/*     private getScopeForContConstraint(node: ContConstraint, referenceId: string): Scope {
        const model = node.$container
        const ucas: AstNode[] = []
        for (const commandUCA of model.allUCAs) {
            ucas.concat(commandUCA.ucas)
        }
        
        const scopes: Array<Stream<AstNodeDescription>> = [];
        const referenceType = this.reflection.getReferenceType(referenceId);
        const precomputed = getDocument(node).precomputedScopes
        if (precomputed) {
            for (let uca of ucas) {
                const allDescriptions = precomputed.get(uca)
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions))
                }
            }
        }

        let result: Scope = this.getGlobalScope(referenceType);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result
    } */

}
