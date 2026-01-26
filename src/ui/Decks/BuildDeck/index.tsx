
import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  DownloadOutlined,
  EditOutlined,
  FileAddOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  RetweetOutlined,
  SwapOutlined,
  UndoOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Input, Space, Tooltip } from "antd";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useEffect, useRef, useState, useCallback } from "react";
import { DndProvider } from "react-dnd-multi-backend";
import { useTranslation } from "react-i18next";
import {
  LoaderFunction,
  useNavigate,
  useParams,
  unstable_useBlocker as useBlocker,
  useBeforeUnload,
} from "react-router-dom";
import { proxy, useSnapshot } from "valtio";
import { subscribeKey } from "valtio/utils";
import YGOProDeck from "ygopro-deck-encode";

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
import { DeckSelect, DeckUploader } from "./DeckSelect";
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
const DEFAULT_DECK_CASE = 1082012;

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
  const snapSelectedCard = useSnapshot(selectedCard);

  // Lifted state from DeckEditor
  const snapEditDeck = useSnapshot(editDeckStore);
  const [deckName, setDeckName] = useState(editDeckStore.deckName);
  const [env, setEnv] = useState(ENV_OCG);

  const { message, modal } = App.useApp();
  const { t: i18n } = useTranslation("BuildDeck");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id && snapDecks.decks.length) {
      const deck = snapDecks.decks.find(d => d.id === id);
      if (deck) {
        setSelectedDeck(deck as IDeck);
      }
    }
  }, [id, snapDecks.decks]);

  const newDeck = useRef<IDeck[]>([]);

  /** 创建卡组，直接给一个命名，用户可以手动修改，无需modal打断流程 */
  const createNewDeck = async () => {
    const deckName = new Date().toLocaleString();
    const id = crypto.randomUUID();
    await deckStore.add({
      id,
      deckName,
      main: [],
      extra: [],
      side: [],
    });
    navigate(`/decks/edit/${id}`);
  };

  const deleteCurrentDeck = () => {
    modal.confirm({
      title: i18n("ConfirmDelete", "¿Estás seguro de eliminar este mazo?"),
      onOk: async () => {
        await deckStore.delete(selectedDeck.deck.deckName);
        // Navigate to the first deck if available, else clear
        const remaining = deckStore.decks.filter(d => d.id !== selectedDeck.deck.id);
        if (remaining.length > 0) {
          navigate(`/decks/edit/${remaining[0].id}`);
        } else {
          // Create empty or handle empty state?
          // For now just stay or go to root?
          navigate("/decks");
        }
      }
    });
  };

  const showUploadModal = () =>
    modal.info({
      width: 600,
      centered: true,
      icon: null,
      content: (
        <DeckUploader
          onLoaded={(deck) => {
            newDeck.current.push(deck);
          }}
        />
      ),
      okText: i18n("Upload", "Subir"),
      maskClosable: true,
      onOk: async () => {
        const results = await Promise.all(
          newDeck.current.map((deck) => deckStore.add(deck)),
        );
        newDeck.current = [];
        if (results.length)
          results.every(Boolean)
            ? message.success(i18n("UploadSuccess", "Subida exitosa"))
            : message.error(i18n("UploadPartiallyFailed", "Fallo parcial en la subida"));
      },
    });

  /** 从剪贴板导入 */
  const importFromClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .readText()
        .then((text) => {
          const deck = YGOProDeck.fromYdkString(text);
          if (
            !(deck.main.length + deck.extra.length + deck.side.length === 0)
          ) {
            const deckName = new Date().toLocaleString();
            const id = crypto.randomUUID();
            deckStore
              .add({
                id,
                deckName,
                ...deck,
              })
              .then((result) => {
                if (result) {
                  message.success(i18n("ImportSuccess", "Importación exitosa"));
                  navigate(`/decks/edit/${id}`);
                } else {
                  message.error(i18n("ParseFailed", "Fallo al analizar"));
                }
              });
          } else {
            message.error(i18n("ParseFailed", "Fallo al analizar"));
          }
        })
        .catch((err) => {
          message.error("Error reading clipboard: " + err);
        });
    } else {
      message.error("Clipboard API not supported");
    }
  };

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

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (snapEditDeck.edited) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [snapEditDeck.edited]
    )
  );

  const blocker = useBlocker(
    // @ts-ignore
    ({ currentLocation, nextLocation }) =>
      snapEditDeck.edited && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      modal.confirm({
        title: i18n("UnsavedChanges", "Cambios sin guardar"),
        content: i18n("ConfirmDiscard", "¿Tienes cambios sin guardar. ¿Estás seguro de que quieres salir y descartar los cambios?"),
        okText: i18n("DiscardAndLeave", "Descartar y Salir"),
        okType: "danger",
        cancelText: i18n("Stay", "Permanecer"),
        onOk: () => {
          blocker.proceed();
        },
        onCancel: () => {
          blocker.reset();
        },
      });
    }
  }, [blocker, modal, i18n]);

  useEffect(() => {
    return () => {
      selectedCard.open = false;
      selectedCard.id = 0;
    };
  }, []);

  return (
    <DndProvider options={HTML5toTouch}>
      <Background />
      <div className={styles["layout-scroll"]} style={{ width: "100%" }}>
        {snapSelectedCard.open && (
          <div className={styles.detailPanel}>
            <div className={styles["folder-header"]}>
              <span className={styles.title}>
                {i18n("CardDetail", "Detalle de Carta")}
              </span>
              <Button
                type="text"
                size="small"
                className={styles["btn-close-header"]}
                icon={<CloseOutlined style={{ color: "white" }} />}
                onClick={() => {
                  selectedCard.open = false;
                }}
              />
            </div>
            <HigherCardDetail />
          </div>
        )}
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
                  <div className={styles.headerActions}>
                    <Tooltip title={i18n("CreateNewDeck", "Crear Mazo")}>
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={createNewDeck}
                      />
                    </Tooltip>
                    <Tooltip title={i18n("ImportFromLocalFile", "Importar Archivo")}>
                      <Button
                        type="text"
                        icon={<FileAddOutlined />}
                        onClick={showUploadModal}
                      />
                    </Tooltip>
                    <Tooltip title={i18n("ImportFromClipboard", "Portapapeles")}>
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={importFromClipboard}
                      />
                    </Tooltip>
                    <Tooltip title={i18n("DeleteDeck", "Eliminar Mazo")}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={deleteCurrentDeck}
                      />
                    </Tooltip>
                  </div>
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
                    {snapEditDeck.edited && (
                      <Button
                        type="primary"
                        className={styles.saveBtn}
                        icon={<CheckOutlined />}
                        onClick={() => handleDeckEditorSave()}
                      >
                        {i18n("Save")}
                      </Button>
                    )}
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
  const { message } = App.useApp();

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
      message.error(reason);
    }
  };

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

