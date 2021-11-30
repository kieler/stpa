import { STPAAspect } from "./STPA-model";


const LOSS_COLOR: ColorStyle = {color: 'darkRed', opacity: undefined}
const HAZARD_COLOR: ColorStyle = {color: 'goldenrod', opacity: undefined}
const SYSCONS_COLOR: ColorStyle = {color: 'green', opacity: undefined}
const RESP_COLOR: ColorStyle = {color: 'purple', opacity: undefined}
const UCA_COLOR: ColorStyle = {color: 'indianRed', opacity: undefined}
const CONTCONS_COLOR: ColorStyle = {color: 'dodgerBlue', opacity: undefined}
const SCENARIO_COLOR: ColorStyle = {color: 'darkOrange', opacity: undefined}
const SAFETYREQ_COLOR: ColorStyle = {color: 'darkSlateGrey', opacity: undefined}

export function getAspectColor(aspect: STPAAspect): ColorStyle {
    switch (aspect) {
        case STPAAspect.Loss: 
            return LOSS_COLOR
        case STPAAspect.Hazard: 
            return HAZARD_COLOR
        case STPAAspect.SystemConstraint: 
            return SYSCONS_COLOR
        case STPAAspect.Responsibility: 
            return RESP_COLOR
        case STPAAspect.UCA: 
            return UCA_COLOR
        case STPAAspect.ControllerConstraint: 
            return CONTCONS_COLOR
        case STPAAspect.Scenario: 
            return SCENARIO_COLOR
        case STPAAspect.SafetyRequirement: 
            return SAFETYREQ_COLOR
    }
}



export interface ColorStyle {
    color: string,
    opacity: string | undefined
}