/**
 * Edit existing deck page
 * Loads deck by name from URL params and renders the BuildDeck editor
 */
import { App } from "antd";
import { useEffect } from "react";
import { LoaderFunction, redirect, useNavigate, useParams } from "react-router-dom";
import { subscribeKey } from "valtio/utils";

import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, initStore } from "@/stores";

import { setSelectedDeck } from "../BuildDeck";
import { Component as BuildDeckComponent, loader as buildDeckLoader } from "../BuildDeck";

export const loader: LoaderFunction = async ({ params }) => {
    // Run the BuildDeck loader first to ensure all dependencies are loaded
    await buildDeckLoader({ params, request: new Request("") } as any);

    // Decode the deck name from URL
    const deckName = params.deckName ? decodeURIComponent(params.deckName) : null;

    if (!deckName) {
        return redirect("/decks");
    }

    // Ensure decks are loaded
    if (!initStore.decks) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "decks", (done) => done && rs());
        });
    }

    // Find the deck
    const deck = deckStore.get(deckName);
    if (!deck) {
        // Deck not found, redirect to decks list
        return redirect("/decks");
    }

    // Set the selected deck
    setSelectedDeck(deck);

    changeScene(AudioActionType.BGM_DECK);
    return { deckName, deck };
};

export const Component: React.FC = () => {
    const { deckName } = useParams<{ deckName: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();

    useEffect(() => {
        if (deckName) {
            const decodedName = decodeURIComponent(deckName);
            const deck = deckStore.get(decodedName);
            if (deck) {
                setSelectedDeck(deck);
            } else {
                message.error(`Deck "${decodedName}" not found`);
                navigate("/decks");
            }
        }
    }, [deckName]);

    return <BuildDeckComponent />;
};

Component.displayName = "EditDeck";
