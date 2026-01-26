/**
 * Vista de Solo Lectura para un Mazo
 * /decks/show/:deckName
 */
import { App, Button, Card, Col, Row, Space } from "antd";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, LoaderFunction, redirect, useNavigate, useParams } from "react-router-dom";
import { useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";
import { DndProvider } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";

import { type CardMeta, fetchCard } from "@/api";
import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, type IDeck, initStore } from "@/stores";
import { Background, DeckZone, ScrollableArea } from "@/ui/Shared";

import styles from "./index.module.scss";

// Loader para garantizar que los stores estén listos
export const loader: LoaderFunction = async ({ params }) => {
    // Esperar carga de mazos
    if (!initStore.decks) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "decks", (done) => done && rs());
        });
    }

    // Esperar prohibidas (para límites)
    if (!initStore.forbidden) {
        await new Promise<void>((rs) => {
            subscribeKey(initStore, "forbidden", (done) => done && rs());
        });
    }

    const deckName = params.deckName ? decodeURIComponent(params.deckName) : null;

    if (!deckName) return redirect("/decks");

    const deck = deckStore.get(deckName);
    if (!deck) return redirect("/decks");

    changeScene(AudioActionType.BGM_DECK);
    return { deck };
};

interface HydratedDeck {
    deckName: string;
    main: CardMeta[];
    extra: CardMeta[];
    side: CardMeta[];
}

export const Component: React.FC = () => {
    const { deckName } = useParams<{ deckName: string }>();
    const navigate = useNavigate();
    const { t: i18n } = useTranslation("BuildDeck"); // Reusing translations
    const [deck, setDeck] = useState<HydratedDeck>();

    useEffect(() => {
        if (deckName) {
            const decoded = decodeURIComponent(deckName);
            const found = deckStore.get(decoded);
            if (found) {
                // Hydrate the deck (convert IDs to CardMeta)
                Promise.all([
                    Promise.all(found.main.map(fetchCard)),
                    Promise.all(found.extra.map(fetchCard)),
                    Promise.all(found.side.map(fetchCard))
                ]).then(([main, extra, side]) => {
                    setDeck({
                        deckName: found.deckName,
                        main,
                        extra,
                        side
                    });
                });
            } else {
                navigate("/decks");
            }
        }
    }, [deckName, navigate]);

    if (!deck) return null;

    return (
        <DndProvider options={HTML5toTouch}>
            <div className={styles.container}>
                <Background />
                <div className={styles.content}>
                    <div className={styles.header}>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/decks")}
                                className={styles.backButton}
                            >
                                {i18n("Back", "Volver")}
                            </Button>
                            <h1 className={styles.title}>{deck.deckName}</h1>
                        </Space>

                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/decks/edit/${encodeURIComponent(deck.deckName)}`)}
                        >
                            {i18n("Edit", "Editar")}
                        </Button>
                    </div>

                    <ScrollableArea className={styles.deckArea}>
                        <div className={styles.stats}>
                            <Card size="small" className={styles.statCard}>
                                <div className={styles.statLabel}>Main</div>
                                <div className={styles.statValue}>{deck.main.length}</div>
                            </Card>
                            <Card size="small" className={styles.statCard}>
                                <div className={styles.statLabel}>Extra</div>
                                <div className={styles.statValue}>{deck.extra.length}</div>
                            </Card>
                            <Card size="small" className={styles.statCard}>
                                <div className={styles.statLabel}>Side</div>
                                <div className={styles.statValue}>{deck.side.length}</div>
                            </Card>
                        </div>

                        <div className={styles.zones}>
                            <div className={styles.zoneSection}>
                                <h3>Main Deck</h3>
                                <DeckZone
                                    type="main"
                                    cards={deck.main}
                                    canAdd={() => ({ result: false, reason: "" })} // Read only
                                    onChange={() => { }} // No-op
                                    onElementMouseUp={() => { }}
                                    is408={false}
                                />
                            </div>

                            <div className={styles.zoneSection}>
                                <h3>Extra Deck</h3>
                                <DeckZone
                                    type="extra"
                                    cards={deck.extra}
                                    canAdd={() => ({ result: false, reason: "" })}
                                    onChange={() => { }}
                                    onElementMouseUp={() => { }}
                                    is408={false}
                                />
                            </div>

                            <div className={styles.zoneSection}>
                                <h3>Side Deck</h3>
                                <DeckZone
                                    type="side"
                                    cards={deck.side}
                                    canAdd={() => ({ result: false, reason: "" })}
                                    onChange={() => { }}
                                    onElementMouseUp={() => { }}
                                    is408={false}
                                />
                            </div>
                        </div>
                    </ScrollableArea>
                </div>
            </div>
        </DndProvider>
    );
};

Component.displayName = "DeckShow";
