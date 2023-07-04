import { FTAEdge, FTANode } from './fta-interfaces';
import { FTAAspect } from "./fta-model";


export class CutSetGenerator{

    /**
     * Takes the Fault Tree and returns a two-dimensional array of FTANodes where every inner list resembles a minimal cut set.
     * @param allNodes All Nodes in the graph.
     * @param allEdges All Edges in the graph.
     * @returns A list of lists that that contains every minimal cut set of the given Fault Tree.
     */
    determineMinimalCutSet(allNodes:FTANode[], allEdges:FTAEdge[]):FTANode[][]{
        const bdd = this.generateCutSets(allNodes, allEdges);

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
    checkIfMinimalCutSet(innerList:FTANode[], bdd:FTANode[][]):boolean{
        for(const list of bdd){
            if(list.every(e=>innerList.includes(e)) && innerList !== list){
                return false;
            }
        }


        return true;
    }
    /**
     * Takes the Fault Tree and returns a two-dimensional array of FTANodes where every inner list resembles a cut set.
     * @param allNodes All Nodes in the graph.
     * @param allEdges All Edges in the graph.
     * @returns A list of lists that that contains every cut set of the given Fault Tree.
     */
    generateCutSets(allNodes:FTANode[], allEdges:FTAEdge[]):FTANode[][]{



        //Idea:
        //Start from the top event.
        //Get the only child of top event (will always be only one) as our starting node.
        //Calculate all children of the node and evaluate them.
        //In the evaluation we check if the child has children too and do the same recursively until the children are components.
        //Depending on the type of the node process the results of the children differently.

        //Order components by level from top to bottom for a smaller BDD.
        allNodes.sort(this.sortByLevel);

        //When there is no gate, return the component
        const startingNode = this.getChildOfTopEvent(allNodes, allEdges);
        if(startingNode.aspect === FTAAspect.COMPONENT){
            return [[startingNode]];
        }
        //Evaluate the child of the top event and recursively the entire Fault Tree.
        const unprocressedCutSets = this.evaluate(startingNode, allNodes, allEdges);

        //Final duplication checks:
        //In the case that two gates share the same child, remove duplicates from all innerLists. [[C,U,U]] -> [[C,U]]
        const tempCutSets:FTANode[][] = [];
        for(const innerList of unprocressedCutSets){
            const filteredList = innerList.filter((e,i) => innerList.indexOf(e) === i); //indexOf only returns the first index of the element in the list.
            tempCutSets.push(filteredList);
        }

        //In case there are two inner lists with the same elements, remove the duplicates. [[C,U], [U,C]] -> [[C,U]]
        const cutSets = tempCutSets.filter((e,i) => this.indexOfArray(e, tempCutSets) === i);
        
        return cutSets;

    }

    /**
     * Takes a single node and returns it evaluation depending on the node type and number of children. This function is called recursively for all children.
     * @param node The node we want to evaluate.
     * @param allNodes All Nodes in the graph.
     * @param allEdges All Edges in the graph.
     * @returns A list of lists that is the result of evaluating the given node.
     */
    evaluate(node:FTANode, allNodes: FTANode[], allEdges: FTAEdge[]): FTANode[][]{
        let result:FTANode[][] = [];

        // we start with the top-most gate(child of topevent) and get all its children.
        const children = this.getAllChildrenOfNode(node, allNodes, allEdges);
        if(children.length === 0){return result;};

        //if the node is an and/inhibit-gate we want to evaluate all children and concatenate all inner lists of one child with another.
        if(node.aspect === FTAAspect.AND || node.aspect === FTAAspect.INHIBIT){
            for(const child of children){
                if(child.aspect === FTAAspect.COMPONENT || child.aspect === FTAAspect.CONDITION){
                    result = this.f([[child]], result);
                }else{
                    result = this.f(this.evaluate(child, allNodes, allEdges), result);
                }
            }
        //if the node is an or-gate we want to evaluate all children and add every single inner list to the result.
        }else if(node.aspect === FTAAspect.OR){
            for(const child of children){
                if(child.aspect === FTAAspect.COMPONENT){
                    const orList = [child];
                    result.push(orList);
                }else{
                    for(const list of this.evaluate(child, allNodes, allEdges)){  //push every inner list of the child gate.
                        result.push(list);
                    }
                }
            }
            //Above we say an or-gate fails when exactly one child fails but multiple children can fail too.
            result = this.generatePowerSet(result);
            result.splice(0,1); // Remove empty set


        //if the node is a kN-gate we want to get every combinations of the children with length k and after that evaluate the gates in the list.
        }else if(node.aspect === FTAAspect.KN){
            const k = node.k as number;
            const n = node.n as number;
            
            //Example: With Children:[M1,M2,G1] and k=2 -> [[M1,M2],[M1,G1],[M2,G1]] .
            const combinations:FTANode[][]=[];
            for(let i = k; i<=n; i++){
                for(const comb of this.getAllCombinations(children, i)){
                    combinations.push(comb);
                }
            }

            //Now we want to evaluate G1 (e.g evaluation(G1) = [[C]]).
            //Our result list should look like this -> [[M1,M2], [M1,C], [M2,C]].
            for(const comb of combinations){
                if(comb.some(e => e.aspect === FTAAspect.AND || e.aspect === FTAAspect.INHIBIT || e.aspect === FTAAspect.OR || e.aspect === FTAAspect.KN)){
                    const evaluatedLists = this.evaluateGateInCombinationList(comb, allNodes, allEdges);
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
     * @param allEdges All Edges in the graph.
     * @returns A list of lists that is the result of inserting the evaluation of the gates in the given list.  
     */
    evaluateGateInCombinationList(innerList: FTANode[], allNodes:FTANode[], allEdges:FTAEdge[]):FTANode[][]{
    
        let result:FTANode[][] = [];
        const restList:FTANode[] = innerList;

        for(let i = 0; i<restList.length; i++){ 
            const element = restList[i];
            //when the element is a gate.
            if(element.aspect === FTAAspect.AND || element.aspect === FTAAspect.INHIBIT || element.aspect === FTAAspect.OR || element.aspect === FTAAspect.KN){
                //cut out the gate from the rest list.
                const index = restList.indexOf(element);
                restList.splice(index, 1);
                i-=1;
                //and push the evaluation of the gate into the result list.
                const tempLists = this.f(this.evaluate(element, allNodes, allEdges), result);
                result = [];
                for(const list of tempLists){
                    result.push(list);
                }
                
            }
        }
        //concatenate every element of the rest list with the result (should only be components/conditions).
        for(const list of restList){
            result = this.f([[list]], result);
        }


        return result;

    }

    /**
     * Gets all combinations of the elements in the given list with length k. 
     * @param nodes The list of nodes we want the combinations of.
     * @param k The number of elements we want in an innerList.
     * @returns the combinations of the elements in the given list with length k.
     */
    getAllCombinations(nodes:FTANode[], k:number):FTANode[][]{ 
        const combinations:FTANode[][] = [];

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
            const currElement:FTANode = nodes[i];
            const restOfList = nodes.slice(i+1);
            for(const subComps of this.getAllCombinations(restOfList, k-1)){
                subComps.unshift(currElement);
                combinations.push(subComps); 
            } 
        }

        
        return combinations;
    }

    /**
     * Computes the power set of a set of sets to get all possible combinations for an or-gate.
     * @param sets Contains the children of the or-gate
     * @returns All possible combinations of the children.
     */
    generatePowerSet(sets:FTANode[][]):FTANode[][]{    
        const getPowerSet = (theArray: FTANode[][]): FTANode[][] => {
            return theArray.reduce((subsets: FTANode[][], values: FTANode[]) => {
              const newSubsets: FTANode[][] = [];
          
              
            for (const subset of subsets) {
                let newSet = values.concat(...subset);
                newSet = newSet.filter((e,i) => newSet.indexOf(e) === i);
                if(this.indexOfArray(newSet, subsets) === -1 && this.indexOfArray(newSet, newSubsets) === -1){
                    newSubsets.push(newSet);
                }
                
            }
              
          
              return subsets.concat(newSubsets);
            }, [[]]);
        };

        return getPowerSet(sets);
    }


    /**
     * Gets a node with its id from all nodes.
     * @param nodes All FtaNodes in the graph.
     * @param id The id of Node.
     * @returns an FTANode with the given id.
     */
    getNodeWithID(nodes: FTANode[], id: String): FTANode{
        for(const node of nodes){
            if(node.id === id){
                return node;
            }
        }
        const empty = {} as FTANode;
        return empty;
    }
    /**
     * Take an FTANode and return all its children(just the next hierarchy level).
     * @param parentNode The node we want the children of.
     * @param allNodes All FTANodes in the graph.
     * @param allEdges All FTAEdges in the graph.
     * @returns all children of the given parentNode.
     */
    getAllChildrenOfNode(parentNode: FTANode, allNodes: FTANode[], allEdges:FTAEdge[]): FTANode[]{
        const children: FTANode[] = [];
        for(const edge of allEdges){
            if(parentNode.id === edge.sourceId){
                children.push(this.getNodeWithID(allNodes, edge.targetId));
            }
        }
        return children;
    }

    /**
     * Sort condition so that components higher in the graph(lower level) will be processed first in the fta node array.
     * @param a The first FTANode to compare.
     * @param b The second FTANode to compare.
     * @returns The order of both nodes with the lower level one being first.
     */
    sortByLevel(a: FTANode, b: FTANode): number{
        if(a.level && b.level){
            if(a.level < b.level){
                return -1;
            }else if(a.level > b.level){
                return 1;
            }else if(a.id < b.id){
                return -1;
            }else if(a.id > b.id){
                return 1;
            }
            return 0;
            
        }
        return 0;
    }
    /**
     * Given all Nodes this method returns the first and only child of the topevent.
     * @param nodes All FtaNodes in the graph.
     * @param id All FTAEdges in the graph.
     * @returns the child of the topevent.
     */
    getChildOfTopEvent(allNodes:FTANode[], allEdges:FTAEdge[]): FTANode{
        let topEvent:FTANode = {} as FTANode;
        for(const node of allNodes){
            if(node.aspect === FTAAspect.TOPEVENT){
                topEvent = node;
            }
        }
        for(const edge of allEdges){
            if(edge.sourceId === topEvent.id){
                return this.getNodeWithID(allNodes, edge.targetId);
            }
        }

        const empty = {} as FTANode;
        return empty;
    }
    /**
     * Concatenates every inner List of two two-dimensional arrays .
     * @param a The first two-dimensional FTANode array.
     * @param b The second two-dimensional FTANode array.
     * @returns a two-dimensional array of type FTANode where every innerList of both arrays is concatenated.
     */
    f(a:FTANode[][], b:FTANode[][]):FTANode[][]{
        const result: FTANode[][] = [];

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
                if(this.indexOfArray(newSet, result) === -1){
                    result.push(newSet);
                }

            }
        }
        
        return result;
        
    }
    /**
     * Checks if array a and b are equal,
     * @param a The first array we want to compare.
     * @param b The second array we want to compaare.
     * @returns True if they are equal and false if not.
     */
    arrayEquals(a:FTANode[], b:FTANode[]):boolean{
        const sortedA = a.sort((x,y) => this.sortByLevel(x,y));
        const sortedB = b.sort((x,y) => this.sortByLevel(x,y));
        return a.length === b.length && sortedA.every((e,i) => e === sortedB[i]);
    }

    /**
     * Gets the index of a list in a two-dimensional list of FTANodes, -1 otherwise.
     * @param a The list we want the index of.
     * @param b The two-dimensional list of FTANodes we want to search in.
     * @returns the index of the list.
     */
    indexOfArray(a:FTANode[], b:FTANode[][]):number{
        let i = 0;
        for(const list of b){
            if(this.arrayEquals(a, list)){
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
