/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import * as vscode from 'vscode';
import { createFile } from './utils';

export class StpaResult {
    losses: { id: string, description: string; }[];
    hazards: StpaComponent[];
    systemLevelConstraints: StpaComponent[];
    // sorted by system components
    responsibilities: Record<string, StpaComponent[]>;
    // sorted first by control action, then by uca type
    ucas: Record<string, Record<string, StpaComponent[]>>;
    controllerConstraints: StpaComponent[];
    // sorted by ucas
    ucaScenarios: Record<string, StpaComponent[]>;
    scenarios: StpaComponent[];
    safetyCons: StpaComponent[];
}

class StpaComponent {
    id: string;
    description: string;
    references?: string;
}

export async function createMarkdownFile(data: StpaResult): Promise<void> {
    // create a markdown file
    const markdown = createMarkdownText(data);

    // Ask the user where to save the sbm
    const currentFolder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : undefined;
    const uri = await vscode.window.showSaveDialog({
        filters: { Markdown: ['md'] },
        // TODO: not possible with current vscode version
        // title: 'Save Markdown to...',
        defaultUri: currentFolder ? vscode.Uri.file(`${currentFolder}/report.md`) : undefined,
    });
    if (uri === undefined) {
        // The user did not pick any file to save to.
        return;
    }

    createFile(uri.path, markdown);

}

class Headers {
    static Loss = "Losses";
    static Hazard = "Hazards";
    static SystemLevelConstraint = "System-level Constraints";
    static Responsibility = "Responsibilities";
    static UCA = "UCAs";
    static ControllerConstraint = "Controller Constraints";
    static LossScenario = "Loss Scenarios";
    static SafetyRequirement = "Safety Requirements";
}
function createMarkdownText(data: StpaResult): string {
    // TODO: add control structure, responsibilities, and UCAs
    let markdown = "";
    markdown += `# STPA Report\n\n`;
    // losses
    markdown += stpaAspectToMarkown(Headers.Loss, data.losses);
    // hazards
    markdown += stpaAspectToMarkown(Headers.Hazard, data.hazards);
    // system-level constraints
    markdown += stpaAspectToMarkown(Headers.SystemLevelConstraint, data.systemLevelConstraints);
    // responsibilities
    markdown += recordToMarkdown(Headers.Responsibility, data.responsibilities);
    // UCAs TODO
    markdown += `## ${Headers.UCA}\n\n`;
    // controller constraints
    markdown += stpaAspectToMarkown(Headers.ControllerConstraint, data.controllerConstraints);
    // loss scenarios
    markdown += scenariosToMarkdown(data.ucaScenarios, data.scenarios);
    // safety requirements
    markdown += stpaAspectToMarkown(Headers.SafetyRequirement, data.safetyCons);
    // TODO: summarize safety constraints
    markdown += "## Summarized Safety Constraints\n\n";
    return markdown;
}

function stpaAspectToMarkown(aspect: string, components: StpaComponent[]): string {
    let markdown = `## ${aspect}\n\n`;
    for (const component of components) {
        markdown += stpaComponentToMarkown(component);
    }
    markdown += `\n`;
    return markdown;
}

function stpaComponentToMarkown(component: StpaComponent): string {
    let markdown = `${component.id}: ${component.description}`;
    if (component.references !== undefined && component.references !== "") {
        markdown += ` [${component.references}]`;
    }
    markdown += `  \n`;
    return markdown;
}

function recordToMarkdown(aspect: string, data: Record<string, StpaComponent[]>): string {
    let markdown = `## ${aspect}\n\n`;
    for (const reference in data) {
        markdown += `_${reference}_  \n`;
        for (const component of data[reference]) {
            markdown += stpaComponentToMarkown(component);
        }
        markdown += `\n`;
    }
    return markdown;
}

function scenariosToMarkdown(ucaScenarios: Record<string, StpaComponent[]>, scenarios: StpaComponent[]): string {
    let markdown = recordToMarkdown(Headers.LossScenario, ucaScenarios);
    if (scenarios.length !== 0) {
        markdown += `**Scenarios without associated UCA**\n\n`;
        scenarios.forEach(scenario => markdown += stpaComponentToMarkown(scenario)) + "\n";
    }
    return markdown;
}