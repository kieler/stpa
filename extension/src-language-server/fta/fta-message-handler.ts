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

import { Connection } from "vscode-languageserver";
import { FtaDiagramGenerator } from "./fta-diagram-generator";
import { FtaServices } from './fta-module';
import { cutSetToString, minimalCutSetToString } from './fta-utils';


/**
 * Adds handlers for notifications regarding fta.
 * @param connection 
 * @param ftaServices 
 */
export function addFTANotificationHandler(connection: Connection, ftaServices: FtaServices): void {
    addCutSetsHandler(connection, ftaServices);

}


/**
 * Adds handlers for requests regarding the cut sets.
 * @param connection 
 * @param ftaServices 
 */
function addCutSetsHandler(connection: Connection, ftaServices: FtaServices):void{
    connection.onRequest('generate/getCutSets', () =>{
        const diagramGenerator = (ftaServices.diagram.DiagramGenerator) as FtaDiagramGenerator;
        const nodes = diagramGenerator.getNodes();
        const idCache = diagramGenerator.getCache();

        const cutSets = ftaServices.bdd.Bdd.generateCutSets(nodes, idCache);
        const cutSetsToString = cutSetToString(cutSets, idCache);

        return cutSetsToString;
    }); 

    connection.onRequest('generate/getMinimalCutSets', () =>{
        const diagramGenerator = (ftaServices.diagram.DiagramGenerator) as FtaDiagramGenerator;
        const nodes = diagramGenerator.getNodes();
        const idCache = diagramGenerator.getCache();
        
        const minimalCutSets = ftaServices.bdd.Bdd.determineMinimalCutSet(nodes, idCache);
        const minCutSetToString = minimalCutSetToString(minimalCutSets, idCache);
        
        return minCutSetToString;
    });
}

