import React from "react";

function TopBar({
                    currentNote,
                    onRename,
                    onDelete,
                    onLogout
                }) {

    return (
        <header className="workspace-header">

            <div className="current-note">

                <span className="header-label">
                    CURRENT NOTE
                </span>

                <h1>
                    {currentNote?.title || "Start speaking"}
                </h1>

            </div>

            <div className="header-actions">

                {currentNote && (
                    <>
                        <button
                            type="button"
                            className="header-button"
                            onClick={onRename}
                        >
                            Rename
                        </button>

                        <button
                            type="button"
                            className="header-button danger"
                            onClick={onDelete}
                        >
                            Delete
                        </button>
                    </>
                )}

                <button
                    type="button"
                    className="header-button logout-header"
                    onClick={onLogout}
                >
                    Logout
                </button>

            </div>

        </header>
    );
}

export default TopBar;