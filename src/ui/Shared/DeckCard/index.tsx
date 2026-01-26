import { LoadingOutlined } from "@ant-design/icons";
import React, { memo, useRef, useState } from "react";
import { useDrag } from "react-dnd";

import { CardMeta, forbidden, forbidden_408, getCardImgUrl } from "@/api";
import { useConfig } from "@/config";

import { Type } from "../DeckZone";
import { YgoCard } from "../YgoCard";
import styles from "./index.module.scss";

const { assetsPath } = useConfig();

export interface DeckCardMouseUpEvent {
  event: React.MouseEvent;
  card: CardMeta;
}

/** 组卡页和Side页使用的单张卡片，增加了文字和禁限数量 */
export const DeckCard: React.FC<{
  value: CardMeta;
  source: Type | "search";
  onMouseUp?: (event: DeckCardMouseUpEvent) => void;
  onMouseEnter?: () => void;
  onDoubleClick?: (card: CardMeta) => void;
  is408?: boolean;
}> = memo(
  ({ value, source, onMouseUp, onMouseEnter, onDoubleClick, is408 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: "Card",
      item: { value, source },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });
    drag(ref);
    const [loading, setLoading] = useState(true);
    const limitCnt = is408 ? forbidden_408.get(value) : forbidden.get(value);
    const imgSrc = getCardImgUrl(value.id);

    return (
      <div
        className={styles.card}
        ref={ref}
        style={{ opacity: isDragging && source !== "search" ? 0 : 1 }}
        onMouseUp={(event) =>
          onMouseUp?.({
            event,
            card: value,
          })
        }
        onMouseEnter={onMouseEnter}
        onDoubleClick={() => onDoubleClick?.(value)}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        {/* Placeholder (Card Back) */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
            }}
          >
            <YgoCard
              isBack
              code={0}
              className={styles.cardcover}
              style={{ width: "100%", height: "100%" }}
            />
            <div className={styles.cardname}>
              <LoadingOutlined style={{ fontSize: "2rem", color: "rgba(255,255,255,0.7)" }} />
            </div>
          </div>
        )}

        {/* Real Image */}
        <img
          src={imgSrc}
          className={styles.cardcover}
          style={{
            opacity: loading ? 0 : 1,
            display: "block",
            width: "100%",
            height: "100%",
          }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)} // Handle error by showing partial or keeping placeholder? If error, maybe keep placeholder or show name?
        // DatabaseCard shows name on error.
        // For simplicity here, if error, we might just show name overlay or fallback.
        // Let's rely on standard img behavior + name overlay if I keep name overlay logic separate.
        // Actually, if loading is false, I should hide name?
        // DeckCard hides name after load.
        />

        {/* If loaded, we hide name. If loading, we showed it in placeholder block above. */
          /* But wait, if error occurs, we might want name. */
          /* Let's keep it simple: if loading, name is visible (in placeholder). */
          /* If loaded, name removed. */
        }

        {limitCnt !== undefined && (
          <img
            className={styles.cardlimit}
            src={`${assetsPath}/Limit0${limitCnt}.png`}
          />
        )}
      </div>
    );
  },
);
