"use strict";
/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var inversify_1 = require("inversify");
var sprotty_1 = require("sprotty");
var editing_1 = require("sprotty-vscode-protocol/lib/lsp/editing");
var traceable_1 = require("./traceable");
var DeleteWithWorkspaceEditCommand = /** @class */ (function (_super) {
    __extends(DeleteWithWorkspaceEditCommand, _super);
    function DeleteWithWorkspaceEditCommand(action) {
        var _this = _super.call(this) || this;
        _this.action = action;
        return _this;
    }
    DeleteWithWorkspaceEditCommand.prototype.createWorkspaceEdit = function (context) {
        var _this = this;
        var elements = new Set();
        var index = context.root.index;
        index.all().forEach(function (e) {
            if (e && _this.shouldDelete(e))
                elements.add(e);
            else if (e instanceof sprotty_1.SEdge && traceable_1.isTraceable(e)) {
                var source = index.getById(e.sourceId);
                var target = index.getById(e.targetId);
                if (_this.shouldDeleteParent(source)
                    || _this.shouldDeleteParent(target))
                    elements.add(e);
            }
        });
        var uri2ranges = new Map();
        elements.forEach(function (element) {
            var uri = traceable_1.getURI(element).toString(true);
            var range = traceable_1.getRange(element);
            var ranges = uri2ranges.get(uri);
            if (!ranges) {
                ranges = [];
                uri2ranges.set(uri, ranges);
            }
            var mustAdd = true;
            for (var i = 0; i < ranges.length; ++i) {
                var r = ranges[i];
                if (_this.containsRange(r, range)) {
                    mustAdd = false;
                    break;
                }
                else if (_this.containsRange(range, r)) {
                    mustAdd = false;
                    ranges[i] = range;
                    break;
                }
            }
            if (mustAdd)
                ranges.push(range);
        });
        var changes = {};
        uri2ranges.forEach(function (ranges, uri) {
            changes[uri] = ranges.map(function (range) {
                return {
                    range: range,
                    newText: ''
                };
            });
        });
        var workspaceEdit = {
            changes: changes
        };
        return workspaceEdit;
    };
    DeleteWithWorkspaceEditCommand.prototype.containsRange = function (range, otherRange) {
        if (otherRange.start.line < range.start.line || otherRange.end.line < range.start.line) {
            return false;
        }
        if (otherRange.start.line > range.end.line || otherRange.end.line > range.end.line) {
            return false;
        }
        if (otherRange.start.line === range.start.line && otherRange.start.character < range.start.character) {
            return false;
        }
        if (otherRange.end.line === range.end.line && otherRange.end.character > range.end.character) {
            return false;
        }
        return true;
    };
    DeleteWithWorkspaceEditCommand.prototype.shouldDelete = function (e) {
        return sprotty_1.isSelectable(e) && e.selected && traceable_1.isTraceable(e);
    };
    DeleteWithWorkspaceEditCommand.prototype.shouldDeleteParent = function (source) {
        while (source) {
            if (this.shouldDelete(source)) {
                return true;
            }
            source = (source instanceof sprotty_1.SChildElement) ? source.parent : undefined;
        }
        return false;
    };
    DeleteWithWorkspaceEditCommand.prototype.execute = function (context) {
        this.actionDispatcher.dispatch({
            kind: editing_1.WorkspaceEditAction.KIND,
            workspaceEdit: this.createWorkspaceEdit(context)
        });
        return context.root;
    };
    DeleteWithWorkspaceEditCommand.prototype.undo = function (context) {
        return context.root;
    };
    DeleteWithWorkspaceEditCommand.prototype.redo = function (context) {
        return context.root;
    };
    DeleteWithWorkspaceEditCommand.KIND = editing_1.DeleteWithWorkspaceEditAction.KIND;
    __decorate([
        inversify_1.inject(sprotty_1.TYPES.IActionDispatcher),
        __metadata("design:type", Object)
    ], DeleteWithWorkspaceEditCommand.prototype, "actionDispatcher", void 0);
    DeleteWithWorkspaceEditCommand = __decorate([
        inversify_1.injectable(),
        __param(0, inversify_1.inject(sprotty_1.TYPES.Action)),
        __metadata("design:paramtypes", [Object])
    ], DeleteWithWorkspaceEditCommand);
    return DeleteWithWorkspaceEditCommand;
}(sprotty_1.Command));
exports.DeleteWithWorkspaceEditCommand = DeleteWithWorkspaceEditCommand;
//# sourceMappingURL=delete-with-workspace-edit.js.map