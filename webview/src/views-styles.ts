import { STPAAspect } from "./STPA-model";


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