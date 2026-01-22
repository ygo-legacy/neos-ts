import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { App, Button, Card, Empty, Popconfirm } from "antd";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { AudioActionType, changeScene } from "@/infra/audio";
import { deckStore } from "@/stores";
import { Background } from "@/ui/Shared";

import styles from "./index.module.scss";

export const loader: LoaderFunction = () => {
    changeScene(AudioActionType.BGM_MENU);
    return null;
};

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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditDeck(deck.id);
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
