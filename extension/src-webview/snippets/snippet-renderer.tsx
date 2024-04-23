/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

/** @jsx html */
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { IModelFactory, ModelRenderer, SGraph, SNode, TYPES, html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Bounds } from 'sprotty-protocol';
import { WebviewSnippet } from "./snippet-models";


/** Renderer that is capable of rendering snippets to jsx. */
@injectable()
export class SnippetRenderer {
    @inject(TYPES.IModelFactory) protected modelFactory: IModelFactory;
    protected renderer: ModelRenderer;
    protected bounds: Bounds;

    setRenderer(renderer: ModelRenderer): void {
        this.renderer = renderer;
    }

    setBounds(bounds: Bounds): void {
        this.bounds = bounds;
    }

    /**
     * Renders all snippets provided by the server.
     */
    renderSnippets(snippets: WebviewSnippet[]): VNode[] {
        if (snippets.length === 0) return <div></div>;

        // labels and edges are only visible if they are within the canvas bounds
        for (const snippet of snippets) {
            (snippet.graph as SGraph).canvasBounds = { width: this.bounds.width + 20, height: this.bounds.height, x: this.bounds.x, y: this.bounds.y };
        }

        const res = snippets.map(snippet => {
            const graph = this.renderer?.renderElement(this.modelFactory.createRoot(snippet.graph));
            // padding of sidebar content is 16px
            const width = ((snippet.graph as SGraph).children[0] as SNode).size.width + 30;
            const height = ((snippet.graph as SGraph).children[0] as SNode).size.height + 30;
            if (graph?.data?.attrs) {
                graph.data.attrs["width"] = width;
                graph.data.attrs["height"] = height;
                graph.data.attrs["id"] = snippet.id;
            }
            const result: VNode = <div>{graph}</div>;
            return result;
        });
        return res;
    }

}
