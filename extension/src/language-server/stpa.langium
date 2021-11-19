grammar Stpa
hidden(WS, SL_COMMENT, ML_COMMENT)

Model:
    (persons+=Person | greetings+=Greeting | goodbyes+=Goodbye)*;

Person:
    'person' name=ID;

Greeting:
    'Hello' person=[Person|ID] '!';

Goodbye:
    'Bye' person=[Person|ID];

terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
terminal SL_COMMENT: /\/\/[^\n\r]*/;
