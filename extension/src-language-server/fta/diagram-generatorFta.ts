import { AstNode } from 'langium';
import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SModelRoot, SLabel, SModelElement } from 'sprotty-protocol';
import { isTopEvent, isGate, isComponent, Model } from '../generated/ast';


export class FtaDiagramGenerator extends LangiumDiagramGenerator{


    protected generateRoot(args: GeneratorContext<Model>): SModelRoot {

        return {
            type: 'graph',
            id: 'root',
        }
    }
}