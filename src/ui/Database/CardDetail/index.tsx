/**
 * Database Card Detail View
 * Independent component for displaying card details in database section
 */
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Descriptions, type DescriptionsProps } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type CardMeta, fetchCard, fetchStrings, Region } from "@/api";
import {
    Attribute2StringCodeMap,
    extraCardTypes,
    isLinkMonster,
    isMonster,
    isPendulumMonster,
    Race2StringCodeMap,
    Type2StringCodeMap,
} from "@/common";
import { Background, CardEffectText, ScrollableArea, YgoCard } from "@/ui/Shared";

import styles from "./index.module.scss";

export const loader = () => null;

export const Component: React.FC = () => {
    const { cardId } = useParams<{ cardId: string }>();
    const navigate = useNavigate();
    const { t: i18n } = useTranslation("CardDetails");

    const code = parseInt(cardId || "0", 10);
    const [card, setCard] = useState<CardMeta>();

    useEffect(() => {
        if (code) {
            setCard(fetchCard(code));
        }
    }, [code]);

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
        navigate(-1); // Go back maintaining history (search params)
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
                        {i18n("BackToDatabase", "Volver")}
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
            </div>
        </div>
    );
};

Component.displayName = "DatabaseCardView";

function processPendulumString(input: string): string[] {
    const withoutArrows = input.replace(/←.*?→/g, "");
    const splitStrings = withoutArrows.split("【怪兽效果】");
    return splitStrings.map((s) => s.trim());
}
