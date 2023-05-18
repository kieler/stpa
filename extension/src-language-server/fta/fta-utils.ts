import { AstNode } from 'langium';
import { AND, InhibitGate, KNGate, OR, TopEvent, isAND, isComponent, isGate, isInhibitGate, isKNGate, isOR, isTopEvent, Child, isCondition, Gate, Condition } from '../generated/ast';
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
        if(isTopEvent(node)){                                              
            for (const ref of node.child) {
                if (ref?.ref) { targets.push(ref.ref); }
            }
        }else if(isGate(node)){
            for(const ref of node.type.child){
                if(ref?.ref){targets.push(ref.ref);}        //G3 = G4 AND G5 Referencen von G3: ref?.ref  gelten wahrscheinlich als undefined
            }
            if(node.type.$type == 'InhibitGate'){
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

/** Sorts every gate with its type and puts them into a two dimensional array
 * @param everyGate Every gate within the FTAModel
 * @returns A two dimensional array with every gate sorted into the respective category of And, Or, KN, Inhibit-Gate
 */
export function getAllGateTypes(everyGate: Gate[]): AstNode[][]{
    let andGates: AstNode[] = [];
    let orGates: AstNode[] = [];
    let kNGates: AstNode[] = [];
    let inhibGates: AstNode[] = [];

    for(const gate of everyGate){
        if(gate.type.$type == 'AND'){ 
            andGates.push(gate);
        }else if(gate.type.$type == 'OR'){
            orGates.push(gate);
        }else if(gate.type.$type == 'KNGate'){
            kNGates.push(gate);
        }else if(gate.type.$type == 'InhibitGate'){
            inhibGates.push(gate);
        }
    }
    let result: AstNode[][] = [andGates, orGates, kNGates, inhibGates];
    return result;
}


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

