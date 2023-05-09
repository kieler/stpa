import { GeneratorContext, LangiumDiagramGenerator } from 'langium-sprotty';
import { SModelRoot } from 'sprotty-protocol';
import { ModelFTA } from '../generated/ast';


export class FtaDiagramGenerator extends LangiumDiagramGenerator{


    protected generateRoot(args: GeneratorContext<ModelFTA>): SModelRoot {

        return {
            type: 'graph',
            id: 'root',
        }
    }
}