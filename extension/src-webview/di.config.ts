/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import "sprotty/css/sprotty.css";
import "./css/diagram.css";

import { Container, ContainerModule } from "inversify";
import {
    ConsoleLogger,
    HtmlRoot,
    HtmlRootView,
    LogLevel,
    ModelViewer,
    PreRenderedElement,
    PreRenderedView,
    SGraph,
    SLabel,
    SLabelView,
    SNode,
    TYPES,
    configureCommand,
    configureModelElement,
    loadDefaultModules,
    overrideViewerOptions,
} from "sprotty";
import { SvgCommand } from "./actions";
import { SvgPostprocessor } from "./exportPostProcessor";
import { CustomSvgExporter } from "./exporter";
import { DescriptionNode, FTAEdge, FTANode, FTAPort, FTA_DESCRIPTION_NODE_TYPE, FTA_EDGE_TYPE, FTA_GRAPH_TYPE, FTA_INVISIBLE_EDGE_TYPE, FTA_NODE_TYPE, FTA_PORT_TYPE } from "./fta/fta-model";
import { DescriptionNodeView, FTAGraphView, FTAInvisibleEdgeView, FTANodeView, PolylineArrowEdgeViewFTA } from "./fta/fta-views";
import { PastaModelViewer } from "./model-viewer";
import { optionsModule } from "./options/options-module";
import { sidebarModule } from "./sidebar";
import {
    CSEdge,
    CSNode,
    CS_EDGE_TYPE,
    CS_NODE_TYPE,
    DUMMY_NODE_TYPE,
    PARENT_TYPE,
    STPAEdge,
    STPANode,
    STPAPort,
    STPA_EDGE_TYPE,
    STPA_INTERMEDIATE_EDGE_TYPE,
    STPA_NODE_TYPE,
    STPA_PORT_TYPE,
} from "./stpa/stpa-model";
import { StpaMouseListener } from "./stpa/stpa-mouselistener";
import {
    CSNodeView,
    IntermediateEdgeView,
    PolylineArrowEdgeView,
    PortView,
    STPAGraphView,
    STPANodeView,
} from "./stpa/stpa-views";

const pastaDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    rebind(TYPES.CommandStackOptions).toConstantValue({
        // Override the default animation speed to be 700 ms, as the default value is too quick.
        defaultDuration: 700,
        undoHistoryLimit: 50,
    });
    bind(TYPES.MouseListener).to(StpaMouseListener).inSingletonScope();
    rebind(ModelViewer).to(PastaModelViewer).inSingletonScope();
    rebind(TYPES.SvgExporter).to(CustomSvgExporter).inSingletonScope();
    bind(SvgPostprocessor).toSelf().inSingletonScope();
    bind(TYPES.HiddenVNodePostprocessor).toService(SvgPostprocessor);
    configureCommand({ bind, isBound }, SvgCommand);

    // configure the diagram elements
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, "label", SLabel, SLabelView);
    configureModelElement(context, "label:xref", SLabel, SLabelView);
    configureModelElement(context, "html", HtmlRoot, HtmlRootView);
    configureModelElement(context, "pre-rendered", PreRenderedElement, PreRenderedView);

    // STPA
    configureModelElement(context, "graph", SGraph, STPAGraphView);
    configureModelElement(context, DUMMY_NODE_TYPE, CSNode, CSNodeView);
    configureModelElement(context, CS_NODE_TYPE, CSNode, CSNodeView);
    configureModelElement(context, STPA_NODE_TYPE, STPANode, STPANodeView);
    configureModelElement(context, PARENT_TYPE, SNode, CSNodeView);
    configureModelElement(context, STPA_EDGE_TYPE, STPAEdge, PolylineArrowEdgeView);
    configureModelElement(context, STPA_INTERMEDIATE_EDGE_TYPE, STPAEdge, IntermediateEdgeView);
    configureModelElement(context, CS_EDGE_TYPE, CSEdge, PolylineArrowEdgeView);
    configureModelElement(context, STPA_PORT_TYPE, STPAPort, PortView);

    // FTA
    configureModelElement(context, FTA_EDGE_TYPE, FTAEdge, PolylineArrowEdgeViewFTA);
    configureModelElement(context, FTA_INVISIBLE_EDGE_TYPE, FTAEdge, FTAInvisibleEdgeView);
    configureModelElement(context, FTA_NODE_TYPE, FTANode, FTANodeView);
    configureModelElement(context, FTA_DESCRIPTION_NODE_TYPE, DescriptionNode, DescriptionNodeView);
    configureModelElement(context, FTA_GRAPH_TYPE, SGraph, FTAGraphView);
    configureModelElement(context, FTA_PORT_TYPE, FTAPort, PortView);
});

export function createPastaDiagramContainer(widgetId: string): Container {
    const container = new Container();
    loadDefaultModules(container);
    container.load(pastaDiagramModule, sidebarModule, optionsModule);
    overrideViewerOptions(container, {
        needsClientLayout: true,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: widgetId + "_hidden",
    });
    return container;
}
