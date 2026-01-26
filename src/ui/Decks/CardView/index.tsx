/**
 * Card Detail View - Full page view of a card
 * Accessible from /decks/build/cards/:cardId or /decks/:deckName/cards/:cardId
 */
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Descriptions, type DescriptionsProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import { type CardMeta, fetchCard, fetchStrings, Region, searchCards } from "@/api";
import {
    Attribute2StringCodeMap,
    extraCardTypes,
    isLinkMonster,
    isMonster,
    isPendulumMonster,
    Race2StringCodeMap,
    Type2StringCodeMap,
} from "@/common";
import { emptySearchConditions } from "@/middleware/sqlite/fts";
import { DatabaseCard } from "@/ui/Database/DatabaseCard";
import { Background, CardEffectText, ScrollableArea, YgoCard } from "@/ui/Shared";

import styles from "./index.module.scss";

export const loader = () => null;

export const Component: React.FC = () => {
    const { cardId, deckId } = useParams<{ cardId: string; deckId: string }>();
    const navigate = useNavigate();
    const { t: i18n } = useTranslation("CardDetails");

    const code = parseInt(cardId || "0", 10);
    const [card, setCard] = useState<CardMeta>();
    const [relatedCards, setRelatedCards] = useState<CardMeta[]>([]);

    useEffect(() => {
        if (code) {
            setCard(fetchCard(code));
        }
    }, [code]);

    useEffect(() => {
        if (!card?.data.setcode) {
            setRelatedCards([]);
            return;
        }
        const setcode = card.data.setcode;
        if (setcode === 0) return;

        const timer = setTimeout(() => {
            try {
                const results = searchCards({
                    query: "",
                    conditions: {
                        ...emptySearchConditions,
                        setcode: setcode,
                    },
                });
                setRelatedCards(results.filter((c) => c.id !== code).slice(0, 12));
            } catch (e) {
                console.error(e);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [card, code]);

    const cardType = useMemo(
        () =>
            extraCardTypes(card?.data.type ?? 0)
                .map((t) => fetchStrings(Region.System, Type2StringCodeMap.get(t) || 0))
                .join(" / "),
        [card?.data.type],
    );

    const desc = useMemo(
        () =>
            isPendulumMonster(card?.data.type ?? 0)
                ? processPendulumString(card?.text.desc ?? "")
                : [card?.text.desc],
        [card?.text.desc],
    );

    const items = useMemo(() => {
        const result: DescriptionsProps["items"] = [];
        if (card?.data.level) {
            result.push({
                label: i18n("Level"),
                children: card?.data.level,
            });
        }

        result.push({
            label: i18n("Type"),
            children: cardType,
            span: 2,
        });

        if (card?.data.attribute) {
            result.push({
                label: i18n("Attribute"),
                children: fetchStrings(
                    Region.System,
                    Attribute2StringCodeMap.get(card?.data.attribute ?? 0) || 0,
                ),
            });
        }

        if (card?.data.race) {
            result.push({
                label: i18n("Race"),
                children: fetchStrings(
                    Region.System,
                    Race2StringCodeMap.get(card?.data.race ?? 0) || 0,
                ),
                span: 2,
            });
        }

        if (isMonster(card?.data.type ?? 0)) {
            result.push({
                label: i18n("Attack"),
                children: card?.data.atk,
            });

            if (!isLinkMonster(card?.data.type ?? 0)) {
                result.push({
                    label: i18n("Defence"),
                    children: card?.data.def,
                });
            }

            if (card?.data.lscale) {
                result.push({
                    label: i18n("PendulumScale"),
                    children: (
                        <>
                            ← {card.data.lscale} - {card.data.rscale} →
                        </>
                    ),
                });
            }
        }
        return result;
    }, [card, cardType, i18n]);

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className={styles.container}>
            <Background />
            <div className={styles.content}>
                <div className={styles.header}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                        className={styles.backButton}
                    >
                        {i18n("BackToDeck", "Volver al Deck")}
                    </Button>
                </div>

                <div className={styles.cardLayout}>
                    <div className={styles.cardImage}>
                        <a href={`https://ygocdb.com/card/${code}`} target="_blank" rel="noopener noreferrer">
                            <YgoCard className={styles.card} code={code} />
                        </a>
                    </div>

                    <div className={styles.cardInfo}>
                        <h1 className={styles.cardName}>{card?.text.name}</h1>

                        <ScrollableArea className={styles.scrollArea}>
                            <Descriptions
                                layout="vertical"
                                size="small"
                                items={items}
                                className={styles.descriptions}
                            />
                            <Descriptions
                                layout="vertical"
                                size="small"
                                className={styles.descriptions}
                                items={desc.filter(Boolean).map((d, i) => ({
                                    label:
                                        desc.length > 1
                                            ? i
                                                ? i18n("MonsterEffect")
                                                : i18n("PendulumEffect")
                                            : i18n("CardEffect"),
                                    span: 3,
                                    children: <CardEffectText desc={d} />,
                                }))}
                            />
                        </ScrollableArea>
                    </div>
                </div>

                {relatedCards.length > 0 && (
                    <div className={styles.relatedSection}>
                        <h2 className={styles.sectionTitle}>{i18n("RelatedCards", "Cartas Relacionadas")}</h2>
                        <div className={styles.relatedGrid}>
                            {relatedCards.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`../${c.id}`}
                                    relative="path"
                                    className={styles.relatedCardItem}
                                >
                                    <DatabaseCard value={c} />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

Component.displayName = "CardView";

function processPendulumString(input: string): string[] {
    const withoutArrows = input.replace(/←.*?→/g, "");
    const splitStrings = withoutArrows.split("【怪兽效果】");
    return splitStrings.map((s) => s.trim());
}
