import React, {
    useState, useEffect, useCallback,
    useMemo, useRef
    , Fragment } from "react";

import { 
    makeStyles
} from "@material-ui/core";

import { 
    Description, Photo, PictureAsPdf
} from "@material-ui/icons";

import moment from "moment";

import {
    FullFileBrowser, setChonkyDefaults, ChonkyIconName,
    ChonkyActions, FileHelper, defineFileAction
} from "chonky";
import { ChonkyIconFA } from "chonky-icon-fontawesome";

import PageTitle from "../reusables/PageTitle";
import GeneralStyles from "../../GeneralStyles";

import InputModal from "./InputModal";
import { getFolderContents } from "./ajax";



const useStyles = makeStyles(theme => {
    const gen_style = GeneralStyles(theme);
    return {
        ...gen_style,
        tabBar: {
            ...gen_style.pageContentMargin
        },
        tabBarContent: {
            marginTop: 30
        },
        speedDial: {
            position: "fixed",
            "&.MuiSpeedDial-directionUp": {
                bottom: theme.spacing(2),
                right: theme.spacing(2),
            }
        }
    };
});

const sample_files = {
    // null, // Loading animation will be shown for this file
    base: {
        id: "base",
        name: "Weh",
        isDir: true,
        childrenIds: [
            "nTe",
            "zxc",
            "bnm",
            "vfr",
            "7zp",
            "qwe",
            "upq",
            "mRw",
            "mEt"
        ]
    },
    nTe: {
        id: "nTe",
        name: "Normal file.yml",
        ext: ".yml",
        size: 890,
        modDate: new Date("2012-01-01"),
        parentId: "base"
    },
    zxc: {
        id: "zxc",
        name: "Hidden file.mp4",
        isHidden: true,
        size: 890,
        parentId: "base"
    },
    bnm: {
        id: "bnm",
        name: "Normal folder",
        isDir: true,
        childrenIds: [
            "rty",
            "btj"
        ],
        childrenCount: 2,
        parentId: "base"
    },
    vfr: {
        id: "vfr",
        name: "Symlink folder",
        isDir: false,
        isSymlink: true,
        childrenCount: 0,
        parentId: "base"
    },
    "7zp": {
        id: "7zp",
        name: "Encrypted file.7z",
        isEncrypted: true,
        parentId: "base"
    },
    qwe: {
        id: "qwe",
        name: "Not selectable.tar.gz",
        ext: ".tar.gz", // Custom extension
        selectable: false, // Disable selection
        size: 54300000000,
        modDate: new Date(),
        parentId: "base"
    },
    rty: {
        id: "rty",
        name: "Not openable.pem",
        openable: false, // Prevent opening
        size: 100000000,
        parentId: "bnm"
    },
    btj: {
        id: "btj",
        name: "Not draggable.csv",
        draggable: false, // Prevent this files from being dragged,
        parentId: "bnm"
    },
    upq: {
        id: "upq",
        name: "Not droppable",
        isDir: true,
        droppable: false, // Prevent files from being dropped into this folder
        parentId: "base"
    },
    mRw: {
        id: "mRw",
        name: "Unknown file name",
        parentId: "base"
    },
    mEt: {
        id: "mEt",
        name: "Custom icon & color",
        color: "#09f",
        // icon: ChonkyIconName.dndCanDrop,
        parentId: "base"
    }
};

// Somewhere in your `index.ts`:
setChonkyDefaults({ iconComponent: ChonkyIconFA });

const useCustomFileMap = () => {
    // const [baseFileMap, rootFolderId] = useMemo(() => ([sample_files, "base"]), []);

    // Setup the React state for our file map and the current folder.
    // const [fileMap, setFileMap] = useState(baseFileMap);
    // const [currentFolderId, setCurrentFolderId] = useState(rootFolderId);
    const [fileMap, setFileMap] = useState({});
    const [currentFolderId, setCurrentFolderId] = useState("base");

    useEffect(() => {
        getFolderContents(null, data => {
            console.log(data);
            setFileMap(data);
        });
    }, []);

    const currentFolderIdRef = useRef(currentFolderId);
    useEffect(() => {
        currentFolderIdRef.current = currentFolderId;
    }, [currentFolderId]);

    const idCounter = useRef(0);
    const createFolder = useCallback(folderName => {
        setFileMap(currentFileMap => {
            const newFileMap = { ...currentFileMap };

            // Create the new folder
            const newFolderId = `new-folder-${idCounter.current++}`;
            newFileMap[newFolderId] = {
                id: newFolderId,
                name: folderName,
                isDir: true,
                modDate: new Date(),
                parentId: currentFolderIdRef.current,
                childrenIds: [],
                childrenCount: 0
            };

            // Update parent folder to reference the new folder.
            const parent = newFileMap[currentFolderIdRef.current];
            newFileMap[currentFolderIdRef.current] = {
                ...parent,
                childrenIds: [...parent.childrenIds, newFolderId],
                childrenCount: parent.childrenCount + 1
            };

            return newFileMap;
        });
    }, []);

    // Function that will be called when user deletes files either using the toolbar
    // button or `Delete` key.
    const deleteFiles = useCallback(files => {
        // We use the so-called "functional update" to set the new file map. This
        // lets us access the current file map value without having to track it
        // explicitly. Read more about it here:
        // https://reactjs.org/docs/hooks-reference.html#functional-updates
        setFileMap(currentFileMap => {
            // Create a copy of the file map to make sure we don't mutate it.
            const newFileMap = { ...currentFileMap };

            files.forEach((file) => {
                // Delete file from the file map.
                delete newFileMap[file.id];

                // Update the parent folder to make sure it doesn't try to load the
                // file we just deleted.
                if (file.parentId) {
                    const parent = newFileMap[file.parentId];
                    const newChildrenIds = parent.childrenIds.filter(id => id !== file.id);
                    newFileMap[file.parentId] = {
                        ...parent,
                        childrenIds: newChildrenIds,
                        childrenCount: newChildrenIds.length,
                    };
                }
            });

            return newFileMap;
        });
    }, []);

    const uploadFiles = useCallback(file => {
        const { name, size } = file;
        setFileMap(currentFileMap => {
            const newFileMap = { ...currentFileMap };

            // Create the new file
            const newFileId = `new-file-${idCounter.current++}`;
            newFileMap[newFileId] = {
                id: newFileId,
                name,
                isDir: false,
                modDate: new Date(),
                parentId: currentFolderIdRef.current,
                size
            };

            // Update parent folder to reference the new folder.
            const parent = newFileMap[currentFolderIdRef.current];
            newFileMap[currentFolderIdRef.current] = {
                ...parent,
                childrenIds: [...parent.childrenIds, newFileId],
                childrenCount: parent.childrenCount + 1
            };

            return newFileMap;
        });
        console.log("Done");
    }, []);

    const addLink = useCallback(obj => {
        const { file_name, link } = obj;
        setFileMap(currentFileMap => {
            const newFileMap = { ...currentFileMap };

            // Create the new file
            const newFileId = `new-file-${idCounter.current++}`;
            newFileMap[newFileId] = {
                id: newFileId,
                name: file_name,
                link,
                isDir: false,
                modDate: new Date(),
                parentId: currentFolderIdRef.current,
                isSymlink: true
            };

            // Update parent folder to reference the new folder.
            const parent = newFileMap[currentFolderIdRef.current];
            newFileMap[currentFolderIdRef.current] = {
                ...parent,
                childrenIds: [...parent.childrenIds, newFileId],
                childrenCount: parent.childrenCount + 1
            };

            return newFileMap;
        });
        console.log("Done");
    }, []);

    return {
        fileMap,
        currentFolderId,
        setCurrentFolderId,
        createFolder,
        deleteFiles,
        uploadFiles,
        addLink
        // inputFileRef
    };
};

export const useFiles = (
    fileMap,
    currentFolderId
) => {
    return useMemo(() => {
        if (typeof fileMap[currentFolderId] === "undefined") return null;
        const currentFolder = fileMap[currentFolderId];
        const { childrenIds } = currentFolder;
        const files = childrenIds.map(fileId => fileMap[fileId]);
        return files;
    }, [currentFolderId, fileMap]);
};


export const useFolderChain = (
    fileMap, currentFolderId
) => {
    return useMemo(() => {
        if (typeof fileMap[currentFolderId] === "undefined") return null;
        const currentFolder = fileMap[currentFolderId];
        const folderChain = [currentFolder];

        let { parentId } = currentFolder;
        console.log("pp", parentId, currentFolder);
        while (parentId) {
            const parentFile = fileMap[parentId];
            if (parentFile) {
                folderChain.unshift(parentFile);
                parentId = parentFile.parentId;
            } else {
                break;
            }
        }

        console.log("FOLDER CHAIN", folderChain, currentFolderId);
        return folderChain;
    }, [currentFolderId, fileMap]);
};

const AddLinkAction = defineFileAction({
    id: "add_link",
    hotkeys: ["ctrl+o"],
    button: {
        name: "Add link",
        toolbar: true,
        contextMenu: false,
        icon: ChonkyIconName.symlink
    },
});

export const useFileActionHandler = (
    setCurrentFolderId,
    triggerCreateFolder,
    deleteFiles,
    triggerUploadFiles,
    triggerAddLink
) => {
    return useCallback(data => {
        if (data.id === ChonkyActions.OpenFiles.id) {
            const { targetFile, files } = data.payload;
            const fileToOpen = targetFile || files[0];
            if (fileToOpen && FileHelper.isDirectory(fileToOpen)) {
                setCurrentFolderId(fileToOpen.id);
            }
        } else if (data.id === ChonkyActions.CreateFolder.id) {
            // const folderName = prompt("Provide the name for your new folder:");
            // if (folderName) createFolder(folderName);
            triggerCreateFolder();
        } else if (data.id === ChonkyActions.DeleteFiles.id) {
            deleteFiles(data.state.selectedFilesForAction);
        } else if (data.id === ChonkyActions.UploadFiles.id) {
            triggerUploadFiles();
        } else if (data.id === AddLinkAction.id) {
            triggerAddLink();
        }

        // showActionNotification(data);
    }, [setCurrentFolderId]);
};

export default function Container () {
    const classes = useStyles();
    const [isOpen, setIsOpen] = useState("");

    const {
        fileMap,
        // inputFileRef,
        currentFolderId,
        setCurrentFolderId,
        resetFileMap,
        deleteFiles,
        moveFiles,
        createFolder,
        uploadFiles,
        addLink
    } = useCustomFileMap();
    const files = useFiles(fileMap, currentFolderId);
    const folderChain = useFolderChain(fileMap, currentFolderId);

    const triggerCreateFolder = () => { setIsOpen("create_folder"); };
    const handleCreateFolder = folderName => {
        setIsOpen("");
        createFolder(folderName);
    };

    const triggerAddLink = () => { setIsOpen("add_link"); };
    const handleAddLink = obj => {
        setIsOpen("");
        addLink(obj);
    };

    const inputFileRef = useRef(null);
    const triggerUploadFiles = useCallback(() => {
        inputFileRef.current.click();
    }, []);

    const handleFileChange = event => {
        const { files: selected } = event.target;
        for (let i = 0; i < selected.length; i += 1) {
            const temp = selected.item(i);
            console.log(temp);
            // if (!attachedFiles.some(x => x.name === temp.name)) {
            //     attachedFiles.push(temp);
            // }
            uploadFiles(temp);
        }
    };

    const handleFileAction = useFileActionHandler(
        setCurrentFolderId, triggerCreateFolder, deleteFiles,
        triggerUploadFiles, triggerAddLink
    );
    const fileActions = useMemo(
        () => [
            AddLinkAction,
            ChonkyActions.CreateFolder,
            ChonkyActions.DeleteFiles,
            ChonkyActions.UploadFiles
        ],
        []
    );

    return (
        <Fragment>
            <div className={classes.pageContentMargin}>
                <PageTitle
                    title="Knowledge Management"
                // customButtons={is_desktop ? custom_buttons : false}
                />

                <div style={{ height: 700 }}>
                    <FullFileBrowser
                        files={files}
                        folderChain={folderChain}
                        fileActions={fileActions}
                        onFileAction={handleFileAction}
                    />
                </div>

                <input
                    style={{ display: "none" }}
                    ref={inputFileRef}
                    multiple
                    type="file"
                    onChange={handleFileChange}
                    onClick={event => { event.target.value = null; }}
                    id="file-input"
                />
            </div>

            <InputModal
                isOpen={isOpen}
                handleCreateFolder={handleCreateFolder}
                handleAddLink={handleAddLink}
                handleClose={() => setIsOpen("")}
            />
        </Fragment>
    );
}