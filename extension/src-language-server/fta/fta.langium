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
    AND|OR|KNGate|InhibitGate;

TopEvent:
    name=STRING "=" child=[Children:ID];

Children:
    Gate | Component;

AND:
    name=ID (description=STRING)? "=" children+=[Children:ID] ('and' children+=[Children:ID])+;

OR:
    name=ID (description=STRING)? "=" children+=[Children:ID] ('or' children+=[Children:ID])+;

KNGate:
    name=ID (description=STRING)? "=" k=INT 'of' children+=[Children:ID] (',' children+=[Children:ID])+;

InhibitGate:
    name=ID (description=STRING)? "=" condition+=[Condition:ID] 'inhibits' children+=[Children:ID];

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

