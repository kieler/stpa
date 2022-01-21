import { DefaultScopeProvider, stream, Stream, AstNode, Scope, getDocument, PrecomputedScopes, AstNodeDescription, 
    SimpleScope, EMPTY_SCOPE } from "langium";
import { isResponsibility, isResps, isSystemConstraint, isActionUCAs, Model, Node, UCA, Command, ActionUCAs, Hazard, 
    SystemConstraint, isModel, isHazardList, isContConstraint, isLossScenario} from "./generated/ast";
import { StpaServices } from "./stpa-module";


export class STPAScopeProvider extends DefaultScopeProvider {

    /* the types of the different aspects */
    private CA_TYPE = Command
    private HAZARD_TYPE = Hazard
    private SYS_CONSTRAINT_TYPE = SystemConstraint
    private UCA_TYPE = UCA

    constructor(services: StpaServices) {
        super(services);
    }

    getScope(node: AstNode, referenceId: string): Scope {
        const referenceType = this.reflection.getReferenceType(referenceId);
        const precomputed = getDocument(node).precomputedScopes;
        if (precomputed) {
            // determine the scope for the different reference types
            if ((isContConstraint(node) || isLossScenario(node)) && referenceType == this.UCA_TYPE) {
                return this.getUCAs(node, precomputed)
            } else if (isResponsibility(node) && referenceType == this.SYS_CONSTRAINT_TYPE) {
                return this.getSystemConstraints(node, precomputed)
            } else if ((isSystemConstraint(node) || isHazardList(node)) && referenceType == this.HAZARD_TYPE) {
                return this.getHazards(node, precomputed)
            } else if (isActionUCAs(node) && referenceType == this.CA_TYPE) {
                return this.getCAs(node, precomputed)
            } else {
                return this.getStandardScope(node, referenceType, precomputed)
            }
        }
        return EMPTY_SCOPE
        //return this.getGlobalScope(referenceType);
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
        if ((isResps(node) || isActionUCAs(node)) && referenceType == Node) {
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

        let result: Scope = EMPTY_SCOPE;
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result
    }

    /**
     * Collects all definitions of VerticalEdges (controlActions&Feedback) for the referenced system.
     * @param node Current ActionUCAs.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all VerticalEdges.
     */
    getCAs(node: ActionUCAs, precomputed: PrecomputedScopes): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = [];
        let actionLists = node.system.ref?.actions

        if (actionLists) {
            for (const actionList of actionLists) {
                let currentNode: AstNode | undefined = actionList;
                do {
                    const allDescriptions = precomputed.get(currentNode);
                    if (allDescriptions) {
                        scopes.push(stream(allDescriptions).filter(
                            desc => this.reflection.isSubtype(desc.type, this.CA_TYPE)));
                    }
                    currentNode = currentNode.$container;
                } while (currentNode);
            }
        }

        let result: Scope = EMPTY_SCOPE;
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
    private getHazards(node: AstNode, precomputed: PrecomputedScopes): Scope {
        let model = node.$container
        while (!isModel(model)) {
            model=model?.$container
        }
        // todo: statt eigene methode einfach collectElementsWithSubComps aufrufen und dan wie in den andern methoden ne for schleife  nutzen
        // todo: hazard und syscons methode zsmfassen?
        const scopes: Array<Stream<AstNodeDescription>> = this.getNestedComps(model.hazards, precomputed, this.HAZARD_TYPE)
        
        let result: Scope = EMPTY_SCOPE;
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }

    private getNestedComps(nodes: (Hazard | SystemConstraint)[], precomputed: PrecomputedScopes, type: string): Array<Stream<AstNodeDescription>> {
        let scopes: Array<Stream<AstNodeDescription>> = [];
        for (const node of nodes) {
            let currentNode: AstNode | undefined = node;
            if (node.subComps.length!=0) {
                scopes = this.getNestedComps(node.subComps, precomputed, type)
            }
            do {
                const allDescriptions = precomputed.get(currentNode);
                if (allDescriptions) {
                    scopes.push(stream(allDescriptions).filter(
                        desc => this.reflection.isSubtype(desc.type, type)));
                }
                currentNode = currentNode.$container;
            } while (currentNode);
        }
        return scopes
    }
        

    /**
     * Collects all definitions of system constraints.
     * @param node Current AstNode.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all system-level constraints.
     */
    private getSystemConstraints(node: AstNode, precomputed: PrecomputedScopes): Scope {
        let model = node.$container
        while (!isModel(model)) {
            model=model?.$container
        }

        const scopes: Array<Stream<AstNodeDescription>> = this.getNestedComps(model.systemLevelConstraints, precomputed, this.SYS_CONSTRAINT_TYPE)
        let result: Scope = EMPTY_SCOPE;
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
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

        let result: Scope = EMPTY_SCOPE;
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = new SimpleScope(scopes[i], result);
        }
        return result;
    }

}
