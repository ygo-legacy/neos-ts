import {
  CheckOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { App, Button, Input, message, Space, Tooltip } from "antd";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd-multi-backend";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";

import { type CardMeta } from "@/api";
import { isExtraDeckCard } from "@/common";
import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore, emptyDeck, type IDeck, initStore } from "@/stores";
import {
  Background,
  DeckCardMouseUpEvent,
  DeckZone,
  Loading,
  ScrollableArea,
  Select,
} from "@/ui/Shared";
import { Type } from "@/ui/Shared/DeckZone";

import { CardDetail } from "./CardDetail";
import { DeckDatabase } from "./DeckDatabase";
import { DeckSelect } from "./DeckSelect";
import styles from "./index.module.scss";
import { editDeckStore } from "./store";
import {
  copyDeckToClipboard,
  downloadDeckAsYDK,
  editingDeckToIDeck,
  iDeckToEditingDeck,
} from "./utils";

const ENV_OCG = 0;
const ENV_408 = 1;

export const loader: LoaderFunction = async () => {
  // 必须先加载卡组，不然页面会崩溃
  if (!initStore.decks) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "decks", (done) => done && rs());
    });
  }

  // 同时，等待禁卡表的加载
  if (!initStore.forbidden) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "forbidden", (done) => done && rs());
    });
  }

  // 最后，等待I18N文案的加载
  if (!initStore.i18n) {
    await new Promise<void>((rs) => {
      subscribeKey(initStore, "i18n", (done) => done && rs());
    });
  }

  // 更新场景
  changeScene(AudioActionType.BGM_DECK);

  return null;
};

export const selectedCard = proxy({
  id: 23995346,
  open: false,
});

const selectedDeck = proxy<{ deck: IDeck }>({
  deck: deckStore.decks.at(0) ?? emptyDeck,
});

export const setSelectedDeck = (deck: IDeck) => {
  selectedDeck.deck = deck;
};

export const Component: React.FC = () => {
  const snapDecks = useSnapshot(deckStore);
  const { progress } = useSnapshot(initStore.sqlite);
  const { deck: snapSelectedDeck } = useSnapshot(selectedDeck);
  const [collapsed, setCollapsed] = useState(true);

  // Lifted state from DeckEditor
  const snapEditDeck = useSnapshot(editDeckStore);
  const [deckName, setDeckName] = useState(editDeckStore.deckName);
  const [env, setEnv] = useState(ENV_OCG);

  const { message } = App.useApp();
  const { t: i18n } = useTranslation("BuildDeck");
  const navigate = useNavigate();

  const handleEnvChange = (value: any) => setEnv(value);

  // Sync effects lifted from DeckEditor
  useEffect(() => {
    iDeckToEditingDeck(selectedDeck.deck).then(editDeckStore.set);
    setDeckName(selectedDeck.deck.deckName);
  }, [selectedDeck.deck]);

  useEffect(() => {
    editDeckStore.deckName = deckName;
  }, [deckName]);

  const handleDeckEditorReset = async () => {
    editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
    message.info(`${i18n("ResetSuccessful")}`);
  };

  const handleDeckEditorSave = async () => {
    const tmpIDeck = editingDeckToIDeck(editDeckStore);
    const result = await deckStore.update(selectedDeck.deck.deckName, tmpIDeck);
    if (result) {
      setSelectedDeck(tmpIDeck);
      message.info(`${i18n("SaveSuccessful")}`);
      editDeckStore.edited = false;
    } else {
      editDeckStore.set(await iDeckToEditingDeck(selectedDeck.deck as IDeck));
      message.error("保存失败");
      editDeckStore.edited = false;
    }
  };

  const handleDeckEditorShuffle = () => {
    editDeckStore.shuffle(editDeckStore);
  };

  const handleDeckEditorSort = () => {
    editDeckStore.sort(editDeckStore);
  };

  return (
    <DndProvider options={HTML5toTouch}>
      <Background />
      <div className={styles.layout} style={{ width: "100%" }}>
        <div
          className={`${styles.sider} ${collapsed ? styles.collapsed : ""}`}
        >
          <div
            className={styles["sider-toggle"]}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
          </div>
          <div className={styles["sider-content"]}>
            <ScrollableArea className={styles["deck-select-container"]}>
              <DeckSelect
                decks={snapDecks.decks as IDeck[]}
                selected={snapSelectedDeck.id}
                onSelect={(id) => navigate(`/decks/edit/${id}`)}
                onDelete={async (name) => await deckStore.delete(name)}
                onDownload={(name) => {
                  const deck = deckStore.get(name);
                  if (deck) downloadDeckAsYDK(deck);
                }}
                onCopy={async (name) => {
                  const deck = deckStore.get(name);
                  if (deck) return await copyDeckToClipboard(deck);
                  else return false;
                }}
              />
            </ScrollableArea>
            <HigherCardDetail />
          </div>
        </div>
        <div className={styles.content}>
          {progress === 1 ? (
            <>
              <div className={styles.deckHeader}>
                <div className={styles.nameRow}>
                  <Input
                    placeholder={i18n("EnterTheDeckName")}
                    variant="borderless"
                    size="large"
                    prefix={<EditOutlined />}
                    className={styles.deckNameInput}
                    onChange={(e) => setDeckName(e.target.value)}
                    value={deckName}
                  />
                </div>
                <div className={styles.toolbar}>
                  <Space className={styles.actions} size={8}>
                    <Select
                      title={i18n("Environment")}
                      value={env}
                      options={[
                        {
                          value: ENV_OCG,
                          label: "OCG",
                        },
                        {
                          value: ENV_408,
                          label: "408",
                        },
                      ]}
                      onChange={handleEnvChange}
                    />
                    <Button
                      type="text"
                      icon={<SwapOutlined />}
                      onClick={handleDeckEditorShuffle}
                    >
                      {i18n("Shuffle")}
                    </Button>
                    <Button
                      type="text"
                      icon={<RetweetOutlined />}
                      onClick={handleDeckEditorSort}
                    >
                      {i18n("Sort")}
                    </Button>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={editDeckStore.clear}
                    >
                      {i18n("Clear")}
                    </Button>
                    <Button
                      type="text"
                      icon={<UndoOutlined />}
                      onClick={() => handleDeckEditorReset()}
                    >
                      {i18n("Reset")}
                    </Button>
                    <Button
                      type={snapEditDeck.edited ? "primary" : "default"}
                      ghost={!snapEditDeck.edited}
                      icon={<CheckOutlined />}
                      onClick={() => handleDeckEditorSave()}
                    >
                      {i18n("Save")}
                    </Button>
                  </Space>
                </div>
              </div>
              <div className={styles.workspace}>
                <div className={styles.deck}>
                  <DeckEditor
                    deck={snapSelectedDeck as IDeck}
                    env={env}
                  />
                </div>
                <div className={styles.select}>
                  <DeckDatabase />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.container}>
              <Loading progress={progress * 100} />
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
Component.displayName = "Build";

/** 正在编辑的卡组 */
export const DeckEditor: React.FC<{
  deck: IDeck;
  env: number;
}> = ({ deck, env }) => {
  const snapEditDeck = useSnapshot(editDeckStore);

  const handleSwitchCard = (type: Type, card: CardMeta) => {
    const cardType = card.data.type ?? 0;
    const isSide = type === "side";
    const targetType = isSide
      ? isExtraDeckCard(cardType)
        ? "extra"
        : "main"
      : "side";
    const { result, reason } = editDeckStore.canAdd(card, targetType, type);
    if (result) {
      editDeckStore.remove(type, card);
      editDeckStore.add(targetType, card);
    } else {
      message.error(reason); // 'message' is imported globally in module scope? No, it was from useApp hooks in component.
      // DeckEditor needs useApp() message if we remove it?
      // Wait, 'message' from 'antd' static is deprecated/warned sometimes but works if inside App?
      // Better to use App.useApp().
    }
  };

  const { message } = App.useApp(); // Add hook here

  const showSelectedCard = (card: CardMeta) => {
    selectedCard.id = card.id;
    selectedCard.open = true;
  };

  const handleMouseUp = (
    type: "main" | "extra" | "side",
    payload: DeckCardMouseUpEvent,
  ) => {
    const { event, card } = payload;
    switch (event.button) {
      // 左键
      case 0:
        showSelectedCard(card);
        break;
      // 中键
      case 1:
        handleSwitchCard(type, card);
        break;
      // 右键
      case 2:
        editDeckStore.remove(type, card);
        break;
      default:
        break;
    }
    event.preventDefault();
  };

  return (
    <div className={styles.container}>
      <ScrollableArea className={styles["deck-zone"]}>
        {(["main", "extra", "side"] as const).map((type) => (
          <DeckZone
            key={type}
            type={type}
            cards={[...snapEditDeck[type]]}
            canAdd={editDeckStore.canAdd}
            onChange={(card, source, destination) => {
              editDeckStore.add(destination, card);
              if (source !== "search") {
                editDeckStore.remove(source, card);
              }
            }}
            onElementMouseUp={(event) => handleMouseUp(type, event)}
            onDoubleClick={(card) => {
              if (editDeckStore.canAdd(card, type, "search").result) {
                editDeckStore.add(type, card);
              }
            }}
            is408={env === ENV_408}
          />
        ))}
      </ScrollableArea>
    </div>
  );
};

const HigherCardDetail: React.FC = () => {
  const { id, open } = useSnapshot(selectedCard);
  return (
    <CardDetail
      open={open}
      code={id}
      onClose={() => (selectedCard.open = false)}
    />
  );
};
