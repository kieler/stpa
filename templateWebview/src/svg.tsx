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

/** @jsx svg */
import { attributesModule, classModule, eventListenersModule, init, propsModule, styleModule } from 'snabbdom';
import { svg } from './jsx';

export const patch = init([
    // Init patch function with chosen modules
    classModule, // makes it easy to toggle classes
    propsModule, // for setting properties on DOM elements
    styleModule, // handles styling on elements with support for animations
    eventListenersModule, // attaches event listeners
    attributesModule // for using attributes on svg elements
]);

export const testNode2 = <svg id="stpa-diagram_0_simpleCSTemplate" tabindex="0" width="214.59830729166666" height="179" class-sprotty-graph="true">
    <g transform="scale(1) translate(0,0)">
        <g id="stpa-diagram_0_controlStructure" transform="translate(12, 12)" class-parent="true">
            <rect x="0" y="0" width="184.59830729166666" height="149" class-parent-node="true" class-sprotty-node="true"> </rect>
            <g id="stpa-diagram_0_Controller" transform="translate(44.253255208333336, 12)" class-cs="true">
                <rect x="0" y="0" width="72.025390625" height="35" class-sprotty-node="true"> </rect>
                <text class-label="true" class-sprotty-label="true" id="stpa-diagram_0_Controller.label" transform="translate(5, 10) translate(0, 12)">Controller</text>
            </g>
            <g id="stpa-diagram_0_ControlledProcess" transform="translate(27.68994140625, 102)" class-cs="true">
                <rect x="0" y="0" width="121.71533203125" height="35" class-sprotty-node="true"> </rect>
                <text class-label="true" class-sprotty-label="true" id="stpa-diagram_0_ControlledProcess.label" transform="translate(5, 10) translate(0, 12)">ControlledProcess</text>
            </g>
            <g id="stpa-diagram_0_Controller:ca:ControlledProcess" class-sprotty-edge="true" class-controlStructure="true">
                <path d="M 92.27018229166666,47 L 92.27018229166666,92 L 108.83349609375,92 L 108.83349609375,102" class-stpa-edge="true"></path><path d="M 6,-3 L 0,0 L 6,3 Z" transform="rotate(-90 108.83349609375 102) translate(108.83349609375 102)" class-sprotty-edge-arrow="true">

                </path>
                <text class-xref="true" class-sprotty-label="true" id="stpa-diagram_0_Controller:ca:ControlledProcess.label" transform="translate(95.27018229166666, 67) translate(0, 12)">control action</text>
            </g>
            <g id="stpa-diagram_0_ControlledProcess:fb:Controller" class-sprotty-edge="true" class-controlStructure="true">
                <path d="M 68.26171875,102 L 68.26171875,47" class-stpa-edge="true"></path>
                <path d="M 6,-3 L 0,0 L 6,3 Z" transform="rotate(90 68.26171875 47) translate(68.26171875 47)" class-sprotty-edge-arrow="true"></path>
                <text class-xref="true" class-sprotty-label="true" id="stpa-diagram_0_ControlledProcess:fb:Controller.label" transform="translate(12, 67) translate(1, 12)">feedback</text>
            </g>
        </g>
    </g>
</svg>;

export const testNode = <div class-sidebar__content="true">
    {/*     <div class="sidebar__toggle-container">
        <button title="General" class="sidebar__toggle-button">
            <svg class="feather feather-settings" style="width: 24px; height: 24px; fill: none; stroke: currentcolor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        </button>
        <button title="Options" class="sidebar__toggle-button">
            <svg class="feather feather-sliders" style="width: 24px; height: 24px; fill: none; stroke: currentcolor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
        </button>
        <button title="Templates" class="sidebar__toggle-button sidebar__toggle-button--active">
            <svg class="feather feather-code" style="width: 24px; height: 24px; fill: none; stroke: currentcolor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
        </button>
    </div> */}
    <h3 class-sidebar__title="true">Templates</h3>
    <div class-sidebar__panel-content="true">
        <div>
            <svg id="stpa-diagram_0_simpleCSTemplate" tabindex="0" width="214.59830729166666" height="179" class-sprotty-graph="true">
                <g transform="scale(1) translate(0,0)">
                    <g id="stpa-diagram_0_controlStructure" transform="translate(12, 12)" class-parent="true">
                        <rect x="0" y="0" width="184.59830729166666" height="149" class-parent-node="true" class-sprotty-node="true"> </rect>
                        <g id="stpa-diagram_0_Controller" transform="translate(44.253255208333336, 12)" class-cs="true">
                            <rect x="0" y="0" width="72.025390625" height="35" class-sprotty-node="true"> </rect>
                            <text class-label="true" class-sprotty-label="true" id="stpa-diagram_0_Controller.label" transform="translate(5, 10) translate(0, 12)">Controller</text>
                        </g>
                        <g id="stpa-diagram_0_ControlledProcess" transform="translate(27.68994140625, 102)" class-cs="true">
                            <rect x="0" y="0" width="121.71533203125" height="35" class-sprotty-node="true"> </rect>
                            <text class-label="true" class-sprotty-label="true" id="stpa-diagram_0_ControlledProcess.label" transform="translate(5, 10) translate(0, 12)">ControlledProcess</text>
                        </g>
                        <g id="stpa-diagram_0_Controller:ca:ControlledProcess" class-sprotty-edge="true" class-controlStructure="true">
                            <path d="M 92.27018229166666,47 L 92.27018229166666,92 L 108.83349609375,92 L 108.83349609375,102" class-stpa-edge="true"></path><path d="M 6,-3 L 0,0 L 6,3 Z" transform="rotate(-90 108.83349609375 102) translate(108.83349609375 102)" class-sprotty-edge-arrow="true">

                            </path>
                            <text class-xref="true" class-sprotty-label="true" id="stpa-diagram_0_Controller:ca:ControlledProcess.label" transform="translate(95.27018229166666, 67) translate(0, 12)">control action</text>
                        </g>
                        <g id="stpa-diagram_0_ControlledProcess:fb:Controller" class-sprotty-edge="true" class-controlStructure="true">
                            <path d="M 68.26171875,102 L 68.26171875,47" class-stpa-edge="true"></path>
                            <path d="M 6,-3 L 0,0 L 6,3 Z" transform="rotate(90 68.26171875 47) translate(68.26171875 47)" class-sprotty-edge-arrow="true"></path>
                            <text class-xref="true" class-sprotty-label="true" id="stpa-diagram_0_ControlledProcess:fb:Controller.label" transform="translate(12, 67) translate(1, 12)">feedback</text>
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    </div>
</div>;