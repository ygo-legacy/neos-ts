import React, { memo, useState } from "react";
import { CardMeta, forbidden, forbidden_408 } from "@/api";
import { useConfig } from "@/config";
import { YgoCard } from "@/ui/Shared";
import styles from "./DatabaseCard.module.scss";

const { assetsPath } = useConfig();

/** 
 * Simplified Card for Database View (No Drag and Drop)
 * Visual clone of DeckCard but click-only
 */
export const DatabaseCard: React.FC<{
    value: CardMeta;
    onClick?: () => void;
    is408?: boolean;
}> = memo(({ value, onClick, is408 }) => {
    const [showText, setShowText] = useState(true);
    const limitCnt = is408 ? forbidden_408.get(value) : forbidden.get(value);

    return (
        <div
            className={styles.card}
            onClick={onClick}
        >
            {showText && <div className={styles.cardname}>{value.text.name}</div>}
            <YgoCard
                className={styles.cardcover}
                code={value.id}
                onLoad={() => setShowText(false)}
            />
            {limitCnt !== undefined && (
                <img
                    className={styles.cardlimit}
                    src={`${assetsPath}/Limit0${limitCnt}.png`}
                    alt={`Limit ${limitCnt}`}
                />
            )}
        </div>
    );
});

DatabaseCard.displayName = "DatabaseCard";
