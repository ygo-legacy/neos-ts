import { Button, Descriptions, type DescriptionsProps } from "antd";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CardMeta, fetchCard, fetchStrings, Region, searchCards } from "@/api";
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
import { CardEffectText, IconFont, ScrollableArea, YgoCard } from "@/ui/Shared";

import { selectedCard } from "../store";
import styles from "./index.module.scss";

export const CardDetail: React.FC<{
  code: number;
  open: boolean;
  onClose: () => void;
}> = ({ code, open, onClose }) => {
  const { t: i18n } = useTranslation("CardDetails");
  const [card, setCard] = useState<CardMeta>();
  useEffect(() => {
    setCard(fetchCard(code));
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
  }, [card]);

  const [relatedCards, setRelatedCards] = useState<CardMeta[]>([]);

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

  return (
    <div className={classNames(styles.detail, { [styles.open]: open })}>
      <div className={styles.container}>
        {/* Internal close button removed */}
        <a href={`https://ygocdb.com/card/${code}`} target="_blank">
          <YgoCard className={styles.card} code={code} />
        </a>
        <a
          href={`https://ygocdb.com/card/${code}`}
          target="_blank"
          style={{
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            textDecoration: "underline",
          }}
        >
          YGOCDB
        </a>
        <div className={styles.title}>
          <span>{card?.text.name}</span>
        </div>
        <ScrollableArea>
          <Descriptions layout="vertical" size="small" items={items} />
          <Descriptions
            layout="vertical"
            size="small"
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
          ></Descriptions>
          {relatedCards.length > 0 && (
            <div className={styles.relatedSection}>
              <div className={styles.sectionTitle}>
                {i18n("RelatedCards", "Cartas relacionadas")}
              </div>
              <div className={styles.relatedGrid}>
                {relatedCards.map((c) => (
                  <div
                    key={c.id}
                    className={styles.relatedCardItem}
                    onClick={() => {
                      selectedCard.id = c.id;
                    }}
                  >
                    <DatabaseCard value={c} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollableArea>
      </div>
    </div>
  );
};

function processPendulumString(input: string): string[] {
  // 删除形如“← ... →”的结构
  const withoutArrows = input.replace(/←.*?→/g, "");

  // 以 "【怪兽效果】" 作为分隔符切割字符串
  const splitStrings = withoutArrows.split("【怪兽效果】");

  // 返回切割后的字符串列表
  return splitStrings.map((s) => s.trim());
}
