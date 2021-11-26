import { AstNode, AstNodeDescription, DefaultScopeProvider, EMPTY_SCOPE, getDocument, PrecomputedScopes, Scope, SimpleScope, Stream, stream } from "langium";
import { isResponsibility, isResps, isSystemConstraint, isActionUCAs, Model, Node, UCA, VerticalEdge, ActionUCAs, Hazard, SystemConstraint, isModel, isHazardList, isContConstraint, isLossScenario} from "./generated/ast";
import { StpaServices } from "./stpa-module";


export class STPAScopeProvider extends DefaultScopeProvider {

    /* the types of the different aspects */
    private CA_TYPE = VerticalEdge
    private HAZARD_TYPE = Hazard
    private SYS_CONSTRAINT_TYPE = SystemConstraint
    private UCA_TYPE = UCA

    constructor(services: StpaServices) {
        super(services);
    }

    override getScope(node: AstNode, referenceId: string): Scope {
        const referenceType = this.reflection.getReferenceType(referenceId);
        const precomputed = getDocument(node).precomputedScopes;
        // TODO: for a responsibility precomputed is undefined
        if (precomputed) {
            // determine the scope for the different reference types
            if ((isContConstraint(node) || isLossScenario(node)) && referenceType == this.UCA_TYPE) {
                return this.getUCAs(node, precomputed)
            } else if (isResponsibility(node) && referenceType == this.SYS_CONSTRAINT_TYPE) {
                this.getSystemConstraints(node, precomputed)
            } else if ((isSystemConstraint(node) || isHazardList(node)) && referenceType == this.HAZARD_TYPE) {
                return this.getHazards(node, precomputed)
            } else if (isActionUCAs(node) && referenceType == this.CA_TYPE) {
                return this.getCAs(node, precomputed)
            } else {
                return this.getStandardScope(node, referenceType, precomputed)
            }
        }
        return this.getGlobalScope(referenceType);
    }

    /**
     * Determines the standard scope.
     * @param node Current AstNode.
     * @param referenceType Type of the reference.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope with the elements that should be referencable.
     */
    private getStandardScope(node: AstNode, referenceType: string, precomputed: PrecomputedScopes): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = [];
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

        let result: Scope = this.getGlobalScope(referenceType);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result
    }

    /**
     * Collects all definitions of control ations.
     * @param node Current AstNode.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all control actions.
     */
    getCAs(node: ActionUCAs, precomputed: PrecomputedScopes): Scope {
        let model = node.$container
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let hazards = model.controlStructure.nodes
        for (const hazard of hazards) {
            let currentNode: AstNode | undefined = hazard;
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, this.CA_TYPE)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(this.CA_TYPE);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }

    /**
     * Collects all definitions of hazards.
     * @param node Current AstNode.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all hazards.
     */
    getHazards(node: AstNode, precomputed: PrecomputedScopes): Scope {
        let model = node.$container
        while (!isModel(model)) {
            model=model?.$container
        }
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let hazards = model.hazards
        for (const hazard of hazards) {
            let currentNode: AstNode | undefined = hazard;
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, this.HAZARD_TYPE)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(this.HAZARD_TYPE);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }
        

    /**
     * Collects all definitions of system constraints.
     * @param node Current AstNode.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all system-level constraints.
     */
    private getSystemConstraints(node: AstNode, precomputed: PrecomputedScopes): Scope {
        console.log("test")
/*         let model = node.$container
        while (!isModel(model)) {
            model=model?.$container
        }
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let constraints = model.systemLevelConstraints
        for (const cons of constraints) {
            let currentNode: AstNode | undefined = cons;
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, this.SYS_CONSTRAINT_TYPE)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(this.SYS_CONSTRAINT_TYPE);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        } */
        return EMPTY_SCOPE;
    }
    
    /**
     * Collects all definitions of UCAs.
     * @param node Current AstNode.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all UCAs.
     */
    private getUCAs(node: AstNode, precomputed: PrecomputedScopes): Scope {
        const model = node.$container as Model
        const scopes: Array<Stream<AstNodeDescription>> = [];
        const allUCAs = model.allUCAs
        for (const systemUCAs of allUCAs) {
            let currentNode: AstNode | undefined = systemUCAs;
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, this.UCA_TYPE)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }

        let result: Scope = this.getGlobalScope(this.UCA_TYPE);
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }

}
