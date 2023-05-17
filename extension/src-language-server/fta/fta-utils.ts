import { AstNode } from 'langium';
import { AND, InhibitGate, KNGate, OR, TopEvent, isAND, isComponent, isGate, isInhibitGate, isKNGate, isOR, isTopEvent, Child, isCondition, Gate } from '../generated/ast';
import { FTANode } from './fta-interfaces';
import { FTAAspect } from './fta-model';





/**
 * Getter for the references contained in {@code node}.
 * @param node The FTAAspect which tracings should be returned.
 * @returns The objects {@code node} is traceable to.
 */
export function getTargets(node: AstNode): AstNode[] {
    if (node) {
        const targets: AstNode[] = [];
        if(isTopEvent(node)){                                               //probably wrong
            for (const ref of node.child) {
                if (ref?.ref) { targets.push(ref.ref); }
            }
        }else{
            if(isAND(node.$type) || isOR(node.$type) || isKNGate(node.$type) || isInhibitGate(node.$type) ){
                for(const ref of node.$type.child){
                    if(ref?.ref){targets.push(ref.ref);}
                }
            }
            if(isInhibitGate(node.$type)){
                for(const ref of node.$type.condition){
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
    if (isComponent(node)) {
        return FTAAspect.COMPONENT;
    } else if (isGate(node)) {
        return FTAAspect.GATE;
    } else if (isTopEvent(node)) {
        return FTAAspect.TOPEVENT;
    }
    return FTAAspect.UNDEFINED;
}



/**
 * Determines the layer {@code node} should be in depending on the FTA aspect it represents.
 * @param node FTANode for which the layer should be determined.
 * @param hazardDepth Maximal depth of the hazard hierarchy.
 * @param sysConsDepth Maximal depth of the system-level constraint hierarchy.
 * @returns The number of the layer {@code node} should be in.
 */
function determineLayerForFTANode(node: FTANode): number {
    switch (node.aspect) {
        case FTAAspect.TOPEVENT:
            return 0;
        default:
            return -1;
    }
}

export function getAndGates(everyGate: Gate[]): AstNode[]{
    let result: AstNode[] = [];
    for(const gate of everyGate){
        if(isAND(gate)){  // isAnd of an And Gate not working
            result.push(gate);
        }
    }

    return result;
}
export function getOrGates(everyGate: Gate[]): AstNode[]{
    let result: AstNode[] = [];
    for(const gate of everyGate){
        if(isOR(gate.$type)){
            result.push(gate);
        }
    }

    return result;
}
export function getkNGates(everyGate: Gate[]): AstNode[]{
    let result: AstNode[] = [];
    for(const gate of everyGate){
        if(isKNGate(gate.$type)){
            result.push(gate);
        }
    }

    return result;
}
export function getInhibitGates(everyGate: Gate[]): AstNode[]{
    let result: AstNode[] = [];
    for(const gate of everyGate){
        if(isInhibitGate(gate.$type)){
            result.push(gate);
        }
    }

    return result;
}

/*
function setLevels(current: FTANode[], lvl: number, allNodes: FTANode[]): void{
    var next:FTANode[] = [];
    for(const currentNode of current){
        currentNode.level = lvl;
        if(isAND(currentNode) || isOR(currentNode) || isKNGate(currentNode) || isInhibitGate(currentNode) || isTopEvent(currentNode)){
            for(const child of currentNode.child){
                if(isAND(child) || isOR(child) || isKNGate(child) || isInhibitGate(child) || isComponent(child)){
                    if(allNodes.includes(child)){       //Finde 
                        next.push(child);
                    }
                }    
            }
        }
    }

    setLevels(next, lvl++, allNodes);
}
*/


/**
 * Sets the level property for {@code nodes} depending on the layer they should be in.
 * @param nodes The nodes representing the stpa components.
 */
export function setLevelsForFTANodes(nodes: FTANode[]): void{

   for(const node of nodes){
    const level = determineLayerForFTANode(node);
    node.level = level;
   }

}

