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
import { StpaLspVscodeExtension } from './language-extension';

export async function createMarkdownFile(data: StpaResult, extension: StpaLspVscodeExtension): Promise<void> {
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

    // create svg diagrams
    const folderUri = uri.path.lastIndexOf('/');
    const diagramSizes: Record<string, number>  = await extension.createSVGDiagrams(uri.path.substring(0, folderUri) + SVG_PATH);

    // create a markdown text
    const markdown = createMarkdownText(data, diagramSizes);

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

function createMarkdownText(data: StpaResult, diagramSizes: Record<string, number>): string {
    // TODO: add context table
    let markdown = "";
    markdown += `# STPA Report\n\n`;
    // losses
    markdown += stpaAspectToMarkdown(Headers.Loss, data.losses);
    // hazards
    markdown += stpaAspectToMarkdown(Headers.Hazard, data.hazards, HAZARD_PATH, diagramSizes);
    // system-level constraints
    markdown += stpaAspectToMarkdown(Headers.SystemLevelConstraint, data.systemLevelConstraints, SYSTEM_CONSTRAINT_PATH, diagramSizes);
    // control structure
    markdown += addControlStructure(diagramSizes);
    // responsibilities
    markdown += recordToMarkdown(Headers.Responsibility, data.responsibilities);
    markdown += `<img src=".${SVG_PATH + RESPONSIBILITY_PATH}" width="${diagramSizes[RESPONSIBILITY_PATH]*SIZE_MULTIPLIER}">\n\n`;
    // UCAs
    markdown += ucasToMarkdown(data.ucas, diagramSizes);
    // controller constraints
    markdown += stpaAspectToMarkdown(Headers.ControllerConstraint, data.controllerConstraints, CONTROLLER_CONSTRAINT_PATH, diagramSizes);
    // loss scenarios
    markdown += scenariosToMarkdown(data.ucaScenarios, data.scenarios, diagramSizes);
    // safety requirements
    markdown += stpaAspectToMarkdown(Headers.SafetyRequirement, data.safetyCons, SAFETY_REQUIREMENT_PATH);
    // summarize safety constraints
    markdown += addSummary(data, diagramSizes);
    return markdown;
}

function stpaAspectToMarkdown(aspect: string, components: StpaComponent[], svgName?: string, diagramSizes?: Record<string, number>): string {
    let markdown = `## ${aspect}\n\n`;
    for (const component of components) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    markdown += `\n`;
    if (svgName && diagramSizes) {
        markdown += `<img src=".${SVG_PATH + svgName}" width="${diagramSizes[svgName]*SIZE_MULTIPLIER}">\n\n`;
    }
    return markdown;
}

function ucaComponentToMarkdown(component: StpaComponent): string {
    let markdown = `<b>${component.id}</b>: ${component.description}`;
    if (component.references !== undefined && component.references !== "") {
        markdown += ` [${component.references}]`;
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

function scenariosToMarkdown(ucaScenarios: Record<string, StpaComponent[]>, scenarios: StpaComponent[], diagramSizes: Record<string, number>): string {
    let markdown = recordToMarkdown(Headers.LossScenario, ucaScenarios);
    if (scenarios.length !== 0) {
        markdown += `**Scenarios without associated UCA**\n\n`;
        markdown += scenarios.map(scenario => stpaComponentToMarkdown(scenario)).join("  \n");
        markdown += `\n`;
    }
    markdown += `\n<img src=".${SVG_PATH + SCENARIO_PATH}" width="${diagramSizes[SCENARIO_PATH]*SIZE_MULTIPLIER}">\n\n`;
    return markdown;
}

function ucasToMarkdown(actionUcas: { controlAction: string, ucas: Record<string, StpaComponent[]>; }[], diagramSizes: Record<string, number>): string {
    let markdown = `## ${Headers.UCA}\n\n`;
    for (const actionUCA of actionUcas) {
        markdown += `### _${actionUCA.controlAction}_\n\n`;
        /* markdown += `| not provided | provided | too late or too early | applied too long or stopped too soon |\n`;
        markdown += `| --- | --- | --- | --- |\n`;
        markdown += actionUCA.ucas[UCA_TYPE.NOT_PROVIDED].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.PROVIDED].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.WRONG_TIME].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|";
        markdown += actionUCA.ucas[UCA_TYPE.CONTINUOUS].map(uca => stpaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "|\n"; */
        markdown += `<table border="1px"  border-collapse="collapse">\n<tr>\n<th>not provided</th>\n<th>provided</th>\n<th>too late or too early</th>\n<th>applied too long or stopped too soon</th>\n</tr>\n`;
        markdown += "<tr><td>\n";
        markdown += actionUCA.ucas[UCA_TYPE.NOT_PROVIDED].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        markdown += actionUCA.ucas[UCA_TYPE.PROVIDED].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        markdown += actionUCA.ucas[UCA_TYPE.WRONG_TIME].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        markdown += actionUCA.ucas[UCA_TYPE.CONTINUOUS].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n</tr>\n</table>\n\n<br>\n\n";
        markdown += `<img src=".${SVG_PATH + "/" + actionUCA.controlAction.replace(".", "-") + ".svg"}" width="${diagramSizes["/" + actionUCA.controlAction.replace(".", "-") + ".svg"]*SIZE_MULTIPLIER}">\n\n<br><br>\n\n`;
    }
    markdown += `\n\n<img src=".${SVG_PATH + UCA_PATH}" width="${diagramSizes[UCA_PATH]*SIZE_MULTIPLIER}">\n\n`;
    return markdown;
}

function addSummary(data: StpaResult, diagramSizes: Record<string, number>): string {
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
    markdown += `\n\n<img src=".${SVG_PATH + COMPLETE_GRAPH_PATH}" width="${diagramSizes[COMPLETE_GRAPH_PATH]*SIZE_MULTIPLIER}">\n\n`;
    return markdown;
}

function addControlStructure(diagramSizes: Record<string, number>): string {
    let markdown = `## ${Headers.ControlStructure}\n\n`;
    markdown += `<img src=".${SVG_PATH + CONTROL_STRUCTURE_PATH}" width="${diagramSizes[CONTROL_STRUCTURE_PATH]*SIZE_MULTIPLIER}">\n\n`;
    return markdown;
}

const SVG_PATH = "/images";
const CONTROL_STRUCTURE_PATH = "/control-structure.svg";
const HAZARD_PATH = "/hazard.svg";
const SYSTEM_CONSTRAINT_PATH = "/system-constraint.svg";
const RESPONSIBILITY_PATH = "/responsibility.svg";
const UCA_PATH = "/all-UCAs.svg";
const CONTROLLER_CONSTRAINT_PATH = "/controller-constraint.svg";
const SCENARIO_PATH = "/scenario.svg";
const SAFETY_REQUIREMENT_PATH = "/safety-requirement.svg";
const COMPLETE_GRAPH_PATH = "/complete-graph.svg";

const SIZE_MULTIPLIER = 0.85;