import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Space, Pagination, Empty } from "antd";
import { useRef, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { subscribeKey } from "valtio/utils";

import { CardMeta, searchCards } from "@/api";
import { isToken } from "@/common";
import { AudioActionType, changeScene } from "@/infra/audio";
import { emptySearchConditions, FtsConditions } from "@/middleware/sqlite/fts";
import { initStore } from "@/stores";
import { Background, IconFont, YgoCard } from "@/ui/Shared";

import { DatabaseCard } from "./DatabaseCard";
import styles from "./index.module.scss";

export const loader = () => {
    changeScene(AudioActionType.BGM_MENU);
    return null;
};

// Skeleton Grid Component
const SkeletonGrid = () => {
    // Generate 30 placeholders
    const placeholders = Array.from({ length: 30 }, (_, i) => i);
    return (
        <div className={styles.cardContainer}>
            <div className={styles.grid}>
                {placeholders.map((i) => (
                    <div
                        key={i}
                        style={{
                            aspectRatio: "59/86",
                            position: "relative",
                            width: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "4px"
                        }}
                    >
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
                            <YgoCard isBack code={0} style={{ width: "100%", height: "100%" }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const Component: React.FC = () => {
    const { t: i18n } = useTranslation("BuildDeck"); // Reusing i18n for now
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchCardResult, setSearchCardResult] = useState<CardMeta[]>([]);
    const [loading, setLoading] = useState(true);

    // Read initial state from URL
    const initialQuery = searchParams.get("q") || "";
    const [searchWord, setSearchWord] = useState(initialQuery);

    const handleSearch = useCallback((query: string) => {
        // Update URL
        if (query) {
            setSearchParams({ q: query });
        } else {
            setSearchParams({});
        }

        // Perform search
        const result = searchCards({ query, conditions: emptySearchConditions })
            .filter((card) => !isToken(card.data.type ?? 0))
            .sort((a, b) => a.id - b.id);

        setSearchCardResult(result);
    }, [setSearchParams]);

    // Initial search on mount if query exists
    useEffect(() => {
        const checkAndSearch = () => {
            if (initStore.sqlite.progress === 1) {
                // DB Ready
                if (initialQuery) {
                    handleSearch(initialQuery);
                } else {
                    handleSearch("");
                }
                setLoading(false);
            } else {
                setLoading(true);
                // Wait for DB
                const unsub = subscribeKey(initStore.sqlite, "progress", (val) => {
                    if (val === 1) {
                        if (initialQuery) {
                            handleSearch(initialQuery);
                        } else {
                            handleSearch("");
                        }
                        setLoading(false);
                        unsub();
                    }
                });
                return unsub;
            }
        };

        checkAndSearch();
    }, []);

    const onSearch = () => {
        // Simple loading toggle for UX effect if desired, even if sync
        setLoading(true);
        // Small timeout to allow UI to show loader if search is heavy
        setTimeout(() => {
            handleSearch(searchWord);
            setLoading(false);
        }, 10);
    };

    const onReset = () => {
        setSearchWord("");
        setLoading(true);
        setTimeout(() => {
            handleSearch("");
            setLoading(false);
        }, 10);
    };

    return (
        <div className={styles.container}>
            <Background />
            <div className={styles.content}>
                <Space className={styles.searchBar}>
                    <Input
                        placeholder={i18n("KeywordsPlaceholder")}
                        variant="borderless"
                        suffix={
                            <Button
                                type="text"
                                icon={<SearchOutlined />}
                                onClick={onSearch}
                            />
                        }
                        value={searchWord}
                        onChange={(e) => setSearchWord(e.target.value)}
                        onKeyUp={(e) => e.key === "Enter" && onSearch()}
                        allowClear
                        style={{ width: "400px" }}
                        className={styles.searchInput}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={onReset}
                    >
                        {i18n("Reset")}
                    </Button>
                </Space>

                <div className={styles.resultsHeader}>
                    <span>
                        {i18n("SortBy")}
                        <span className={styles.count}> ({searchCardResult.length})</span>
                    </span>
                </div>

                {loading ? (
                    <SkeletonGrid />
                ) : (
                    <CardList results={searchCardResult} />
                )}
            </div>
        </div>
    );
};

Component.displayName = "Database";

const CardList: React.FC<{ results: CardMeta[] }> = ({ results }) => {
    const itemsPerPage = 200;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [results]);

    if (results.length === 0) {
        return (
            <div className={styles.empty}>
                <IconFont type="icon-empty" size={40} />
                <div>No cards found</div>
            </div>
        );
    }

    // Simple pagination for performance
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = results.slice(startIndex, startIndex + itemsPerPage);

    return (
        <>
            <div className={styles.cardContainer}>
                <div className={styles.grid}>
                    {currentData.map((card) => (
                        <Link key={card.id} to={`cards/${card.id}`}>
                            <DatabaseCard value={card} />
                        </Link>
                    ))}
                </div>
            </div>
            {results.length > itemsPerPage && (
                <div className={styles.pagination}>
                    <Pagination
                        current={currentPage}
                        onChange={setCurrentPage}
                        total={results.length}
                        pageSize={itemsPerPage}
                        showSizeChanger={false}
                        showLessItems
                        hideOnSinglePage
                    />
                </div>
            )}
        </>
    );
};
