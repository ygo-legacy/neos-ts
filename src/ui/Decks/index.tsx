import {
    CopyOutlined,
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    PlusOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Empty, Popconfirm } from "antd";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { uploadDeck } from "@/api";
import { AudioActionType, changeScene } from "@/infra/audio";
import { accountStore, deckStore, type IDeck } from "@/stores";
import { Background } from "@/ui/Shared";

import {
    copyDeckToClipboard,
    downloadDeckAsYDK,
    genYdkText,
} from "./BuildDeck/utils";
import styles from "./index.module.scss";

export const loader: LoaderFunction = () => {
    changeScene(AudioActionType.BGM_MENU);
    return null;
};

const DEFAULT_DECK_CASE = 1082012;

export const Component: React.FC = () => {
    const { t: i18n } = useTranslation("Decks");
    const navigate = useNavigate();
    const { message } = App.useApp();
    const { decks } = useSnapshot(deckStore);

    const handleEditDeck = (deckId: string) => {
        navigate(`/decks/edit/${deckId}`);
    };

    const handleViewDeck = (deckId: string) => {
        navigate(`/decks/show/${deckId}`);
    };

    const handleNewDeck = () => {
        navigate("/decks/build");
    };

    const handleDeleteDeck = async (deckName: string) => {
        const success = await deckStore.delete(deckName);
        if (success) {
            message.success(i18n("DeckDeleted", "Mazo eliminado"));
        } else {
            message.error(i18n("DeckDeleteError", "Error al eliminar el mazo"));
        }
    };

    const handleCopy = async (deck: IDeck) => {
        const success = await copyDeckToClipboard(deck);
        if (success) {
            message.success(i18n("CopySuccess", "Copiado al portapapeles"));
        } else {
            message.error(i18n("CopyError", "Error al copiar"));
        }
    };

    const handleDownload = (deck: IDeck) => {
        downloadDeckAsYDK(deck);
    };

    const handleUpload = async (deck: IDeck) => {
        const user = accountStore.user;
        if (user) {
            try {
                const resp = await uploadDeck({
                    userId: user.id,
                    token: user.token,
                    deckContributor: user.username,
                    deck: {
                        deckName: deck.deckName,
                        deckCase: DEFAULT_DECK_CASE,
                        deckYdk: genYdkText(deck),
                    },
                });

                if (resp) {
                    if (resp.code) {
                        message.error(resp.message);
                    } else {
                        message.success(
                            i18n("UploadSuccess", `Mazo ${deck.deckName} subido`),
                        );
                    }
                } else {
                    message.error(i18n("UploadError", "Error de red al subir mazo"));
                }
            } catch (e) {
                console.error(e);
                message.error(i18n("UploadError", "Error al subir mazo"));
            }
        } else {
            message.error(i18n("LoginRequired", "Inicia sesión para subir mazos"));
        }
    };

    return (
        <div className={styles.container}>
            <Background />
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{i18n("MyDecks", "Mis Mazos")}</h1>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={handleNewDeck}
                    >
                        {i18n("NewDeck", "Nuevo Mazo")}
                    </Button>
                </div>

                {decks.length === 0 ? (
                    <Empty
                        description={i18n("NoDecks", "No tienes mazos. ¡Crea uno!")}
                        className={styles.empty}
                    >
                        <Button type="primary" onClick={handleNewDeck}>
                            {i18n("CreateFirstDeck", "Crear mi primer mazo")}
                        </Button>
                    </Empty>
                ) : (
                    <div className={styles.deckGrid}>
                        {decks.map((deck) => (
                            <Card
                                key={deck.id}
                                className={styles.deckCard}
                                hoverable
                                onClick={() => handleViewDeck(deck.id)}
                                actions={[
                                    <EditOutlined
                                        key="edit"
                                        title={i18n("Edit", "Editar")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditDeck(deck.id);
                                        }}
                                    />,
                                    <CopyOutlined
                                        key="copy"
                                        title={i18n("Copy", "Copiar")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(deck as IDeck);
                                        }}
                                    />,
                                    <DownloadOutlined
                                        key="download"
                                        title={i18n("Download", "Descargar")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(deck as IDeck);
                                        }}
                                    />,
                                    <UploadOutlined
                                        key="upload"
                                        title={i18n("Upload", "Subir Online")}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpload(deck as IDeck);
                                        }}
                                    />,
                                    <Popconfirm
                                        key="delete"
                                        title={i18n("DeleteDeckConfirm", "¿Eliminar este mazo?")}
                                        onConfirm={(e) => {
                                            e?.stopPropagation();
                                            handleDeleteDeck(deck.deckName);
                                        }}
                                        onCancel={(e) => e?.stopPropagation()}
                                        okText={i18n("Yes", "Sí")}
                                        cancelText={i18n("No", "No")}
                                    >
                                        <DeleteOutlined
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ color: "#ff4d4f" }}
                                            title={i18n("Delete", "Eliminar")}
                                        />
                                    </Popconfirm>,
                                ]}
                            >
                                <Card.Meta
                                    title={deck.deckName}
                                    description={
                                        <div className={styles.deckStats}>
                                            <span>Main: {deck.main.length}</span>
                                            <span>Extra: {deck.extra.length}</span>
                                            <span>Side: {deck.side.length}</span>
                                        </div>
                                    }
                                />
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

Component.displayName = "Decks";
