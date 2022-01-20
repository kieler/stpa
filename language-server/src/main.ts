import { startLanguageServer } from 'langium';
import { addDiagramHandler } from 'langium-sprotty'
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { createStpaServices } from './stpa-module';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the language services
const { shared, states } = createStpaServices({ connection });

// Start the language server with the language-specific services
startLanguageServer(shared);
addDiagramHandler(connection, shared)

connection.onNotification('hierarchy', (message: string) => states.options.Options.toggleHierarchy())