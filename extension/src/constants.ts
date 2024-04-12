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

/** Extension ID corresponding to the name property in the package.json */
export const extensionId = "pasta";

const withPrefix = (name: string): string => `${extensionId}.${name}`;

/** Commands that are registered by this extension for other extensions.*/
export const command = {
    getLTLFormula: withPrefix("getLTLFormula"),
    // sendModelCheckerResult: withPrefix("sendModelCheckerResult"),
};
