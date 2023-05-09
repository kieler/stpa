grammar Fta

entry ModelFTA:
    ('Components' components+=Component*)?      
    ('Gates' gates+=Gate*)?      
    ('TopEvent' topEvent=TopEvent);

Component:
    name=ID description=STRING;

Gate:
    name=ID ":" 
    (type=AndOrGate '[' componentOrGate+=ComponentOrGate (',' componentOrGate+=ComponentOrGate)+ ']' |
    type=KNGate number=INT '[' componentOrGate+=ComponentOrGate (',' componentOrGate+=ComponentOrGate)+ ']' |
    type=InhibitGate '[' componentOrGate+=ComponentOrGate ',' componentOrGate+=ComponentOrGate ']' |
    componentOrGate+=ComponentOrGate type=(InhibitGate|AndOrGate) componentOrGate+=ComponentOrGate);

TopEvent:
    name=STRING ":" gate=[Gate:ID];

ComponentOrGate:
    (component+=[Component:ID] | gate+=[Gate:ID]);

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

