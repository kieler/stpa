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
import * as dayjs from 'dayjs';

/**
 * Creates a markdown file for the given {@code data}.
 * @param data The STPA result for which the markdown file should be created.
 * @param extension The PASTA extension.
 * @returns 
 */
export async function createSTPAResultMarkdownFile(data: StpaResult, extension: StpaLspVscodeExtension): Promise<void> {
    // Ask the user where to save the markdown file
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

    // create svg diagrams and save their width
    const diagramSizes: Record<string, number> = await extension.createSVGDiagrams(uri.path.substring(0, uri.path.lastIndexOf('/')) + SVG_PATH);

    // create the markdown text
    const markdown = createSTPAResultMarkdownText(data, diagramSizes);
    // create the file
    createFile(uri.path, markdown);
}

/**
 * The Headers for the STPA result file.
 */
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
    static summary = "Summarized Safety Constraints";
}

/**
 * Creates the markdown text for the given {@code data}.
 * @param data The STPA result for which the text should be created.
 * @param diagramSizes The widths of the diagrams that will be embedded.
 * @returns markdown text for the given {@code data}
 */
function createSTPAResultMarkdownText(data: StpaResult, diagramSizes: Record<string, number>): string {
    // TODO: consider context table
    let markdown = `# STPA Report for ${data.title}\n\n`;
    // table of contents
    markdown += createTOC();
    // losses
    markdown += stpaAspectToMarkdown(Headers.Loss, data.losses) + "\n";
    // hazards
    markdown += stpaAspectToMarkdown(Headers.Hazard, data.hazards, HAZARD_PATH, diagramSizes);
    // system-level constraints
    markdown += stpaAspectToMarkdown(Headers.SystemLevelConstraint, data.systemLevelConstraints, SYSTEM_CONSTRAINT_PATH, diagramSizes);
    // control structure
    markdown += addControlStructure(diagramSizes);
    // responsibilities
    markdown += recordToMarkdown(Headers.Responsibility, data.responsibilities);
    if (Object.keys(data.responsibilities).length > 0) {
        markdown += `<img src=".${SVG_PATH + RESPONSIBILITY_PATH}" width="${diagramSizes[RESPONSIBILITY_PATH] * SIZE_MULTIPLIER}">\n\n<br>\n\n`;
    }
    // UCAs
    markdown += ucasToMarkdown(data.ucas, diagramSizes);
    // controller constraints
    markdown += stpaAspectToMarkdown(Headers.ControllerConstraint, data.controllerConstraints, CONTROLLER_CONSTRAINT_PATH, diagramSizes);
    // loss scenarios
    markdown += scenariosToMarkdown(data.ucaScenarios, data.scenarios, diagramSizes);
    // safety requirements
    markdown += stpaAspectToMarkdown(Headers.SafetyRequirement, data.safetyCons, SAFETY_REQUIREMENT_PATH, diagramSizes);
    // summarized safety constraints
    markdown += addSummary(data, diagramSizes);
    // copyright
    markdown += addCopyRight();
    return markdown;
}

/**
 * Translates an STPA aspect to markdown text.
 * @param aspect The header for the aspect to translate.
 * @param components The components of the aspect to translate.
 * @param svgName The name of the diagram that should be embedded.
 * @param diagramSizes The widths of the diagrams that should be embedded.
 * @returns the markdown text for the given aspect and its components.
 */
function stpaAspectToMarkdown(aspect: string, components: StpaComponent[], svgName?: string, diagramSizes?: Record<string, number>): string {
    let markdown = `## ${aspect}\n\n`;
    if (components.length === 0) {
        // extra text if no components are defined.
        markdown += `No ${aspect} defined.\n`;
    } else {
        // translate each component
        for (const component of components) {
            markdown += stpaComponentToMarkdown(component) + `  \n`;
            if (component.subComponents) {
                // translate the subcomponents of hazards/system-level constraints
                markdown += subComponentsToMarkdown(component.subComponents, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
            }
        }
        // add the diagram if one is given
        if (svgName && diagramSizes) {
            markdown += `\n<img src=".${SVG_PATH + svgName}" width="${diagramSizes[svgName] * SIZE_MULTIPLIER}">\n\n<br>\n\n`;
        }
    }
    return markdown;
}

/**
 * Translates subcomponents (of Hayards/system-level constraints) to markdown.
 * @param components The components to translate.
 * @param tabs The current indentation.
 * @returns the markdown text for the given {@code components}.
 */
function subComponentsToMarkdown(components: StpaComponent[], tabs: string): string {
    let markdown = "";
    for (const component of components) {
        // translate component
        markdown += `${tabs} **${component.id}**: ${component.description}   \n`;
        if (component.subComponents) {
            // translate further subcomponents
            markdown += subComponentsToMarkdown(component.subComponents, tabs + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
        }
    }
    return markdown;
}

/**
 * Translates a single UCA to markdown.
 * @param component The UCA to translate.
 * @returns the markdown text for the given UCA.
 */
function ucaComponentToMarkdown(component: StpaComponent): string {
    let markdown = `<b>${component.id}</b>: ${component.description}`;
    if (component.references !== undefined && component.references !== "") {
        markdown += ` [${component.references}]`;
    }
    return markdown;
}

/**
 * Translates a single STPA component to markdown.
 * @param component The component to translate.
 * @returns the markdown text for the given {@code component}.
 */
function stpaComponentToMarkdown(component: StpaComponent): string {
    // Translation form: "**ID**: description [Refs]"
    let markdown = `**${component.id}**: ${component.description}`;
    // not all components have references
    if (component.references !== undefined && component.references !== "") {
        markdown += ` [${component.references}]`;
    }
    return markdown;
}

/**
 * Translates a record (responsibilities/loss scenarios) to markdown.
 * @param aspect The header of the aspect to translate.
 * @param data The data to translate.
 * @returns the markdown text for the given {@code data}.
 */
function recordToMarkdown(aspect: string, data: Record<string, StpaComponent[]>): string {
    let markdown = `## ${aspect}\n\n`;
    if (Object.keys(data).length === 0) {
        // extra text if no component is defined
        markdown += `No ${aspect} defined.\n`;
    } else {
        for (const reference in data) {
            // the components are grouped by their keys
            markdown += `_${reference}_  \n`;
            // translate the components
            for (const component of data[reference]) {
                markdown += stpaComponentToMarkdown(component);
                markdown += `  \n`;
            }
            markdown += `\n`;
        }
    }
    return markdown;
}

/**
 * Translates loss scenarios to markdown.
 * @param ucaScenarios The scenarios with reference to an UCA.
 * @param scenarios The scenarios without a reference to an UCA.
 * @param diagramSizes The widths of the diagrams to include.
 * @returns the markdown text for the given scenarios.
 */
function scenariosToMarkdown(ucaScenarios: Record<string, StpaComponent[]>, scenarios: StpaComponent[], diagramSizes: Record<string, number>): string {
    // translate the uca scenarios
    let markdown = recordToMarkdown(Headers.LossScenario, ucaScenarios);
    // translate the other scenarios
    if (scenarios.length !== 0) {
        markdown += `**Scenarios without associated UCA**\n\n`;
        markdown += scenarios.map(scenario => stpaComponentToMarkdown(scenario)).join("  \n");
        markdown += `\n`;
    }
    // add the diagram for the loss scenarios
    markdown += `\n<img src=".${SVG_PATH + SCENARIO_PATH}" width="${diagramSizes[SCENARIO_PATH] * SIZE_MULTIPLIER}">\n\n<br>\n\n`;
    return markdown;
}

/**
 * Translates the UCAs to a markdown table.
 * @param actionUcas The UCAs to translate.
 * @param diagramSizes The widths of the diagrams to include.
 * @returns the markdown table for the UCAs.
 */
function ucasToMarkdown(actionUcas: { controlAction: string, ucas: Record<string, StpaComponent[]>; }[], diagramSizes: Record<string, number>): string {
    let markdown = `## ${Headers.UCA}\n\n`;
    for (const actionUCA of actionUcas) {
        // for each control action a table is generated
        markdown += `### _${actionUCA.controlAction}_\n\n`;
        // header of the table containing the UCA types
        markdown += `<table border="1px"  border-collapse="collapse">\n<tr>\n<th>not provided</th>\n<th>provided</th>\n<th>too late or too early</th>\n<th>applied too long or stopped too soon</th>\n</tr>\n`;
        markdown += "<tr><td>\n";
        // add not provided UCAs
        markdown += actionUCA.ucas[UCA_TYPE.NOT_PROVIDED].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        // add provided UCAs
        markdown += actionUCA.ucas[UCA_TYPE.PROVIDED].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        // add wrong timing UCAs
        markdown += actionUCA.ucas[UCA_TYPE.WRONG_TIME].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n<td>\n";
        // add continous UCAs
        markdown += actionUCA.ucas[UCA_TYPE.CONTINUOUS].map(uca => ucaComponentToMarkdown(uca)).join("<br><br>");
        markdown += "</td>\n</tr>\n</table>\n\n<br>\n\n";
        // add the filtered diagram for the control action
        markdown += `<img src=".${SVG_PATH + "/" + actionUCA.controlAction.replace(".", "-") + ".svg"}" width="${diagramSizes["/" + actionUCA.controlAction.replace(".", "-") + ".svg"] * SIZE_MULTIPLIER}">\n\n<br><br>\n\n`;
    }
    // add a diagram for all UCAs
    markdown += `### _All UCAs_\n\n`;
    markdown += `<img src=".${SVG_PATH + UCA_PATH}" width="${diagramSizes[UCA_PATH] * SIZE_MULTIPLIER}">\n\n<br>\n\n`;
    return markdown;
}

/**
 * Adds a summary of the defined constraints.
 * @param data The STPA result data.
 * @param diagramSizes The widths of the diagrams to include.
 * @returns the markdown text for the summary of the defined constraints.
 */
function addSummary(data: StpaResult, diagramSizes: Record<string, number>): string {
    let markdown = `## ${Headers.summary}\n\n`;
    // add system-level constraints
    for (const component of data.systemLevelConstraints) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    // add controller constraints
    for (const component of data.controllerConstraints) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    // add safety constraints
    for (const component of data.safetyCons) {
        markdown += stpaComponentToMarkdown(component);
        markdown += `  \n`;
    }
    // add a diagram of the whole diagram
    markdown += `\n\n<img src=".${SVG_PATH + COMPLETE_GRAPH_PATH}" width="${diagramSizes[COMPLETE_GRAPH_PATH] * SIZE_MULTIPLIER}">\n\n`;
    return markdown;
}

/**
 * Creates the markdown text to include the control structure diagram.
 * @param diagramSizes The witdhs of the diagrams to include.
 * @returns the markdown text to include the control structure diagram.
 */
function addControlStructure(diagramSizes: Record<string, number>): string {
    let markdown = `## ${Headers.ControlStructure}\n\n`;
    markdown += `<img src=".${SVG_PATH + CONTROL_STRUCTURE_PATH}" width="${diagramSizes[CONTROL_STRUCTURE_PATH] * SIZE_MULTIPLIER}">\n\n<br>\n\n`;
    return markdown;
}

/**
 * Creates a copyright for the markdown file.
 * @returns the copyright for the markdown file.
 */
function addCopyRight(): string {
    const markdown = "<br><br>\n\nSTPA Report generated by PASTA, " + dayjs().format("YYYY-MM-DD HH:mm:ss") + " (https://github.com/kieler/stpa)";
    return markdown;
}

/**
 * Creates a table of contents for the markdown file.
 * @returns markdown text for the table of contents.
 */
function createTOC(): string {
    //TODO: use regex for the whitespace
    let markdown = "## Table of Contents\n\n";
    markdown += `1. [${Headers.Loss}](#${Headers.Loss.toLowerCase()})\n`;
    markdown += `2. [${Headers.Hazard}](#${Headers.Hazard.toLowerCase()})\n`;
    markdown += `3. [${Headers.SystemLevelConstraint}](#${Headers.SystemLevelConstraint.toLowerCase().replace(" ", "-")})\n`;
    markdown += `4. [${Headers.ControlStructure}](#${Headers.ControlStructure.toLowerCase().replace(" ", "-")})\n`;
    markdown += `5. [${Headers.Responsibility}](#${Headers.Responsibility.toLowerCase()})\n`;
    markdown += `6. [${Headers.UCA}](#${Headers.UCA.toLowerCase()})\n`;
    markdown += `7. [${Headers.ControllerConstraint}](#${Headers.ControllerConstraint.toLowerCase().replace(" ", "-")})\n`;
    markdown += `8. [${Headers.LossScenario}](#${Headers.LossScenario.toLowerCase().replace(" ", "-")})\n`;
    markdown += `9. [${Headers.SafetyRequirement}](#${Headers.SafetyRequirement.toLowerCase().replace(" ", "-")})\n`;
    markdown += `10. [${Headers.ControllerConstraint}](#${Headers.ControllerConstraint.toLowerCase().replace(" ", "-")})\n`;
    markdown += `11. [${Headers.summary}](#${Headers.summary.toLowerCase().replace(" ", "-").replace(" ", "-")})\n`;
    return markdown;
}

/* the paths for the several diagrams of the STPA aspects */
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

/* size multiplier for the diagrams */
const SIZE_MULTIPLIER = 0.85;