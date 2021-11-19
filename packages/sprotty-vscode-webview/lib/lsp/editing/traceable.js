"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var sprotty_1 = require("sprotty");
var vscode_uri_1 = require("vscode-uri");
function isTraceable(element) {
    return !!element.trace && !!getRange(element.trace);
}
exports.isTraceable = isTraceable;
function getRange(thing) {
    var trace = typeof thing === 'string'
        ? thing
        : thing.trace;
    if (!trace)
        return undefined;
    var query = vscode_uri_1.URI.parse(trace).query;
    var numbers = query.split(/[:-]/).map(function (s) { return parseInt(s, 10); });
    if (numbers.length !== 4 || numbers.find(isNaN) !== undefined)
        return undefined;
    return {
        start: {
            line: numbers[0],
            character: numbers[1]
        },
        end: {
            line: numbers[2],
            character: numbers[3]
        }
    };
}
exports.getRange = getRange;
function getURI(traceable) {
    return vscode_uri_1.URI.parse(traceable.trace).with({
        query: null,
        fragment: null
    });
}
exports.getURI = getURI;
var TraceableMouseListener = /** @class */ (function (_super) {
    __extends(TraceableMouseListener, _super);
    function TraceableMouseListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TraceableMouseListener.prototype.doubleClick = function (target, event) {
        var traceable = sprotty_1.findParent(target, function (element) { return isTraceable(element); });
        if (traceable)
            return [new sprotty_1.OpenAction(traceable.id)];
        else
            return [];
    };
    return TraceableMouseListener;
}(sprotty_1.MouseListener));
exports.TraceableMouseListener = TraceableMouseListener;
//# sourceMappingURL=traceable.js.map