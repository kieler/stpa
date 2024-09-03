/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
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

import { Memento } from "vscode";

/**
 * Service that persists option in the workspace state.
 */
export class StorageService {
    private static readonly key = "pastaPersistence";

    private memento: Memento;

    constructor(memento: Memento) {
        this.memento = memento;

        const data = this.getData();
        console.log("Persisted data:", data);
    }

    /** Removes all persisted data. Useful to nuke persisted data to a fresh state. */
    static clearAll(memento: Memento): void {
        memento.update(StorageService.key, {});
    }

    /**
     * Retrieves the data from the memento.
     * @returns the data from the memento.
     */
    private getData(): Record<string, Record<string, any>> {
        return this.memento.get<Record<string, any>>(StorageService.key) ?? {};
    }

    /**
     * Sets the value for the given key.
     * @param key The key to store the value under.
     * @param value The value to store.
     */
    setItem(key: string, value: any): void {
        const data = this.getData();
        data[key] = value;

        this.updateData(data);
    }

    /**
     * Retrieves the value for the given key.
     * @param key The key to retrieve the value for.
     * @returns the value for the given key.
     */
    getItem(key: string): Record<string, any> {
        const data = this.getData();
        return data[key];
    }

    /**
     * Retrieves all items.
     * @returns all items.
     */
    getAllItems(): Record<string, any> {
        return this.getData();
    }

    /**
     * Updates the memento with the given data.
     * @param data the data to update.
     */
    private updateData(data: Record<string, Record<string, any>>): void {
        this.memento.update(StorageService.key, data);
    }
}
