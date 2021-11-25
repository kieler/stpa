import { AstNode, AstNodeDescription, DefaultScopeProvider, EMPTY_SCOPE, getDocument, PrecomputedScopes, Scope, SimpleScope, Stream, stream } from "langium";
import { isResponsibility, isResps, isSystemSubConstraint, isActionUCAs, Model, Node, Responsibility, SubHazard, SystemSubConstraint, UCA, VerticalEdge, ActionUCAs, isUCA, isLossScenario} from "./generated/ast";
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
            } else if (isResponsibility(node) && referenceType == SystemSubConstraint) {
                this.getSystemSubConstraints(node, referenceType, precomputed)
            } else if ((isSystemSubConstraint(node) || isUCA(node) || isLossScenario(node)) && referenceType == SubHazard) {
                return this.getSubHazards(node, referenceType, precomputed)
            } else if (isActionUCAs(node) && referenceType == VerticalEdge) {
                return this.getCAs(node, referenceType, precomputed)
            } else {
                let currentNode: AstNode | undefined = node;
                // responsibilities and UCAs should have references to the nodes in the control structure
                if (isResps(node) && referenceType == Node) {
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

    getCAs(node: ActionUCAs, referenceType: string, precomputed: PrecomputedScopes): Scope {
        let model = node.$container
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let hazards = model.controlStructure.nodes
        for (const hazard of hazards) {
            let currentNode: AstNode | undefined = hazard;
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

    getSubHazards(node: AstNode, referenceType: string, precomputed: PrecomputedScopes): Scope {
        let model = undefined
        if (isLossScenario(node)) {
            model = node.$container
        } else if (isUCA(node) || isSystemSubConstraint(node)){
            model = node.$container?.$container
        }
        if (model) {
            const scopes: Array<Stream<AstNodeDescription>> = [];
            let hazards = model.hazards
            for (const hazard of hazards) {
                let currentNode: AstNode | undefined = hazard;
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
        return EMPTY_SCOPE
    }

    getSystemSubConstraints(node: Responsibility, referenceType: string, precomputed: PrecomputedScopes): Scope {
        let model = node.$container.$container
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let constraints = model.systemLevelConstraints
        for (const cons of constraints) {
            console.log(cons)
            let currentNode: AstNode | undefined = constraints[2].systemSubConstraints[0];
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
