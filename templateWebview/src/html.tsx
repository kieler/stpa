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
import { html } from './jsx';
import { VNode } from 'snabbdom';

export const templatesID = 'templates'

export const panel: VNode = <div class-sidebar__content="true">
    <h3 class-sidebar__title="true">{"Templates"}</h3>
    <div class-sidebar__panel-content="true" id={templatesID}></div>
</div>;
