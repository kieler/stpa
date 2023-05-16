grammar Fta

entry ModelFTA:
    ('Components' components+=Component*)? 
    ('Conditions' conditions+=Condition)?     
    ('Gates' gates+=Gate*)?      
    ('TopEvent' topEvent=TopEvent);

Component:
    name=ID description=STRING;

Condition:
    name=ID description=STRING;

Gate:
    name=ID ":" type=(AND|OR|KNGate|InhibitGate);

TopEvent:
    name=STRING ":" child+=[Child:ID];

Child:
    Gate | Component;

AND:
    (string='AND' '[' child+=[Child:ID] (',' child+=[Child:ID])+ ']' |
    child+=[Child:ID] string='AND' child+=[Child:ID]);

OR:
    (string='OR' '[' child+=[Child:ID] (',' child+=[Child:ID])+ ']' |
    child+=[Child:ID] string='OR' child+=[Child:ID]);

KNGate:
    string='k/N' k=INT '[' child+=[Child:ID] (',' child+=[Child:ID])+ ']';

InhibitGate:
    (string='INHIBIT' '[' child+=[Child:ID] ',' condition+=[Condition:ID] ']'|
    child+=[Child:ID] string='INHIBIT' condition+=[Condition:ID]);

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

