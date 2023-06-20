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

import { injectable } from "inversify";
import { SModelRoot, SNode, SvgExporter } from "sprotty";
import { RequestAction } from "sprotty-protocol";
import { SvgAction } from "./actions";

@injectable()
export class CustomSvgExporter extends SvgExporter {

    internalExport(root: SModelRoot, request?: RequestAction<SvgAction>): void {
        if (typeof document !== 'undefined') {
            const div = document.getElementById(this.options.hiddenDiv);
            if (div !== null && div.firstElementChild && div.firstElementChild.tagName === 'svg') {
                const svgElement = div.firstElementChild as SVGSVGElement;
                const svg = this.createSvg(svgElement, root);
                const width = Math.max((root.children[0] as SNode).bounds.width, (root.children[1] as SNode).bounds.width);
                this.actionDispatcher.dispatch(SvgAction.create(svg, width, request ? request.requestId : ''));
            }
        }
    }

}
