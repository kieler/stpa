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
    TYPES, loadDefaultModules, SGraph, SLabel, SNode, SEdge, ModelViewer, RectangularNodeView
} from 'sprotty';
import { PolylineArrowEdgeView, STPANodeView, CSNodeView, STPAGraphView } from './views';
import { STPA_EDGE_TYPE, STPA_NODE_TYPE, STPANode, PARENT_TYPE, CSEdge, CS_EDGE_TYPE, CSNode, CS_NODE_TYPE } from './stpa-model';
import { sidebarModule } from './sidebar';
import { optionsModule } from './options/options-module';
import { StpaModelViewer } from './model-viewer';
import { StpaMouseListener } from './stpa-mouselistener';

const stpaDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    bind(TYPES.MouseListener).to(StpaMouseListener).inSingletonScope();
    rebind(ModelViewer).to(StpaModelViewer).inSingletonScope();

    // configure the diagram elements
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', SGraph, STPAGraphView);
    configureModelElement(context, 'node', SNode, RectangularNodeView);
    configureModelElement(context, CS_NODE_TYPE, CSNode, CSNodeView);
    configureModelElement(context, STPA_NODE_TYPE, STPANode, STPANodeView);
    configureModelElement(context, PARENT_TYPE, SNode, CSNodeView);
    configureModelElement(context, 'label', SLabel, SLabelView);
    configureModelElement(context, 'label:xref', SLabel, SLabelView);
    configureModelElement(context, 'edge', SEdge, PolylineArrowEdgeView);
    configureModelElement(context, STPA_EDGE_TYPE, SEdge, PolylineArrowEdgeView);
    configureModelElement(context, CS_EDGE_TYPE, CSEdge, PolylineArrowEdgeView);
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView);
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView);
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
