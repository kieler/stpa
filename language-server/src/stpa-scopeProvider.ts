import { DefaultScopeProvider, stream, Stream, AstNode, Scope, getDocument, PrecomputedScopes, AstNodeDescription, 
    EMPTY_SCOPE } from "langium";
import { isResponsibility, isResps, isSystemConstraint, isActionUCAs, Model, Node, UCA, Command, ActionUCAs, Hazard, 
    SystemConstraint, isModel, isHazardList, isContConstraint, isLossScenario, LossScenario, HazardList} from "./generated/ast";
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
        let model = node.$container
        while (model && !isModel(model)) {
            model = model?.$container
        }
        if (precomputed && model) {
            // determine the scope for the different reference types
            if ((isContConstraint(node) || isLossScenario(node)) && referenceType == this.UCA_TYPE) {
                return this.getUCAs(node, model, precomputed)
            } else if (isHazardList(node) && isLossScenario(node.$container) && node.$container.uca && referenceType == this.HAZARD_TYPE) {
                return this.getUCAHazards(node, node.$container, model, precomputed)
            } else if (isResponsibility(node) && referenceType == this.SYS_CONSTRAINT_TYPE) {
                return this.getSystemConstraints(node, model, precomputed)
            } else if ((isSystemConstraint(node) || isHazardList(node)) && referenceType == this.HAZARD_TYPE) {
                return this.getHazards(node, model, precomputed)
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
        let currentNode: AstNode | undefined = node;
        // responsibilities and UCAs should have references to the nodes in the control structure
        if ((isResps(node) || isActionUCAs(node)) && referenceType == Node) {
            const model = node.$container as Model
            currentNode = model.controlStructure
        }

        const allDescriptions = this.getDescriptions(currentNode, referenceType, precomputed)
        return this.descriptionsToScope(allDescriptions)
    }

    private getUCAHazards(node: HazardList, parent: LossScenario, model: Model, precomputed: PrecomputedScopes): Scope {
        const names = parent.uca?.ref?.list.refs.map(x => x.ref?.name)
        if (names){
            for (let i = 0; i<names?.length; i++) {
                console.log(names[i])
            }
        }
        
        const allDescriptions = this.getHazardSysCompsDescriptions(model.hazards, precomputed, this.HAZARD_TYPE)  
        const filtered = allDescriptions.filter(desc => names?.includes(desc.name))
        return this.descriptionsToScope(filtered)
    }

    /**
     * Collects all definitions of VerticalEdges (controlActions&Feedback) for the referenced system.
     * @param node Current ActionUCAs.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all VerticalEdges.
     */
    private getCAs(node: ActionUCAs, precomputed: PrecomputedScopes): Scope {
        let allDescriptions: AstNodeDescription[] = []
        let actionLists = node.system.ref?.actions

        if (actionLists) {
            for (const actionList of actionLists) {
                let currentNode: AstNode | undefined = actionList;
                const descs = this.getDescriptions(currentNode, this.CA_TYPE, precomputed)
                allDescriptions = allDescriptions.concat(descs)
            }
        }
        return this.descriptionsToScope(allDescriptions)
    }

    /**
     * Collects all definitions of hazards.
     * @param node Current AstNode.
     * @param model Model containing {@code node}.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all hazards.
     */
    private getHazards(node: AstNode, model: Model, precomputed: PrecomputedScopes): Scope {
        const allDescriptions = this.getHazardSysCompsDescriptions(model.hazards, precomputed, this.HAZARD_TYPE)
        return this.descriptionsToScope(allDescriptions)
    }

    /**
     * Collects all definitions of system constraints.
     * @param node Current AstNode.
     * @param model Model containing {@code node}.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all system-level constraints.
     */
    private getSystemConstraints(node: AstNode, model: Model, precomputed: PrecomputedScopes): Scope {
        const allDescriptions = this.getHazardSysCompsDescriptions(model.systemLevelConstraints, precomputed, this.SYS_CONSTRAINT_TYPE)
        return this.descriptionsToScope(allDescriptions)
    }

    private getHazardSysCompsDescriptions(nodes: (Hazard | SystemConstraint)[], precomputed: PrecomputedScopes, type: string): AstNodeDescription[] {
        let res: AstNodeDescription[] = []
        for (const node of nodes) {
            let currentNode: AstNode | undefined = node;
            if (node.subComps.length!=0) {
                res = this.getHazardSysCompsDescriptions(node.subComps, precomputed, type)
            }
            res = res.concat(this.getDescriptions(currentNode, type, precomputed))
        }
        return res
    }

    /**
     * Collects all definitions of UCAs.
     * @param node Current AstNode.
     * @param model Model containing {@code node}.
     * @param precomputed Precomputed Scope of the document.
     * @returns Scope containing all UCAs.
     */
    private getUCAs(node: AstNode, model: Model, precomputed: PrecomputedScopes): Scope {
        let allDescriptions: AstNodeDescription[] = []
        const allUCAs = model.allUCAs
        for (const systemUCAs of allUCAs) {
            let currentNode: AstNode | undefined = systemUCAs;
            const descs = this.getDescriptions(currentNode, this.UCA_TYPE, precomputed)
            allDescriptions = allDescriptions.concat(descs)
        }
        return this.descriptionsToScope(allDescriptions)
    }

    private getDescriptions(currentNode: AstNode | undefined, type: string, precomputed: PrecomputedScopes): AstNodeDescription[] {
        let res: AstNodeDescription[] = []
        while (currentNode) {
            const allDescriptions = precomputed.get(currentNode);
            if (allDescriptions) {
                res = res.concat(allDescriptions.filter(desc => this.reflection.isSubtype(desc.type, type)))
            }
            currentNode = currentNode.$container;
        }
        return res
    }

    private descriptionsToScope(descs: AstNodeDescription[]): Scope {
        const scopes: Array<Stream<AstNodeDescription>> = []
        scopes.push(stream(descs))
        let result: Scope = EMPTY_SCOPE;
        for (let i = scopes.length - 1; i >= 0; i--) {
            result = this.createScope(scopes[i], result);
        }
        return result;
    }

}
