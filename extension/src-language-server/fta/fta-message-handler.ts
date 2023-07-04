import { Connection, URI } from "vscode-languageserver";
import { FtaServices } from './fta-module';
import { LangiumSprottySharedServices } from "langium-sprotty";
import { FtaDiagramGenerator } from "./fta-diagram-generator";



let lastUri: URI;

/**
 * Adds handlers for notifications regarding fta.
 * @param connection 
 * @param stpaServices 
 */
export function addFTANotificationHandler(connection: Connection, ftaServices: FtaServices, sharedServices: LangiumSprottySharedServices): void {
    addGenerateCutSetsHandler(connection, ftaServices);
    addGenerateMinimalCutSetsHandler(connection, ftaServices);
}

/**
 * Adds handlers for requests regarding the cut sets.
 * @param connection 
 * @param ftaServices 
 */
function addGenerateCutSetsHandler(connection: Connection, ftaServices: FtaServices):void{  
    connection.onRequest('generate/getCutSets', uri =>{
        lastUri = uri;
        const diagramGenerator = (ftaServices.diagram.DiagramGenerator) as FtaDiagramGenerator;
        const nodes = diagramGenerator.getNodes();
        const edges = diagramGenerator.getEdges();

        const cutSets = ftaServices.bdd.Bdd.generateCutSets(nodes, edges);
        return cutSets;
    }); 
   
}

/**
 * Adds handlers for requests regarding the minimal cut sets.
 * @param connection 
 * @param ftaServices 
 */
function addGenerateMinimalCutSetsHandler(connection: Connection, ftaServices: FtaServices):void{
    connection.onRequest('generate/getMinimalCutSets', uri =>{
        lastUri = uri;
        const diagramGenerator = (ftaServices.diagram.DiagramGenerator) as FtaDiagramGenerator;
        const nodes = diagramGenerator.getNodes();
        const edges = diagramGenerator.getEdges();
        const minimalCutSets = ftaServices.bdd.Bdd.determineMinimalCutSet(nodes, edges);
        return minimalCutSets;
    });
}

