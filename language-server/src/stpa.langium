/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

grammar Stpa

entry Model:
    ('Losses' losses+=Loss*)?
    ('Hazards' hazards+=Hazard*)?
    ('SystemConstraints' systemLevelConstraints+=SystemConstraint*)?
    ('ControlStructure' controlStructure=Graph)?
    ('Responsibilities' responsibilities+=Resps*)?
    ('UCAs' allUCAs+=ActionUCAs*)?
    ('ControllerConstraints' controllerConstraints+=ContConstraint*)?
    ('LossScenarios' scenarios+=LossScenario*)?
    ('SafetyRequirements' safetyCons+=SafetyConstraint*)?
    ('Rules' rules+=Rule*)?;

// TODO: controlAction already determines the system, the contet variables dont need it too
Rule:
    name=ID '{'
        'controlAction:' system=[Node] '.' action=[Command]
        'type:' type=Type
        'context:' '{'
            system=[Node] '.' vars+=[Variable] '=' values+=STRING (',' system=[Node] '.' vars+=[Variable] '=' values+=STRING)*
        '}'
    '}'
    list=HazardList;

// TODO: write validator for this string
Type:
    value=STRING;

Loss:
    name=ID description=STRING;

Hazard:
    name=SubID description=STRING 
    ('['refs+=[Loss] (',' refs+=[Loss])*']')?
    ('{' (header=STRING? subComps+=Hazard+)*'}')?;

SystemConstraint:
    name=SubID description=STRING 
    '[' 
    refs+=[Hazard:SubID] (',' refs+=[Hazard:SubID])*
    ']'
    ('{' (header=STRING? subComps+=SystemConstraint+)*'}')?;

Graph:
    name=ID '{'(nodes+=Node /* | edges+=Edge */)*'}';

Node:
    name=ID '{'
        'hierarchyLevel' level=INT
        ('label' label=STRING)?
        ('processModel' '{'variables+=Variable*'}')?
        ('controlActions' '{'actions+=VE*'}')?
        ('feedback' '{'feedbacks+=VE*'}')?
    '}';

/* Edge:
    name=ID '{'
        source=[Node] '->' target=[Node]
        ('label' label=STRING)?
    '}'; */

Variable:
    name=ID':' '['values+=STRING (',' values+=STRING)*']';

VE:
    '[' comms+=Command (',' comms+=Command)* ']' '->' target=[Node];

Command:
    name=ID label=STRING;

Resps:
    system=[Node] '{'responsiblitiesForOneSystem+=Responsibility*'}';

Responsibility:
    name=ID description=STRING '[' 
    refs+=[SystemConstraint:SubID] (',' refs+=[SystemConstraint:SubID])*
    ']';

ActionUCAs:
    system=[Node]'.'
    action=[Command] '{'
        'notProviding' '{'ucas+=UCA*'}'
        'providing' '{'ucas+=UCA*'}'
        'tooEarly/Late' '{'ucas+=UCA*'}'
        'stoppedTooSoon' '{'ucas+=UCA*'}'
    '}';

UCA:
    name=ID description=STRING list=HazardList;

ContConstraint:
    name=ID description=STRING '['refs+=[UCA] (',' refs+=[UCA])*']';

LossScenario:
    (name=ID description=STRING list=HazardList) |
    (name=ID 'for' uca=[UCA] description=STRING (list=HazardList)?);

HazardList:
    '[' refs+=[Hazard:SubID] (',' refs+=[Hazard:SubID])*']';

SafetyConstraint:
    name=ID description=STRING '['refs=[LossScenario]']';

SubID returns string:
    ID('.'INT)*;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;