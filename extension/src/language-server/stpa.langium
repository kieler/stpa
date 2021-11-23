grammar Stpa
hidden(WS, SL_COMMENT, ML_COMMENT)

Model:
    'Losses' losses+=Loss*  
    ('Hazards' hazards+=Hazard*)?
    ('SystemConstraints' systemLevelConstraints+=SystemConstraint*)?
    ('ControlStructure' controlStructure=Graph)?
    ('Responsibilities' responsibilities+=Resps*)?
    ('UCAs' allUCAs+=SystemUCAs*)?
    ('ControllerConstraints' controllerConstraints+=ContConstraint*)?
    ('LossScenarios' scenarios+=LossScenario*)?
    ('SafetyConstraints' safteyCons+=SafetyConstraint*)?;


Loss:
    name=ID description=STRING;

Hazard:
    name=ID description=STRING '['losses+=[Loss] (',' losses+=[Loss])*']';

SystemConstraint:
    name=ID description=STRING '['hazard=[Hazard]']';

Graph:
    (systems+=Node | edges+=Edge)*;

Node:
    name=ID '{'
        ('processModel:' 
            variables+=Variable*)?
        ('controlActions' 
            actions+=VerticalEdge*)?
        ('feedback'
            feedbacks+=VerticalEdge*)?
    '}';

Edge:
    name=ID '{'
        source=[Node] '->' target=[Node]
        ('label:' label=STRING)?
    '}';

Variable:
    name=ID':' '['values+=STRING (',' values+=STRING)*']';

VerticalEdge:
    names=ID* '->' target=[Node];

Resps:
    system=[Node]':' responsiblitiesForOneSystem+=Responsibility*;

Responsibility:
    name=ID description=STRING '['systemConstraints+=[SystemConstraint] (',' systemConstraints+=[SystemConstraint])*']';

SystemUCAs:
    system=[Node] '{'
        'notProviding' ucas+=UCA*
        'providing' ucas+=UCA*
        'tooEarly/Late' ucas+=UCA*
        'stoppedTooSoon' ucas+=UCA*
    '}';

UCA:
    name=ID description=STRING '['hazards+=[Hazard] (',' hazards+=[Hazard])*']';

ContConstraint:
    name=ID':' description=STRING '['ucas+=[UCA] (',' ucas+=[UCA])*']';

LossScenario:
    (name=ID':' description1=STRING '['uca=[UCA]'].' description2=STRING '['hazard=[Hazard]']') |
    (name=ID 'for' uca=[UCA]':' description=STRING '['hazard=[Hazard]']');

SafetyConstraint:
    name=ID':' description=STRING '['scenario=[LossScenario]']';

terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
