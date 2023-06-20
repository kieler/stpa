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
import { StpaComponent, StpaResult, UCA_TYPE, createFile } from './utils';

export async function createMarkdownFile(data: StpaResult): Promise<void> {
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
    // create a markdown text
    const markdown = createMarkdownText(data);
    // create svg diagrams
    const folderUri = uri.path.lastIndexOf('/');
    createDiagrams(uri.path.substring(0, folderUri));

    createFile(uri.path, markdown);
}

class Headers {
    static Loss = "Losses";
    static Hazard = "Hazards";
    static SystemLevelConstraint = "System-level Constraints";
    static Responsibility = "Responsibilities";
    static ControlStructure = "Control Structure";
    static UCA = "UCAs";
    static ControllerConstraint = "Controller Constraints";
    static LossScenario = "Loss Scenarios";
    static SafetyRequirement = "Safety Requirements";
}

function createMarkdownText(data: StpaResult): string {
    // TODO: add control structure, context table, diagrams
    let markdown = "";
    markdown += `# STPA Report\n\n`;
    // losses
    markdown += stpaAspectToMarkdown(Headers.Loss, data.losses);
    // hazards
    markdown += stpaAspectToMarkdown(Headers.Hazard, data.hazards, HAZARD_PATH);
    // system-level constraints
    markdown += stpaAspectToMarkdown(Headers.SystemLevelConstraint, data.systemLevelConstraints, SYSTEM_CONSTRAINT_PATH);
    // control structure
    markdown += addControlStructure();
    // responsibilities
    markdown += recordToMarkdown(Headers.Responsibility, data.responsibilities);
    markdown += `![Responsibilities](.${SVG_PATH + RESPONSIBILITY_PATH})\n\n`;
    // UCAs TODO
    markdown += ucasToMarkdown(data.ucas);
    // controller constraints
    markdown += stpaAspectToMarkdown(Headers.ControllerConstraint, data.controllerConstraints, CONTROLLER_CONSTRAINT_PATH);
    // loss scenarios
    markdown += scenariosToMarkdown(data.ucaScenarios, data.scenarios);
    // safety requirements
    markdown += stpaAspectToMarkdown(Headers.SafetyRequirement, data.safetyCons, SAFETY_REQUIREMENT_PATH);
    // summarize safety constraints
    markdown += addSummary(data);
    return markdown;
}

function stpaAspectToMarkdown(aspect: string, components: StpaComponent[], diagram?: string): string {
    let markdown = `## ${aspect}\n\n`;
    for (const component of components) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    markdown += `\n`;
    if (diagram) {
        markdown += `![${aspect}](.${SVG_PATH + diagram})\n\n`;
    }
    return markdown;
}

function stpaComponentToMarkdown(component: StpaComponent): string {
    let markdown = `**${component.id}**: ${component.description}`;
    if (component.references !== undefined && component.references !== "") {
        markdown += ` [${component.references}]`;
    }
    return markdown;
}

function recordToMarkdown(aspect: string, data: Record<string, StpaComponent[]>): string {
    let markdown = `## ${aspect}\n\n`;
    for (const reference in data) {
        markdown += `_${reference}_  \n`;
        for (const component of data[reference]) {
            markdown += stpaComponentToMarkdown(component);
            markdown += `  \n`;
        }
        markdown += `\n`;
    }
    return markdown;
}

function scenariosToMarkdown(ucaScenarios: Record<string, StpaComponent[]>, scenarios: StpaComponent[]): string {
    let markdown = recordToMarkdown(Headers.LossScenario, ucaScenarios);
    if (scenarios.length !== 0) {
        markdown += `**Scenarios without associated UCA**\n\n`;
        markdown += scenarios.map(scenario => stpaComponentToMarkdown(scenario)).join("  \n");
        markdown += `\n`;
    }
    markdown += `\n![Scenarios](.${SVG_PATH + SCENARIO_PATH})\n\n`;
    return markdown;
}

function ucasToMarkdown(actionUcas: { controlAction: string, ucas: Record<string, StpaComponent[]>; }[]): string {
    let markdown = `## ${Headers.UCA}\n\n`;
    markdown += `| Control Action | not provided | provided | too late or too early | applied too long or stopped too soon |\n`;
    // TODO: alignment? (:---:)
    markdown += `| --- | --- | --- | --- | --- |\n`;
    for (const actionUCA of actionUcas) {
        markdown += `| ${actionUCA.controlAction} |`;
        markdown += actionUCA.ucas[UCA_TYPE.NOT_PROVIDED].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.PROVIDED].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.WRONG_TIME].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.CONTINUOUS].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|\n";
    }
    markdown += `\n\n![UCAs](.${SVG_PATH + UCA_PATH})\n\n`;
    markdown += `\n`;
    return markdown;
}

function addSummary(data: StpaResult): string {
    let markdown = "## Summarized Safety Constraints\n\n";
    for (const component of data.systemLevelConstraints) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    for (const component of data.controllerConstraints) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    for (const component of data.safetyCons) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    markdown += `\n\n![Complete-Graph](.${SVG_PATH + COMPLETE_GRAPH_PATH})\n\n`;
    return markdown;
}

function addControlStructure(): string {
    let markdown = `## ${Headers.ControlStructure}\n\n`;
    markdown += `![Control Structure](.${SVG_PATH + CONTROL_STRUCTURE_PATH})\n\n`;
    return markdown;
}

const SVG_PATH = "/images";
const CONTROL_STRUCTURE_PATH = "/control-structure.svg";
const HAZARD_PATH = "/hazard.svg";
const SYSTEM_CONSTRAINT_PATH = "/system-constraint.svg";
const RESPONSIBILITY_PATH = "/responsibility.svg";
const UCA_PATH = "/uca.svg";
const CONTROLLER_CONSTRAINT_PATH = "/controller-constraint.svg";
const SCENARIO_PATH = "/scenario.svg";
const SAFETY_REQUIREMENT_PATH = "/safety-requirement.svg";
const COMPLETE_GRAPH_PATH = "/complete-graph.svg";

function createDiagrams(folderUri: string): void {
    vscode.commands.executeCommand('stpa.md.diagram.export', folderUri + SVG_PATH);
}
