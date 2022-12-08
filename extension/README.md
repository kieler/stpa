# PASTA: Pragmatic Automated System-Theoretic Process Analysis

> This extension offers a DSL for System-Theoretic Process Analysis (STPA) including an automatic visualization and validity checks.

## DSL

To use the extension for an analysis, the file in which the analysis is done must have `.stpa` as its file ending. Each STPA aspect has its own section in the DSL. Components for each aspect are defined with an ID, a description, and a reference list.

### Minimal example of an analysis for a ferry:
```
Losses
L1 "Loss of life or serious injury to people"

Hazards
H1 "Vessel's exposure to major damage or breakdown" [L1] 

SystemConstraints
SC1 "Vessel must not be exposed to major damage or breakdown" [H1]

ControlStructure
Ferry {
    ControlCentre {
        hierarchyLevel 0
        processModel {
            mode: [docking, driving]
        }
        controlActions {
            [navi "Route navigation", data "Weather data"] -> VirtualCaptain 
            [manual "Manual setting"] -> Engine
        }
    }
    VirtualCaptain {
        hierarchyLevel 1
        controlActions {
            [pars "Set parameters"] -> Engine
        }
        feedback {
            [status "System status", faults "Faults"] -> ControlCentre 
        }
    }
    Engine {
        hierarchyLevel 2
        feedback {
            [motion "Motion"] -> VirtualCaptain
        }
    }
}

Responsibilities
VirtualCaptain {
    R1 "Actuate reverse gear when too close to a No Go Area" [SC1]
}
ControlCentre {
    R3 "Manually set parameters of engine in case of a malfunction" [SC1]
}

UCAs
ControlCentre.manual {
    notProviding {
        UCA1 "ControlCentre does not provide Manual setting when VC is malfunctioning and vessel too close to a No Go Area" [H1]
    }
    providing {}
    tooEarly/Late {}
    stoppedTooSoon {}
}

ControllerConstraints
C1 "ControlCentre must provide the Manual setting control action during VC malfunctioning and vessel too close to No Go Area" [UCA1]

LossScenarios
Scenario1 for UCA1 "Abnormal vessel behavior occurs. Vessel comes too close to a No Go Area and ControlCentre does not manual set the parameters of the engine, causing the entering of a No Go Area." [H1]
Scenario2 "Virtual Captain sends the Set parameters command upon coming too close to a No Go Area, but decceleration is not applied due to actuator failure." [H1]
```

## Features

Several validity checks are provided such as 
* for each control action at least one Unsafe Control Action (UCA) must be defined
* for each UCA a constraint must be defined
  
These checks can be turned off in the context menu of the editor.

In the diagram different color styles and filtering methods are provided. Clicking on a node fades out non-connected nodes and clicking on a node while pressing the `Ctrl` key fades out nodes that belong to another aspect.

Instead of informal UCA definitions a context table may be used. This is done by using the section `Context-Table` instead of `UCAs`. A context table can then be generated automatically and shown alongside the diagram. Clicking on a UCA in the context table highlights the corresponding node in the diagram and its definition in the editor. In the context table view a control action can be selected in order to inspect it. 

### Example for defining UCAs with the context table:
```
Context-Table
RL1 {
    controlAction: ControlCentre.manual
    type: not-provided
    contexts: {
        UCA1 [mode = docking] [H1]
    }
}
```

