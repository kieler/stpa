/** @jsx svg */
import { VNode } from 'snabbdom';
import { SNode, svg } from 'sprotty';
import { STPAAspect } from "./STPA-model";

export function renderCircle(node: SNode): VNode {
    return <circle 
                r={Math.max(node.size.width, 0)/2.0} 
                cx={Math.max(node.size.width, 0)/2.0} cy={Math.max(node.size.height, 0)/2.0}
            />
}

export function renderRectangle(node: SNode): VNode {
    return <rect 
                x="0" y="0" 
                width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}          
           />
}

export function renderTriangle(node: SNode): VNode {
    const leftX = 0
    const midX = Math.max(node.size.width, 0)/2.0
    const rightX = Math.max(node.size.width, 0)
    const botY = Math.max(node.size.height, 0)
    const topY = 0
    const d = 'M'+ leftX + " " + botY + " L " + midX + " " + topY + " L " + rightX + " " + botY + 'Z'
    return <path
                d={d}
            />
}

export function renderMirroredTriangle(node: SNode): VNode {
    const leftX = 0
    const midX = Math.max(node.size.width, 0)/2.0
    const rightX = Math.max(node.size.width, 0)
    const botY = Math.max(node.size.height, 0)
    const topY = 0
    const d = 'M'+ leftX + " " + topY + " L " + midX + " " + botY + " L " + rightX + " " + topY + 'Z'
    return <path
                d={d}
            />
}

export function renderTrapez(node: SNode): VNode {
    const leftX = 0
    const midX1 = Math.max(node.size.width, 0)/4.0
    const midX2 = Math.max(node.size.width, 0) * (3.0/4.0)
    const rightX = Math.max(node.size.width, 0)
    const botY = Math.max(node.size.height, 0)
    const topY = 0
    const d = 'M'+ leftX + " " + botY + " L " + midX1 + " " + topY + " L " + midX2 + " " + topY
                + " L " + rightX + " " + botY + 'Z'
    return <path
                d={d}
            />
}

export function renderDiamond(node: SNode): VNode {
    const leftX = 0
    const midX = Math.max(node.size.width, 0)/2.0
    const rightX = Math.max(node.size.width, 0)
    const topY = 0
    const midY = Math.max(node.size.height, 0)/2.0
    const botY = Math.max(node.size.height, 0)
    const d = 'M'+ leftX + " " + midY + " L " + midX + " " + topY + " L " + rightX + " " + midY
                + " L " + midX + " " + botY + 'Z'
    return <path
                d={d}
            />
}

export function renderPentagon(node: SNode): VNode {
    const startX = 5
    const leftX= 0
    const midX = Math.max(node.size.width, 0)/2.0
    const rightX = Math.max(node.size.width, 0)
    const endX = Math.max(node.size.width, 0) -5
    const topY = 0
    const midY = Math.max(node.size.height, 0)/3.0
    const botY = Math.max(node.size.height, 0)
    const d = 'M'+ startX + " " + botY + " L " + leftX + " " + midY + " L " + midX + " " + topY
                + " L " + rightX + " " + midY + " L " + endX + " " + botY + 'Z'
    return <path
                d={d}
            />
}

export function renderHexagon(node: SNode): VNode {
    const leftX= 0
    const midX1 = 5
    const midX2 = Math.max(node.size.width, 0) - 5
    const rightX = Math.max(node.size.width, 0)
    const topY = 0
    const midY = Math.max(node.size.height, 0)/2.0
    const botY = Math.max(node.size.height, 0)
    const d = 'M'+ leftX + " " + midY + " L " + midX1 + " " + botY + " L " + midX2 + " " + botY
                + " L " + rightX + " " + midY + " L " + midX2 + " " + topY + " L " + midX1 + " " + topY + 'Z'
    return <path
                d={d}
            />
}
 

const LOSS_COLOR: ColorStyle = {color: 'darkRed', opacity: undefined}
const HAZARD_COLOR: ColorStyle = {color: 'goldenrod', opacity: undefined}
const SYSCONS_COLOR: ColorStyle = {color: 'green', opacity: undefined}
const RESP_COLOR: ColorStyle = {color: 'purple', opacity: undefined}
const UCA_COLOR: ColorStyle = {color: 'indianRed', opacity: undefined}
const CONTCONS_COLOR: ColorStyle = {color: 'dodgerBlue', opacity: undefined}
const SCENARIO_COLOR: ColorStyle = {color: 'darkOrange', opacity: undefined}
const SAFETYREQ_COLOR: ColorStyle = {color: 'darkSlateGrey', opacity: undefined}
const DEFAULT_COLOR: ColorStyle = {color: 'grey', opacity: undefined}

export function getAspectColor(aspect: STPAAspect): ColorStyle {
    switch (aspect) {
        case STPAAspect.LOSS: 
            return LOSS_COLOR
        case STPAAspect.HAZARD: 
            return HAZARD_COLOR
        case STPAAspect.SYSTEMCONSTRAINT: 
            return SYSCONS_COLOR
        case STPAAspect.RESPONSIBILITY: 
            return RESP_COLOR
        case STPAAspect.UCA: 
            return UCA_COLOR
        case STPAAspect.CONTROLLERCONSTRAINT: 
            return CONTCONS_COLOR
        case STPAAspect.SCENARIO: 
            return SCENARIO_COLOR
        case STPAAspect.SAFETYREQUIREMENT: 
            return SAFETYREQ_COLOR
        default: return DEFAULT_COLOR
    }
}

export interface ColorStyle {
    color: string,
    opacity: string | undefined
}