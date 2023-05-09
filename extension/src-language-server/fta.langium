grammar Fta

entry ModelFTA:
    ('Components' components+=Component*)? 
    ('Conditions' condition+=Condition)?     
    ('Gates' gates+=Gate*)?      
    ('TopEvent' topEvent=TopEvent);

Component:
    name=ID description=STRING;

Condition:
    name=ID description=STRING;
Gate:
    name=ID ":" 
    (type=AndOrGate '[' componentOrGate+=[ComponentOrGate:ID] (',' componentOrGate+=[ComponentOrGate:ID])+ ']' |
    type=KNGate number=INT '[' componentOrGate+=[ComponentOrGate:ID] (',' componentOrGate+=[ComponentOrGate:ID])+ ']' |
    type=InhibitGate '[' componentOrGate+=[ComponentOrGate:ID] ',' condition+=[Condition:ID] ']' |
    componentOrGate+=[ComponentOrGate:ID] type=AndOrGate componentOrGate+=[ComponentOrGate:ID] | 
    componentOrGate+=[ComponentOrGate:ID] type=InhibitGate condition+=[Condition:ID]);

TopEvent:
    name=STRING ":" gate=[Gate:ID];

ComponentOrGate:
    Gate | Component;

AndOrGate returns string:
    'AND' | 'OR';

KNGate returns string:
    'k/N';

InhibitGate returns string:
    'INHIBIT';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

