import React, { memo, useState } from "react";
import { CardMeta, forbidden, forbidden_408, getCardImgUrl } from "@/api";
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const limitCnt = is408 ? forbidden_408.get(value) : forbidden.get(value);
    const imgSrc = getCardImgUrl(value.id);

    return (
        <div className={styles.card} onClick={onClick}>
            {/* Loading Placeholder (Card Back) */}
            <div
                className={styles.placeholder}
                style={{
                    opacity: loading && !error ? 1 : 0,
                    visibility: loading && !error ? "visible" : "hidden",
                    transition: "opacity 0.5s ease-in-out, visibility 0.5s ease-in-out"
                }}
            >
                <YgoCard isBack code={0} className={styles.cardcover} />
            </div>

            {/* Hidden image to trigger load event - MERGED with Real Card */}

            {/* Real Card as Image */}
            <img
                src={imgSrc}
                className={styles.cardcover}
                style={{
                    opacity: loading ? 0 : 1,
                    transition: "opacity 0.3s ease-in-out",
                    zIndex: 1,
                    display: error ? "none" : "block" // Hide completely if error
                }}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setError(true);
                    setLoading(false);
                }}
                alt={value.text.name}
            />

            {(loading || error) && <div className={styles.cardname}>{value.text.name}</div>}

            {!loading && limitCnt !== undefined && (
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
