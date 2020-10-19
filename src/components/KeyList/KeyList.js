import React, { Fragment, useEffect, useState } from "react";

import useCRUDService from "../../services/CRUDService";
import useCommandQueueService from "../../services/CommandQueueService";
import useBluzelle from "../../services/BluzelleService";

import KeyListItem from "./KeyListItem";
import NewKeyField from "./NewKey/NewKeyField";
import RenameKeyField from "./NewKey/RenameKeyField";
import importCSV from "./importCSV";
import exportCSV from "./exportCSV";
import loadingBar from "../loadingBar";

import useData from "components/DataContext/useData";

const KeyList = () => {
    const [showNewKey, setShowNewKey] = useState(false);
    const [renameKey, setRenameKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const {
        execute,
        removePreviousHistory,
        updateHistoryMessage,
        revert,
    } = useCommandQueueService();
    const { getClient } = useBluzelle();
    const { save, remove, reload, refreshKeys } = useCRUDService();

    const {
        selectedKey,
        setSelectedKey,
        isWriter,
        keys,
        setKeys,
        activeValue,
        commandQueue,
        setCommandQueue,
    } = useData();

    useEffect(() => {
        setIsLoading(true);

        refreshKeys().then(() => {
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        if (commandQueue === undefined) {
            const newCommandQueue = [
                {
                    message: "Initial state",
                    revert,
                },
            ];
            setCommandQueue(newCommandQueue);
        }
    }, [commandQueue]);

    const rename = () => {
        setRenameKey(selectedKey);
    };

    const executeRemove = () => {
        const sk = selectedKey;
        const val = activeValue;

        execute({
            doIt: () => remove(),

            undoIt: () =>
                new Promise((resolve) => {
                    return getClient()
                        .create(sk, val)
                        .then(() =>
                            reload().then(() => {
                                setSelectedKey(sk);
                                resolve();
                            })
                        )
                        .catch(() =>
                            alert("Undo failed due to bluzelle network error.")
                        );
                }),

            message: (
                <span>
                    Removed key <code key={1}>{sk}</code>.
                </span>
            ),
        });
    };

    const executeReload = () => {
        reload();

        removePreviousHistory();
        updateHistoryMessage("Reload");
    };

    const AddButton = ({ onClick }) => (
        <BS.Button outline color='success' onClick={onClick}>
            <i className='fas fa-plus'></i>
        </BS.Button>
    );

    const SaveReloadRemove = ({ keyname }) => (
        <Fragment>
            <BS.Button outline color='info' onClick={executeReload}>
                <i className='fas fa-sync'></i>
            </BS.Button>

            {activeValue !== undefined && isWriter !== "read-only" && (
                <BS.Button color='success' onClick={save}>
                    <i className='fas fa-save'></i>
                </BS.Button>
            )}
        </Fragment>
    );

    const keyList = keys
        .sort()
        .map((keyname) =>
            keyname !== renameKey ? (
                <KeyListItem key={keyname} keyname={keyname} />
            ) : (
                <RenameKeyField
                    key={keyname}
                    keyname={keyname}
                    onChange={() => setRenameKey("")}
                />
            )
        );

    const actualKeysList = (
        <BS.ListGroup>
            {keyList}

            {keyList.length === 0 && !showNewKey && (
                <h5
                    style={{
                        fontStyle: "italic",
                        color: "#999999",
                    }}>
                    No fields...
                </h5>
            )}

            {showNewKey && (
                <NewKeyField onChange={() => setShowNewKey(false)} />
            )}
        </BS.ListGroup>
    );

    return (
        <Fragment>
            <div style={{ padding: 10 }}>
                {isLoading ? loadingBar : actualKeysList}
            </div>
            <hr />
            <div style={{ padding: 10 }}>
                <BS.ButtonToolbar>
                    <BS.ButtonGroup>
                        {isWriter !== "read-only" && (
                            <AddButton onClick={() => setShowNewKey(true)} />
                        )}

                        {activeValue !== undefined && isWriter !== "read-only" && (
                            <BS.Button
                                outline
                                color='danger'
                                onClick={executeRemove}>
                                <i className='fas fa-times'></i>
                            </BS.Button>
                        )}

                        {activeValue !== undefined && isWriter !== "read-only" && (
                            <BS.Button
                                outline
                                color='warning'
                                onClick={() => rename()}>
                                <i className='fas fa-i-cursor'></i>
                            </BS.Button>
                        )}

                        <SaveReloadRemove />
                    </BS.ButtonGroup>

                    <BS.ButtonGroup style={{ paddingLeft: 10 }}>
                        <BS.Button
                            outline
                            id='importButton'
                            color='primary'
                            onClick={() => importCSV(setIsLoading, setKeys)}>
                            <i className='fas fa-file-import'></i>
                        </BS.Button>

                        <BS.UncontrolledTooltip
                            placement='top'
                            target='importButton'>
                            Import CSV file
                        </BS.UncontrolledTooltip>

                        <BS.Button
                            outline
                            id='exportButton'
                            color='secondary'
                            onClick={() =>
                                exportCSV(isLoading, setIsLoading, keys)
                            }>
                            <i className='fas fa-file-export'></i>
                        </BS.Button>

                        <BS.UncontrolledTooltip
                            placement='top'
                            target='exportButton'>
                            Export CSV file
                        </BS.UncontrolledTooltip>
                    </BS.ButtonGroup>
                </BS.ButtonToolbar>
            </div>
        </Fragment>
    );
};

export default KeyList;
