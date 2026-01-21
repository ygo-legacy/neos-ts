import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { redirect, useNavigate } from "react-router-dom";

import { login as apiLogin, register as apiRegister, type AuthUser } from "@/api/legacyAuth";
import { accountStore } from "@/stores";
import { Background } from "@/ui/Shared";

import styles from "./index.module.scss";

type AuthTab = "login" | "register";

export const loader = async () => {
    // Check if already authenticated using stored token
    const isAuthenticated = await accountStore.loadFromStorage();
    if (isAuthenticated) {
        return redirect("/match");
    }
    return null;
};

export const Component: React.FC = () => {
    const { t: i18n } = useTranslation("Auth");
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AuthTab>("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Login form state
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form state
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user: AuthUser = await apiLogin({
                username: loginUsername,
                password: loginPassword,
            });
            accountStore.login(user);
            navigate("/match");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (registerPassword !== confirmPassword) {
            setError(i18n("PasswordMismatch", "Las contraseñas no coinciden"));
            return;
        }

        if (registerPassword.length < 8) {
            setError(i18n("PasswordTooShort", "La contraseña debe tener al menos 8 caracteres"));
            return;
        }

        setLoading(true);

        try {
            const user: AuthUser = await apiRegister({
                username: registerUsername,
                email: registerEmail,
                password: registerPassword,
            });
            accountStore.login(user);
            navigate("/match");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Background />
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>YGO Legacy</h1>
                    <p className={styles.subtitle}>
                        {i18n("WelcomeMessage", "El simulador de Yu-Gi-Oh! definitivo")}
                    </p>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === "login" ? styles.active : ""}`}
                        onClick={() => { setActiveTab("login"); setError(null); }}
                    >
                        {i18n("Login", "Iniciar Sesión")}
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "register" ? styles.active : ""}`}
                        onClick={() => { setActiveTab("register"); setError(null); }}
                    >
                        {i18n("Register", "Registrarse")}
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                {activeTab === "login" ? (
                    <form className={styles.form} onSubmit={handleLogin}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("Username", "Usuario")}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                placeholder={i18n("UsernamePlaceholder", "Tu nombre de usuario")}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("Password", "Contraseña")}</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder={i18n("PasswordPlaceholder", "Tu contraseña")}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? i18n("LoggingIn", "Iniciando sesión...") : i18n("Login", "Iniciar Sesión")}
                        </button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={handleRegister}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("Username", "Usuario")}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                                placeholder={i18n("UsernamePlaceholder", "Elige un nombre de usuario")}
                                required
                                minLength={3}
                                maxLength={20}
                                pattern="^[a-zA-Z0-9_]+$"
                                autoComplete="username"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("Email", "Correo electrónico")}</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                placeholder={i18n("EmailPlaceholder", "tu@email.com")}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("Password", "Contraseña")}</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                placeholder={i18n("PasswordPlaceholder", "Mínimo 8 caracteres")}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>{i18n("ConfirmPassword", "Confirmar contraseña")}</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={i18n("ConfirmPasswordPlaceholder", "Repite tu contraseña")}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? i18n("Registering", "Creando cuenta...") : i18n("Register", "Crear Cuenta")}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

Component.displayName = "Login";
