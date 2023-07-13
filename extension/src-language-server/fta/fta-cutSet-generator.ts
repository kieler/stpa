/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { AstNode } from 'langium';
import { IdCache } from 'langium-sprotty';
import { isAND, isComponent, isCondition, isGate, isInhibitGate, isKNGate, isOR, isTopEvent } from '../generated/ast';


export class CutSetGenerator{

    /**
     * Takes the Fault Tree and returns a two-dimensional array of AstNodes where every inner list resembles a minimal cut set.
     * @param allNodes All Nodes in the graph.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns A list of lists that that contains every minimal cut set of the given Fault Tree.
     */
    determineMinimalCutSet(allNodes:AstNode[], idCache:IdCache<AstNode>):AstNode[][]{
        const bdd = this.generateCutSets(allNodes, idCache);

        //Cut sets are minimal if, when any basic event is removed from the set, the remaining events collectively are no longer a cut set.
        //Check every innerList
        //If inner list contains another array from the bdd array, remove innerList because it cant be a minimal cut set
        const minimalCutSet = bdd.filter(innerList => {
            return this.checkIfMinimalCutSet(innerList, bdd); //if this condition is true then the innerList is a minimal cut set
        });

        return minimalCutSet;
    }

    /**
     * Takes a list and all cut sets and checks if the given list is a minimal cut set.
     * @param innerList The list we want to check.
     * @param bdd All Cut Sets of the Fault Tree
     * @returns True if the given list is a minimal cut set or false if is not.
     */
    checkIfMinimalCutSet(innerList:AstNode[], bdd:AstNode[][]):boolean{
        for(const list of bdd){
            if(list.every(e=>innerList.includes(e)) && innerList !== list){
                return false;
            }
        }

        return true;
    }

    /**
     * Takes the Fault Tree and returns a two-dimensional array of AstNodes where every inner list resembles a cut set.
     * @param allNodes All Nodes in the graph.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns A list of lists that that contains every cut set of the given Fault Tree.
     */
    generateCutSets(allNodes:AstNode[], idCache:IdCache<AstNode>):AstNode[][]{
        //Idea:
        //Start from the top event.
        //Get the only child of top event (will always be only one) as our starting node.
        //Calculate all children of the node and evaluate them.
        //In the evaluation we check if the child has children too and do the same recursively until the children are components.
        //Depending on the type of the node process the results of the children differently.


        //When there is no gate, return the component
        const startingNode = this.getChildOfTopEvent(allNodes);
        if(isComponent(startingNode)){
            return [[startingNode]];
        }
        //Evaluate the child of the top event and recursively the entire Fault Tree.
        const cutSets = this.evaluate(startingNode, allNodes ,idCache);
        
        return cutSets;

    }

    /**
     * Takes a single node and returns it evaluation depending on the node type and number of children. This function is called recursively for all children.
     * @param node The node we want to evaluate.
     * @param allNodes All Nodes in the graph.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns A list of lists that is the result of evaluating the given node.
     */
    evaluate(node:AstNode, allNodes: AstNode[], idCache:IdCache<AstNode>): AstNode[][]{
        let result:AstNode[][] = [];

        // we start with the top-most gate(child of topevent) and get all its children.
        const children = this.getAllChildrenOfNode(node);
        if(children.length === 0){return result;};

        //if the node is an and/inhibit-gate we want to evaluate all children and concatenate all inner lists of one child with another.
        if(isGate(node) && (isAND(node.type) || isInhibitGate(node.type))){
            for(const child of children){
                if(isComponent(child) || isCondition(child)){
                    result = this.concatAllLists([[child]], result, idCache);
                }else{
                    result = this.concatAllLists(this.evaluate(child, allNodes, idCache), result, idCache);
                }
            }
        //if the node is an or-gate we want to evaluate all children and add every single inner list to the result.
        }else if(isGate(node) && isOR(node.type)){
            for(const child of children){
                if(isComponent(child)){
                    const orList = [child];
                    result.push(orList);
                }else{
                    for(const list of this.evaluate(child, allNodes, idCache)){  //push every inner list of the child gate.
                        result.push(list);
                    }
                }
            }
            


        //if the node is a kN-gate we want to get every combinations of the children with length k and after that evaluate the gates in the list.
        }else if(isGate(node) && isKNGate(node.type)){
            const k = node.type.k as number;
            const n = node.type.children.length as number;
            
            //Example: With Children:[M1,M2,G1] and k=2 -> [[M1,M2],[M1,G1],[M2,G1]] .
            const combinations:AstNode[][]=[];
            for(let i = k; i<=n; i++){
                for(const comb of this.getAllCombinations(children, i)){
                    combinations.push(comb);
                }
            }

            //Now we want to evaluate G1 (e.g evaluation(G1) = [[C]]).
            //Our result list should look like this -> [[M1,M2], [M1,C], [M2,C]].
            for(const comb of combinations){
                if(comb.some(e => isGate(e) && (isAND(e.type) || isInhibitGate(e.type) || isOR(e.type) || isKNGate(e.type)))){
                    const evaluatedLists = this.evaluateGateInCombinationList(comb, allNodes, idCache);
                    for(const list of evaluatedLists){
                        result.push(list);
                    }
                }else{
                    result.push(comb);
                }
            }
        }

        return result;

    }

    /**
     * Takes a list of components, conditions and gates and then removes the gates and inserts its evaluation in the list. This can result in multiple lists.
     * @param innerList The list we want to evaluate.
     * @param allNodes All Nodes in the graph.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns A list of lists that is the result of inserting the evaluation of the gates in the given list.  
     */
    evaluateGateInCombinationList(innerList: AstNode[], allNodes:AstNode[], idCache:IdCache<AstNode>):AstNode[][]{
    
        let result:AstNode[][] = [];
        const restList:AstNode[] = innerList;

        for(let i = 0; i<restList.length; i++){ 
            const element = restList[i];
            //when the element is a gate.
            if(isGate(element) && (isAND(element.type) || isInhibitGate(element.type) || isOR(element.type) || isKNGate(element.type))){
                //cut out the gate from the rest list.
                const index = restList.indexOf(element);
                restList.splice(index, 1);
                i-=1;
                //and push the evaluation of the gate into the result list.
                const tempLists = this.concatAllLists(this.evaluate(element, allNodes, idCache), result, idCache);
                result = [];
                for(const list of tempLists){
                    result.push(list);
                }
                
            }
        }
        //concatenate every element of the rest list with the result (should only be components/conditions).
        for(const list of restList){
            result = this.concatAllLists([[list]], result, idCache);
        }

        return result;

    }

    /**
     * Gets all combinations of the elements in the given list with length k. 
     * @param nodes The list of nodes we want the combinations of.
     * @param k The number of elements we want in an innerList.
     * @returns the combinations of the elements in the given list with length k.
     */
    getAllCombinations(nodes:AstNode[], k:number):AstNode[][]{ 
        const combinations:AstNode[][] = [];

        if (k > nodes.length || k <= 0) {
            return [];
        }
        if (k === nodes.length) {
            return [nodes];
        }
        if(k===1){
            for(let i = 0; i<nodes.length; i++){
                combinations.push([nodes[i]]);
            }
        }
        
        for(let i = 0; i<nodes.length; i++){
            const currElement:AstNode = nodes[i];
            const restOfList = nodes.slice(i+1);
            for(const subComps of this.getAllCombinations(restOfList, k-1)){
                subComps.unshift(currElement);
                combinations.push(subComps); 
            } 
        }
   
        return combinations;
    }

    

    /**
     * Take an AstNode and return all its children(just the next hierarchy level).
     * @param parentNode The node we want the children of.
     * @returns all children of the given parentNode.
     */
    getAllChildrenOfNode(parentNode: AstNode): AstNode[]{
        const children: AstNode[] = [];
        if(isComponent(parentNode) || isCondition(parentNode)){
            return children;
        }

        if(isGate(parentNode) && (isAND(parentNode.type) || isOR(parentNode.type) || isInhibitGate(parentNode.type) || isKNGate(parentNode.type))){
            for(const ref of parentNode.type.children){
                if(ref?.ref){
                    children.push(ref.ref);
                }
            }
            if(isInhibitGate(parentNode.type)){
                for(const ref of parentNode.type.condition){
                    if(ref?.ref){
                        children.push(ref.ref);
                    }
                }
            }
        }
        return children;
    }

    /**
     * Given all nodes this method returns the first and only child of the topevent.
     * @param allNodes All nodes in the graph.
     * @returns the child of the topevent.
     */
    getChildOfTopEvent(allNodes:AstNode[]): AstNode{
        let child: AstNode = {} as AstNode;

        for(const node of allNodes){
            if(isTopEvent(node)){ 
                for(const ref of node.children){
                    if(ref?.ref){
                        // There is always only one child of the top event.
                        child = ref.ref; 
                    }
                }
            }       
        }
        return child;

    }

    /**
     * Concatenates every inner List of two two-dimensional arrays .
     * @param a The first two-dimensional AstNode array.
     * @param b The second two-dimensional AstNode array.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns a two-dimensional array of type AstNode where every innerList of both arrays is concatenated.
     */
    concatAllLists(a:AstNode[][], b:AstNode[][], idCache:IdCache<AstNode>):AstNode[][]{
        const result: AstNode[][] = [];
        

        if(a.length === 0){
            return b;
        }
        if(b.length === 0){
            return a;
        }
        
        for (const innerA of a) {
            for (const innerB of b) {
                //Add only unique sets
                let newSet = innerA.concat(innerB);
                newSet = newSet.filter((e,i) => newSet.indexOf(e) === i);
                if(this.indexOfArray(newSet, result, idCache) === -1){
                    result.push(newSet);
                }
                

            }
        }
        
        return result;
        
    }

    /**
     * Checks if array a and b are equal by sorting them and comparing their values.
     * @param a The first array we want to compare.
     * @param b The second array we want to compaare.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns True if they are equal and false if not.
     */
    arrayEquals(a:AstNode[], b:AstNode[], idCache:IdCache<AstNode>):boolean{
        const sort = (x:AstNode, y:AstNode):number => {
            const idX = idCache.getId(x);
            const idY = idCache.getId(y);
            if(idX && idY){
                return idX > idY ? -1 : 1;
            }
            return 0;
        };
        const sortA = a.sort(sort);
        const sortB = b.sort(sort);
        

        return a.length === b.length && sortA.every((e,i) => e === sortB[i]); 
        
    }

    /**
     * Gets the index of a list if it's contained in a two-dimensional list of AstNodes or -1 otherwise.
     * @param a The list we want the index of.
     * @param b The two-dimensional list of AstNodes we want to search in.
     * @param idCache The idCache of the generator context from the current graph.
     * @returns the index of the list.
     */
    indexOfArray(a:AstNode[], b:AstNode[][], idCache:IdCache<AstNode>):number{
        let i = 0;
        for(const list of b){
            if(this.arrayEquals(a, list, idCache)){
                break;
            }
            i++;
        }
        if(i >= b.length){
            return -1;
        }
        return i;
    }

}




