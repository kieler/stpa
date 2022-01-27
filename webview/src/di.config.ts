/********************************************************************************
 * Copyright (c) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import '../css/diagram.css';
import 'sprotty/css/sprotty.css';

import { Container, ContainerModule } from 'inversify';
import {
    configureModelElement, ConsoleLogger, HtmlRoot,
    HtmlRootView, LogLevel, overrideViewerOptions, PreRenderedElement,
    PreRenderedView, SGraphView, SLabelView,
    TYPES, loadDefaultModules, SGraph, SLabel, SNode, SEdge
} from 'sprotty';
import { PolylineArrowEdgeView, STPANodeView, CSNodeView } from './views';
import { EDGE_TYPE, STPA_NODE_TYPE, STPANode, PARENT_TYPE, CSEdge, CS_EDGE_TYPE, CSNode, CS_NODE_TYPE} from './stpa-model';
import { Options } from './options';

const stpaDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    bind(Options).toSelf().inSingletonScope();

    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', SGraph, SGraphView);
    configureModelElement(context, CS_NODE_TYPE, CSNode, CSNodeView);
    configureModelElement(context, STPA_NODE_TYPE, STPANode, STPANodeView);
    configureModelElement(context, PARENT_TYPE, SNode, CSNodeView);
    configureModelElement(context, 'label', SLabel, SLabelView);
    configureModelElement(context, 'label:xref', SLabel, SLabelView);
    configureModelElement(context, EDGE_TYPE, SEdge, PolylineArrowEdgeView);
    configureModelElement(context, CS_EDGE_TYPE, CSEdge, PolylineArrowEdgeView);
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView);
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView);
});

export function createSTPADiagramContainer(widgetId: string): Container {
    const container = new Container();
    loadDefaultModules(container);
    container.load(stpaDiagramModule);
    overrideViewerOptions(container, {
        needsClientLayout: true,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });
    return container;
}
