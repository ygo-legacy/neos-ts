import { EditOutlined } from "@ant-design/icons";
import { App, Button, Modal, Space } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, resetUniverse, roomStore } from "@/stores";
import { Background, Select } from "@/ui/Shared";
import { setSelectedDeck } from "@/ui/Decks/BuildDeck";

import styles from "./index.module.scss";
import { ReplayModal, replayOpen } from "./ReplayModal";
import { RankedMode, IAMode, PrivateMode } from "./match-making";
import { IconFont, ScrollableArea } from "@/ui/Shared";

export const loader: LoaderFunction = () => {
  // Reset stores before loading this page
  resetUniverse();
  // Update current scene audio
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const { message } = App.useApp();
  const { decks } = deckStore;
  const [deckName, setDeckName] = useState(decks.at(0)?.deckName ?? "");
  const { joined } = useSnapshot(roomStore);
  const navigate = useNavigate();
  const { t: i18n } = useTranslation("Match");

  useEffect(() => {
    if (joined) {
      Modal.destroyAll();
      navigate(`/waitroom`);
    }
  }, [joined]);

  return (
    <>
      <Background />
      <div className={styles.container}>
        <div className={styles.wrap}>
          <Space size={16}>
            <Select
              title={i18n("Deck")}
              showSearch
              value={deckName}
              style={{ width: 200 }}
              onChange={(value) => {
                // @ts-ignore
                const item = deckStore.get(value);
                if (item) {
                  setDeckName(item.deckName);
                } else {
                  message.error(`Deck ${value} not found`);
                }
              }}
              options={decks.map((deck) => ({
                value: deck.deckName,
                label: deck.deckName,
              }))}
            />
            <Button
              style={{ width: 150 }}
              icon={<EditOutlined />}
              onClick={() => {
                const deck = deckStore.get(deckName);
                if (deck) {
                  setSelectedDeck(deck);
                }
                navigate("/build");
              }}
              size="large"
            >
              {i18n("DeckEdit")}
            </Button>
          </Space>
          <div className={styles["mode-select"]}>
            {/* Ranked Mode - Matchmaking competitivo */}
            <RankedMode />

            {/* Private Room - Sala privada con amigos */}
            <PrivateMode />

            {/* Single Player - Modo contra IA */}
            <IAMode />


            {/* Replay - Ver repeticiones */}
            <Mode
              title={i18n("ReplayTitle")}
              desc={i18n("ReplayDesc")}
              icon={<IconFont type="icon-record" size={24} />}
              onClick={replayOpen}
            />
          </div>
        </div>
      </div>
      <ReplayModal />
    </>
  );
};
Component.displayName = "Match";

// Helper component for additional modes (like Replay)
const Mode: React.FC<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ title, desc, icon, onClick }) => (
  <div className={styles.mode} onClick={onClick}>
    <ScrollableArea maxHeight="15rem">
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.desc}>{desc}</div>
    </ScrollableArea>
  </div>
);

