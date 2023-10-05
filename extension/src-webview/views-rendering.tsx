/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
import { VNode } from 'snabbdom';
import { SNode, svg } from 'sprotty';

/**
 * Creates a circle for {@code node}.
 * @param node The node that should be represented by a circle.
 * @returns A circle for {@code node}.
 */
export function renderOval(node: SNode): VNode {
    const nodeWidth = node.size.width < node.size.height ? node.size.height : node.size.width;
    return <ellipse cx={Math.max(node.size.width, 0) / 2.0}
        cy={Math.max(node.size.height, 0) / 2.0}
        rx={Math.max(nodeWidth, 0) / 2.0}
        ry={Math.max(node.size.height, 0) / 2.0} />;
    /* return <circle
        r={Math.max(node.size.width, 0) / 2.0}
        cx={Math.max(node.size.width, 0) / 2.0} cy={Math.max(node.size.height, 0) / 2.0}
    />; */
}

/**
 * Creates a rectangle for {@code node}.
 * @param node The node that should be represented by a rectangle.
 * @returns A rectangle for {@code node}.
 */
export function renderRectangle(node: SNode): VNode {
    return <rect
        x="0" y="0"
        width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
    />;
}

/**
 * Creates a rounded rectangle for {@code node}.
 * @param node The node that should be represented by a rounded rectangle.
 * @returns A rounded rectangle for {@code node}.
 */
export function renderRoundedRectangle(node: SNode): VNode {
    return <rect
        x="0" y="0"
        rx="5" ry="5"
        width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
    />;
}


/**
 * Creates a triangle for {@code node}.
 * @param node The node that should be represented by a triangle.
 * @returns A triangle for {@code node}.
 */
export function renderTriangle(node: SNode): VNode {
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const botY = Math.max(node.size.height, 0);
    const topY = 0;
    const d = 'M' + leftX + " " + botY + " L " + midX + " " + topY + " L " + rightX + " " + botY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates a mirrored triangle for {@code node}.
 * @param node The node that should be represented by a mirrored triangle.
 * @returns A mrrored triangle for {@code node}.
 */
export function renderMirroredTriangle(node: SNode): VNode {
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const botY = Math.max(node.size.height, 0);
    const topY = 0;
    const d = 'M' + leftX + " " + topY + " L " + midX + " " + botY + " L " + rightX + " " + topY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates a trapez for {@code node}.
 * @param node The node that should be represented by a trapez.
 * @returns A trapez for {@code node}.
 */
export function renderTrapez(node: SNode): VNode {
    const leftX = 0;
    const midX1 = Math.max(node.size.width, 0) / 4.0;
    const midX2 = Math.max(node.size.width, 0) * (3.0 / 4.0);
    const rightX = Math.max(node.size.width, 0);
    const botY = Math.max(node.size.height, 0);
    const topY = 0;
    const d = 'M' + leftX + " " + botY + " L " + midX1 + " " + topY + " L " + midX2 + " " + topY
        + " L " + rightX + " " + botY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates a diamond for {@code node}.
 * @param node The node that should be represented by a diamond.
 * @returns A diamond for {@code node}.
 */
export function renderDiamond(node: SNode): VNode {
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const topY = 0;
    const midY = Math.max(node.size.height, 0) / 2.0;
    const botY = Math.max(node.size.height, 0);
    const d = 'M' + leftX + " " + midY + " L " + midX + " " + topY + " L " + rightX + " " + midY
        + " L " + midX + " " + botY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates a pentagon for {@code node}.
 * @param node The node that should be represented by a pentagon.
 * @returns A pentagon for {@code node}.
 */
export function renderPentagon(node: SNode): VNode {
    const startX = 5;
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const endX = Math.max(node.size.width, 0) - 5;
    const topY = 0;
    const midY = Math.max(node.size.height, 0) / 3.0;
    const botY = Math.max(node.size.height, 0);
    const d = 'M' + startX + " " + botY + " L " + leftX + " " + midY + " L " + midX + " " + topY
        + " L " + rightX + " " + midY + " L " + endX + " " + botY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates a hexagon for {@code node}.
 * @param node The node that should be represented by a hexagon.
 * @returns A hexagon for {@code node}.
 */
export function renderHexagon(node: SNode): VNode {
    const leftX = 0;
    const midX1 = 5;
    const midX2 = Math.max(node.size.width, 0) - 5;
    const rightX = Math.max(node.size.width, 0);
    const topY = 0;
    const midY = Math.max(node.size.height, 0) / 2.0;
    const botY = Math.max(node.size.height, 0);
    const d = 'M' + leftX + " " + midY + " L " + midX1 + " " + botY + " L " + midX2 + " " + botY
        + " L " + rightX + " " + midY + " L " + midX2 + " " + topY + " L " + midX1 + " " + topY + 'Z';
    return <path
        d={d}
    />;
}

/**
 * Creates an And-Gate for {@code node}.
 * @param node The node that should be represented by an And-Gate.
 * @returns An And-Gate for {@code node}.
 */
export function renderAndGate(node: SNode): VNode {
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const botY = Math.max(node.size.height, 0);
    const midY = Math.max(node.size.height, 0) / 2.0;
    const topY = 0;

    const d = `M ${leftX}, ${midY} V ${botY} H ${rightX} V ${midY} C ${rightX}, ${midY} ${rightX}, ${topY} ${midX}, ${topY} ${leftX}, ${topY} ${leftX}, ${midY} ${leftX}, ${midY} Z`;
    // 'M' + leftX + " " + midY + " V " + botY + " H " + rightX + " V " + midY + " C " + rightX + " " + midY + " " + rightX + " "
    // + topY + " " + midX + " " + topY + " " + leftX + " " + topY + " " + leftX + " " + midY + " " + leftX + " " + midY + 'Z';

    return <path
        d={d}
    />;
}

/**
 * Creates an Or-Gate for {@code node}.
 * @param node The node that should be represented by an Or-Gate.
 * @returns An Or-Gate for {@code node}.
 */
export function renderOrGate(node: SNode): VNode {
    const leftX = 0;
    const rightX = Math.max(node.size.width, 0);
    const midX = rightX / 2.0;
    const botY = Math.max(node.size.height, 0);
    const nearBotY = botY - 5;
    const midY = Math.max(node.size.height, 0) / 2;
    const topY = 0;
    const d = `M${leftX},${midY} V ${botY}` + `C ${leftX}, ${botY} ${leftX+10}, ${nearBotY} ${midX}, ${nearBotY} ${rightX-10}, ${nearBotY} ${rightX}, ${botY} ${rightX}, ${botY}`
    + `V ${midY} A ${node.size.width},${node.size.height-10},${0},${0},${0},${midX},${topY} A ${node.size.width},${node.size.height-10},${0},${0},${0},${leftX},${midY} Z`;

    return <path
        d={d}
    />;
}

/**
 * Creates an Kn-Gate for {@code node}.
 * @param node The node that should be represented by an Kn-Gate.
 * @returns An Kn-Gate for {@code node}.
 */
export function renderKnGate(node: SNode, k: number, n: number): VNode {
    const leftX = 0;
    const rightX = Math.max(node.size.width, 0);
    const midX = rightX / 2.0;
    const botY = Math.max(node.size.height, 0);
    const nearBotY = Math.max(node.size.height, 0) - (Math.max(node.size.height, 0) / 10.0);
    const midY = Math.max(node.size.height, 0) / 2;
    const topY = 0;
    const d = `M${leftX},${midY} V ${botY}` + `C ${leftX}, ${botY} ${leftX+10}, ${nearBotY} ${midX}, ${nearBotY} ${rightX-10}, ${nearBotY} ${rightX}, ${botY} ${rightX}, ${botY}`
    + `V ${midY} A ${node.size.width},${node.size.height-10},${0},${0},${0},${midX},${topY} A ${node.size.width},${node.size.height-10},${0},${0},${0},${leftX},${midY} Z`;

    return (
        <g>
            <path d={d} />
            <text x={midX - 7.0} y={botY - 5} text-anchor="middle" class-fta-text={true}>
                {`${k}/${n}`}
            </text>
        </g>
    );
}

/**
 * Creates an Inhibit-Gate for {@code node}.
 * @param node The node that should be represented by an Inhibit-Gate.
 * @returns An Inhibit-Gate for {@code node}.
 */
export function renderInhibitGate(node: SNode): VNode {
    const leftX = 0;
    const midX = Math.max(node.size.width, 0) / 2.0;
    const rightX = Math.max(node.size.width, 0);
    const lowestY = Math.max(node.size.height, 0);
    const lowY = Math.max(node.size.height, 0) - (Math.max(node.size.height, 0) / 4.0);
    const highY = Math.max(node.size.height, 0) / 4.0;
    const highestY = 0;

    const d = 'M' + leftX + " " + lowY + " L " + leftX + " " + highY + " L " + midX + " " + highestY + " L " + rightX
        + " " + highY + " L " + rightX + " " + lowY + " L " + midX + " " + lowestY + "Z";

    return <path
        d={d}
    />;
}