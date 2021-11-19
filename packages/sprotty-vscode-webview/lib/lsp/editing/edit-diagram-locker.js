"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
var inversify_1 = require("inversify");
var sprotty_1 = require("sprotty");
/**
 * An `IDiagramLocker` for language-server based editable diagrams.
 *
 * Prevents displatching of edit actions when editing is disallowed, e.g.
 * because the LS's status is fatal.
 */
var EditDiagramLocker = /** @class */ (function () {
    function EditDiagramLocker() {
        this.nonEditActions = [
            sprotty_1.SetModelAction.KIND, sprotty_1.UpdateModelAction.KIND,
            sprotty_1.CenterAction.KIND, sprotty_1.FitToScreenAction.KIND, sprotty_1.SetViewportAction.KIND,
            sprotty_1.SelectAction.KIND, sprotty_1.SelectAllAction.KIND,
            sprotty_1.HoverFeedbackAction.KIND, sprotty_1.RequestPopupModelAction.KIND, sprotty_1.SetPopupModelAction.KIND,
            sprotty_1.ServerStatusAction.KIND
        ];
        this.allowEdit = true;
    }
    EditDiagramLocker.prototype.isAllowed = function (action) {
        return this.allowEdit || this.nonEditActions.indexOf(action.kind) >= 0;
    };
    EditDiagramLocker = __decorate([
        inversify_1.injectable()
    ], EditDiagramLocker);
    return EditDiagramLocker;
}());
exports.EditDiagramLocker = EditDiagramLocker;
//# sourceMappingURL=edit-diagram-locker.js.map