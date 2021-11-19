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
import { SModelElement, SModelExtension, MouseListener, Action, SModelElementSchema } from "sprotty";
import { Range } from "vscode-languageserver-protocol";
import { URI } from 'vscode-uri';
export interface Traceable extends SModelExtension {
    trace: string;
}
export declare function isTraceable<T extends SModelElement | SModelElementSchema>(element: T): element is Traceable & T;
export declare function getRange(traceable: Traceable): Range;
export declare function getRange(trace: string): Range | undefined;
export declare function getRange(trace: object): Range | undefined;
export declare function getURI(traceable: Traceable): URI;
export declare class TraceableMouseListener extends MouseListener {
    doubleClick(target: SModelElement, event: WheelEvent): (Action | Promise<Action>)[];
}
//# sourceMappingURL=traceable.d.ts.map