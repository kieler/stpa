grammar Stpa

entry Model:
    'Losses' losses+=Loss*  
    ('Hazards' hazards+=Hazard*)?
    ('SystemConstraints' systemLevelConstraints+=SystemConstraint*)?
    ('ControlStructure' controlStructure=Graph)?
    ('Responsibilities' responsibilities+=Resps*)?
    ('UCAs' allUCAs+=ActionUCAs*)?
    ('ControllerConstraints' controllerConstraints+=ContConstraint*)?
    ('LossScenarios' scenarios+=LossScenario*)?
    ('SafetyRequirements' safetyCons+=SafetyConstraint*)?;


Loss:
    name=ID description=STRING;

Hazard:
    name=SubID description=STRING 
    ('['refs+=[Loss] (',' refs+=[Loss])*']')?
    ('{' (header=STRING? subHazards+=Hazard+)*'}')?;

SystemConstraint:
    name=SubID description=STRING 
    '[' 
    refs+=[Hazard:SubID] (',' refs+=[Hazard:SubID])*
    ']'
    ('{' (header=STRING? systemSubConstraints+=SystemConstraint+)*'}')?;

Graph:
    name=ID '{'(nodes+=Node | edges+=Edge)*'}';

Node:
    name=ID '{'
        ('label' label=STRING)?
        ('processModel' '{'variables+=Variable*'}')?
        ('controlActions' '{'actions+=VerticalEdge*'}')?
        ('feedback' '{'feedbacks+=VerticalEdge*'}')?
    '}';

Edge:
    name=ID '{'
        source=[Node] '->' target=[Node]
        ('label' label=STRING)?
    '}';

Variable:
    name=ID':' '['values+=STRING (',' values+=STRING)*']';

VerticalEdge:
    name=ID (label=STRING)? '->' target=[Node];

Resps:
    system=[Node] '{'responsiblitiesForOneSystem+=Responsibility*'}';

Responsibility:
    name=ID description=STRING '[' 
    refs+=[SystemConstraint:SubID] (',' refs+=[SystemConstraint:SubID])*
    ']';

ActionUCAs:
    system=[Node]'.'
    action=[VerticalEdge] '{'
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
    (name=ID description=STRING (list=HazardList)?) |
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