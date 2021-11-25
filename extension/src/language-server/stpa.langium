grammar Stpa
hidden(WS, SL_COMMENT, ML_COMMENT)

Model:
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
    name=ID description=STRING '['losses+=[Loss] (',' losses+=[Loss])*']'
    ('{' (header=STRING? subHazards+=SubHazard+)*'}')?;

SubHazard:
    name=SubID description=STRING;

SystemConstraint:
    name=ID description=STRING '['hazard=[Hazard]']'
    ('{' (header=STRING? systemSubConstraints+=SystemSubConstraint*)*'}')?;

SystemSubConstraint:
    name=SubID description=STRING '['subhazard=[SubHazard|SubID]']';

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
    systemSubConstraints+=[SystemSubConstraint | SubID] (',' systemSubConstraints+=[SystemSubConstraint | SubID])*
    ']';

ActionUCAs:
    action=[VerticalEdge] '{'
        'notProviding' '{'ucas+=UCA*'}'
        'providing' '{'ucas+=UCA*'}'
        'tooEarly/Late' '{'ucas+=UCA*'}'
        'stoppedTooSoon' '{'ucas+=UCA*'}'
    '}';

UCA:
    name=ID description=STRING 
    ( '[' hazards+=[Hazard] (',' hazards+=[Hazard])*']')?
    ('[''subHazards:' subHazards+=[SubHazard | SubID] (',' subHazards+=[SubHazard | SubID])*']')?
    ;

ContConstraint:
    name=ID':' description=STRING '['ucas+=[UCA] (',' ucas+=[UCA])*']';

LossScenario:
    (name=ID':' description=STRING ( '[' hazards+=[Hazard] (',' hazards+=[Hazard])*']')?
    ('[''subHazards:' subHazards+=[SubHazard | SubID] (',' subHazards+=[SubHazard | SubID])*']')?) |
    (name=ID 'for' uca=[UCA]':' description=STRING ( '[' hazards+=[Hazard] (',' hazards+=[Hazard])*']')?
    ('[''subHazards:' subHazards+=[SubHazard | SubID] (',' subHazards+=[SubHazard | SubID])*']')?);

SafetyConstraint:
    name=ID':' description=STRING '['scenario=[LossScenario]']';

SubID returns string:
    ID('.'INT)+;


terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NEWLINE: /[\n\r]+/;

terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;

