grammar Fta

entry ModelFTA:
    ('Components' components+=Component*)? 
    ('Conditions' conditions+=Condition*)?     
    ('TopEvent' topEvent=TopEvent)
    ('Gates' gates+=Gate*)?;      

Component:
    name=ID description=STRING;

Condition:
    name=ID description=STRING;

Gate:
    name=ID "=" type=(AND|OR|KNGate|InhibitGate);

TopEvent:
    name=STRING "=" child+=[Child:ID];

Child:
    Gate | Component;

AND:
    child+=[Child:ID] (string='and' child+=[Child:ID])+;

OR:
    child+=[Child:ID] (string='or' child+=[Child:ID])+;

KNGate:
    k=INT string='of' child+=[Child:ID] (',' child+=[Child:ID])+;

InhibitGate:
    condition+=[Condition:ID] string='inhibits' child+=[Child:ID];

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

