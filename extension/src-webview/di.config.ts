/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

import './css/diagram.css';
import 'sprotty/css/sprotty.css';

import { Container, ContainerModule } from 'inversify';
import {
    configureModelElement, ConsoleLogger, HtmlRoot,
    HtmlRootView, LogLevel, overrideViewerOptions, PreRenderedElement,
    PreRenderedView, SLabelView,
    TYPES, loadDefaultModules, SGraph, SLabel, SNode, SEdge, ModelViewer
} from 'sprotty';
import { PolylineArrowEdgeView, STPANodeView, CSNodeView, STPAGraphView } from './views';
import { STPA_EDGE_TYPE, STPA_NODE_TYPE, STPANode, PARENT_TYPE, CSEdge, CS_EDGE_TYPE, CSNode, CS_NODE_TYPE } from './stpa-model';
import { sidebarModule } from './sidebar';
import { optionsModule } from './options/options-module';
import { StpaModelViewer} from './model-viewer';
import { StpaMouseListener } from './stpa-mouselistener';
import { FTAEdge, FTANode, FTA_EDGE_TYPE, FTA_NODE_TYPE, TREE_TYPE} from './fta-model';
import { FTAGraphView, FTANodeView, PolylineArrowEdgeViewFTA } from './fta-views';

const stpaDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    rebind(TYPES.CommandStackOptions).toConstantValue({
        // Override the default animation speed to be 700 ms, as the default value is too quick.
        defaultDuration: 700,
        undoHistoryLimit: 50
    });
    bind(TYPES.MouseListener).to(StpaMouseListener).inSingletonScope();
    rebind(ModelViewer).to(StpaModelViewer).inSingletonScope();

    // configure the diagram elements
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', SGraph, STPAGraphView);
    configureModelElement(context, CS_NODE_TYPE, CSNode, CSNodeView);
    configureModelElement(context, STPA_NODE_TYPE, STPANode, STPANodeView);
    configureModelElement(context, PARENT_TYPE, SNode, CSNodeView);
    configureModelElement(context, 'label', SLabel, SLabelView);
    configureModelElement(context, 'label:xref', SLabel, SLabelView);
    configureModelElement(context, STPA_EDGE_TYPE, SEdge, PolylineArrowEdgeView);
    configureModelElement(context, CS_EDGE_TYPE, CSEdge, PolylineArrowEdgeView);
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView);
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView);
    
    //FTA
    configureModelElement(context, TREE_TYPE, SNode, FTAGraphView);
    configureModelElement(context, FTA_EDGE_TYPE, FTAEdge, PolylineArrowEdgeViewFTA);
    configureModelElement(context, FTA_NODE_TYPE, FTANode, FTANodeView);
});

export function createSTPADiagramContainer(widgetId: string): Container {
    const container = new Container();
    loadDefaultModules(container);
    container.load(stpaDiagramModule, sidebarModule, optionsModule);
    overrideViewerOptions(container, {
        needsClientLayout: true,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });
    return container;
}
