/**
 * Create new deck page
 * Starts with an empty deck instead of loading an existing one
 */
import { useEffect } from "react";
import { LoaderFunction } from "react-router-dom";
import { subscribeKey } from "valtio/utils";

import { AudioActionType, changeScene } from "@/infra/audio";
import { emptyDeck, initStore } from "@/stores";

import { setSelectedDeck } from "../BuildDeck";
import { Component as BuildDeckComponent } from "../BuildDeck";

export const loader: LoaderFunction = async () => {
    // Wait for decks to load
    if (!initStore.decks) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "decks", (done) => done && rs());
        });
    }

    // Wait for forbidden list
    if (!initStore.forbidden) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "forbidden", (done) => done && rs());
        });
    }

    // Wait for i18n
    if (!initStore.i18n) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "i18n", (done) => done && rs());
        });
    }

    // Set empty deck for new creation
    const newDeckName = `New Deck ${new Date().toLocaleTimeString()}`;
    setSelectedDeck({ ...emptyDeck, deckName: newDeckName });

    changeScene(AudioActionType.BGM_DECK);
    return null;
};

export const Component: React.FC = () => {
    useEffect(() => {
        // Ensure we start with a fresh empty deck
        const newDeckName = `New Deck ${new Date().toLocaleTimeString()}`;
        setSelectedDeck({ ...emptyDeck, deckName: newDeckName });
    }, []);

    return <BuildDeckComponent />;
};

Component.displayName = "NewDeck";
