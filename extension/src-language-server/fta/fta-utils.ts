import { AstNode } from 'langium';
import { Gate, isAND, isComponent, isCondition, isGate, isInhibitGate, isKNGate, isOR, isTopEvent } from '../generated/ast';
import { FTAEdge, FTANode } from './fta-interfaces';
import { FTAAspect } from './fta-model';





/**
 * Getter for the references contained in {@code node}.
 * @param node The FTAAspect which tracings should be returned.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode): AstNode[] {
    if (node) {
        const targets: AstNode[] = [];
        if(isTopEvent(node)){                                              
            for (const ref of node.child) {
                if (ref?.ref) { targets.push(ref.ref); }
            }
        }else if(isGate(node)){
            for(const ref of node.type.child){
                if(ref?.ref){targets.push(ref.ref);}        //G3 = G4 AND G5 Referencen von G3: ref?.ref  gelten wahrscheinlich als undefined
            }
            if(node.type.$type === 'InhibitGate'){
                for(const ref of node.type.condition){
                    if(ref?.ref){targets.push(ref.ref);}
                }
            }
        }
        return targets;
    }else{
        return [];
    }
}


/**
 * Getter for the aspect of a FTA component.
 * @param node AstNode which aspect should determined.
 * @returns the aspect of {@code node}.
 */
export function getAspect(node: AstNode): FTAAspect {
    if (isTopEvent(node)) {
        return FTAAspect.TOPEVENT;    
    }else if (isComponent(node)) {
        return FTAAspect.COMPONENT;
    }else if (isCondition(node)) {
        return FTAAspect.CONDITION;
    }else if(isGate(node) && isAND(node.type)){
        return FTAAspect.AND;
    }else if (isGate(node) && isOR(node.type)) {
        return FTAAspect.OR;
    }else if (isGate(node) && isKNGate(node.type)) {
        return FTAAspect.KN;
    }else if (isGate(node) && isInhibitGate(node.type)) {
        return FTAAspect.INHIBIT;
    }
    return FTAAspect.UNDEFINED;
}


/** Sorts every gate with its type and puts them into a two dimensional array
 * @param everyGate Every gate within the FTAModel
 * @returns A two dimensional array with every gate sorted into the respective category of And, Or, KN, Inhibit-Gate
 */
export function getAllGateTypes(everyGate: Gate[]): AstNode[][]{
    const andGates: AstNode[] = [];
    const orGates: AstNode[] = [];
    const kNGates: AstNode[] = [];
    const inhibGates: AstNode[] = [];

    for(const gate of everyGate){
        if(gate.type.$type === 'AND'){ 
            andGates.push(gate);
        }else if(gate.type.$type === 'OR'){
            orGates.push(gate);
        }else if(gate.type.$type === 'KNGate'){
            kNGates.push(gate);
        }else if(gate.type.$type === 'InhibitGate'){
            inhibGates.push(gate);
        }
    }
    const result: AstNode[][] = [andGates, orGates, kNGates, inhibGates];
    return result;
}


/**
 * Sets the level property for {@code nodes} depending on the layer they should be in.
 * @param nodes The nodes representing the stpa components.
 */
export function setLevelsForFTANodes(nodes: FTANode[], edges: FTAEdge[]): void{
    //start with the top event 
    const topevent: FTANode[] = [getTopEvent(nodes)];
    determineLevelForChildren(topevent, 0, edges, nodes);
}

/**
 * Returns the top event.
 * @param nodes All nodes. 
 * @returns the top event from all nodes.
 */
function getTopEvent(nodes: FTANode[]): FTANode{
    for(const node of nodes){
        if(node.aspect === FTAAspect.TOPEVENT){
            return node;
        }
    }
    const empty = {} as FTANode;
    return empty;
}

/**
 * Recursively determine the level of all nodes, starting with the top event.
 * @param nodes All the nodes on the current layer we want to look at. At the start, this is just the top event.
 * @param level The current level we want to assign.
 * @param edges All edges in the graph.
 * @param allNodes All nodes in the graph.
 */
function determineLevelForChildren(nodes: FTANode[], level: number, edges: FTAEdge[], allNodes: FTANode[]): void{
    const children: FTANode[] = []; 

    for(const node of nodes){
        //for every node on current layer assign the level.
        node.level = level;
        for(const edge of edges){
            //Look at every edge that starts from our current node.
            if(edge.sourceId === node.id){
                //Get child that is connected to the second part of the edge
                const child = getChildWithID(allNodes, edge.targetId); //Edge from G1 to G3 (G1:-:G3) with G3 being the targetId. 
                if(!children.some((c) => c.id === child.id) && child.aspect !== FTAAspect.CONDITION){ //Don't add conditions yet.
                    children.push(getChildWithID(allNodes, edge.targetId));
                }
            }
        }
    }
    //If there is an inhibit gate in the next iteration/layer, then also
    //add Condition to children, so that they can be on the same layer as the inhibit gates.
    for(const node of children){
        if(node.aspect === FTAAspect.INHIBIT){
            for(const edge of edges){
                if(edge.sourceId === node.id){
                    node.level = level;
                    const child = getChildWithID(allNodes, edge.targetId);
                    if(child.aspect === FTAAspect.CONDITION){
                        children.push(child);
                    }
                }    
            }
        }
    }

    level++;
    //Only repeat until there is no layer below
    if(children.length !== 0){
        determineLevelForChildren(children, level, edges, allNodes);
    }

}


/**
 * Gets a child object with its id from all nodes.
 * @param nodes All FtaNodes we want to assign levels to.
 * @param id The id of Node.
 * @returns an FTANode with the given id.
 */
function getChildWithID(nodes: FTANode[], id: String): FTANode{
    for(const node of nodes){
        if(node.id === id){
            return node;
        }
    }
    const empty = {} as FTANode;
    return empty;
}

