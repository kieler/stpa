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

import { ContainerModule } from "inversify";
import { ContextMenuProviderRegistry, IContextMenuService, TYPES } from "sprotty";
import { PastaContextMenuMouseListener } from "./context-menu-mouse-listener";

const pastaContextMenuModule = new ContainerModule(bind => {
    bind(TYPES.IContextMenuServiceProvider).toProvider<IContextMenuService>(ctx => {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        return () => {
            return new Promise<IContextMenuService>((resolve, reject) => {
                if (ctx.container.isBound(TYPES.IContextMenuService)) {
                    resolve(ctx.container.get<IContextMenuService>(TYPES.IContextMenuService));
                } else {
                    reject();
                }
            });
        };
    });
    bind(PastaContextMenuMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(PastaContextMenuMouseListener);
    bind(TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);
});

export default pastaContextMenuModule;
