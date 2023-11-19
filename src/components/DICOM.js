import React, { useEffect, useState } from "react";
import { App } from '@themetzmeier/dwv';
import { CgScrollV } from 'react-icons/cg';
import { LiaArrowsAltSolid } from 'react-icons/lia';
import { IoIosContrast } from 'react-icons/io';
import { BiRuler,BiReset } from "react-icons/bi";
import { MdOutlineCameraswitch } from "react-icons/md";
import PropTypes from 'prop-types';
import { getObjectValue } from "../utils/utils";

function DICOM({ isMobile, files, fileIds, dbDICOMStates, setIsInitialized }) {
    const [dicomApp, setDicomApp] = useState(null);
    const [loadProgress, setLoadProgress] = useState(0);
    const [metaData, setMetaData] = useState({});
    const [selectedTool, setSelectedTool] = useState('Select Tool');
    const [orientation, setOrientation] = useState('sagittal');
    const [dataLoaded, setDataLoaded] = useState(false);
    const [stateUpdateInfo, setStateUpdateInfo] = useState(null);
    const toolIconStyle = {
        "transform": "scale(2.5)"
    }
    const selectedToolIconStyle = {
        ...toolIconStyle,
        "color": "#6082B6"
    };
    const tools = {
        Scroll: {
            icon: < CgScrollV style={selectedTool === "Scroll" ? selectedToolIconStyle : toolIconStyle} />,
            can: "canScroll"
        },
        ZoomAndPan: {
            icon: <LiaArrowsAltSolid style={selectedTool === "ZoomAndPan" ? selectedToolIconStyle : toolIconStyle} />
        },
        WindowLevel: {
            icon: <IoIosContrast style={selectedTool === "WindowLevel" ? selectedToolIconStyle : toolIconStyle} />,
            can: "canWindowLevel()"
        },
        Draw: {
            icon: <BiRuler style={selectedTool === "Draw" ? selectedToolIconStyle : toolIconStyle} />,
            options: ['Ruler']
        }
    };

    const reset = (app) => {
        if (app) {
            app.resetDisplay();
        }
    };

    const changeOrientation = (app) => {
        let newOrientation = getNextView(orientation);

        // Re-set current orientation with new one
        setOrientation(newOrientation);

        // Update DICOM viewer orientation config
        const config = {
            '*': [{ divId: 'layerGroup0', "orientation": newOrientation }]
        };
        
        // Set new view
        app.setDataViewConfigs(config);

        // Render new View
        for (let i = 0; i < app.getNumberOfLoadedData(); ++i) {
            app.render(i);
        }
    };

    const getNextView = (currentView) => {
        let nextView = null;
        let views = ['axial', 'coronal', 'sagittal'];

        if(currentView) {
            let oldViewIndex = views.findIndex((or) => or === currentView);
            if(oldViewIndex + 1 === views.length) {
                nextView = views[0];
            }
            else {
                nextView = views[oldViewIndex + 1];
            }
        }

        return nextView;
    };

    const additionalTools = {
        Reset: {
            icon: <BiReset style={toolIconStyle} />,
            onChange: reset
        },
        ChangeOrientation: {
            icon: <MdOutlineCameraswitch style={toolIconStyle} />,
            onChange: changeOrientation
        }
    };
    const fullTools = {
        ...tools,
        ...additionalTools
    };

    const canUseTool = (app, canFunction) => {
        let can = true;
        if(canFunction) {
            can = app[canFunction]
        }
        return can;
    };

    const updateParent = (e) => {
        // console.log(e);
        let fileIndex = parseInt(e.groupDivId.split("layerGroup")[1]);
        let file = files[fileIndex];
        let fileId = fileIds[fileIndex];

        setStateUpdateInfo({ "name": file.name, "size": file.size, "id": fileId });
    };

    const handleChangeTool = (tool) => {
        if (dicomApp) {
            setSelectedTool(tool);
            dicomApp.setTool({ tool, updateParent });
            if (tool === 'Draw') {
                dicomApp.setToolFeatures({shapeName: tools.Draw.options[0] });
            }
        }
    };

    useEffect(() => {
        // create app
        const app = new App();

        // initialise app
        app.init({
            "dataViewConfigs": {'*': [{divId: 'layerGroup0'}]},
            "tools": tools
        });

        addAppEventListeners(app);

        // store
        setDicomApp(app);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if(dicomApp) {
            // Add Event Listener for resize of window
            window.addEventListener('resize', dicomApp.onResize);
            return () => {
                // Remove the Event Listener for resize of window when component finishes
                window.removeEventListener('resize', dicomApp.onResize);
            }
        }
    }, [dicomApp]);

    const addAppEventListeners = (app) => {
        // load events
        let nLoadItem = null;
        let nReceivedLoadError = null;
        let nReceivedLoadAbort = null;
        let isFirstRender = null;
        app.addEventListener('loadstart', () => {
            // reset flags
            nLoadItem = 0;
            nReceivedLoadError = 0;
            nReceivedLoadAbort = 0;
            isFirstRender = true;
        });
        app.addEventListener("loadprogress", (event) => {
            setLoadProgress(event.loaded);
        });
        app.addEventListener('renderend', () => {
            if (isFirstRender) {
                isFirstRender = false;
                // available tools
                let selectedTool = 'ZoomAndPan';
                if (app.canScroll()) {
                    selectedTool = 'Scroll';
                }
                handleChangeTool(selectedTool);
            }
        });
        app.addEventListener("load", () => {
            // set dicom tags
            setMetaData(app.getMetaData(0));
            // set data loaded flag
            setDataLoaded(true);
        });
        app.addEventListener('loadend', () => {
            if (nReceivedLoadError) {
                setLoadProgress(0);
                alert('Received errors during load. Check log for details.');
            }
            if (nReceivedLoadAbort) {
                setLoadProgress(0);
                alert('Load was aborted.');
            }
        });
        app.addEventListener('loaditem', () => {
            ++nLoadItem;
        });
        app.addEventListener('loaderror', (event) => {
            console.error(event.error);
            ++nReceivedLoadError;
        });
        app.addEventListener('loadabort', () => {
            ++nReceivedLoadAbort;
        });

        // handle key events
        app.addEventListener('keydown', (event) => {
            app.defaultOnKeydown(event);
        });
    };

    useEffect(() => {
        if(dicomApp && files && fileIds) {
            dicomApp.loadFiles(files);
        } else if (dicomApp) {
            dicomApp.reset();
        }
    }, [dicomApp, files, fileIds]);

    useEffect(() => {
        if(dicomApp) {
            setIsInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomApp]);

    useEffect(() => {
        if(dicomApp && stateUpdateInfo) {
            let dicomAppState = dicomApp.getJsonState();
            // console.log(JSON.parse(dicomAppState));

            let dbObject = { dicomAppState, ...stateUpdateInfo };
            // console.log(dbObject);
            
            storeDICOMState(dbObject);

            setStateUpdateInfo(null);
        }
    }, [dicomApp, stateUpdateInfo]);

    const storeDICOMState = (dbObject) => {
        // console.log(dbObject);
        localStorage.setItem("dicomAppState", JSON.stringify(dbObject));
    };

    const getDICOMState = () => {
        let dicomExistingState = localStorage.getItem("dicomAppState");
        if(dicomExistingState) {
            dicomExistingState = JSON.parse(dicomExistingState);
        }
        return dicomExistingState;
    };

    useEffect(() => {
        if(dicomApp && fileIds && loadProgress && loadProgress === 100) {
            let dicomExistingState = getDICOMState(fileIds);
            if(dicomExistingState) {
                fileIds.forEach((id) => {
                    // console.log(`${id} === ${dicomExistingState.id} => ${id === dicomExistingState.id}`);
                    if(id === dicomExistingState.id) {
                        dicomApp.applyJsonState(dicomExistingState.dicomAppState);
                    }
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomApp, fileIds, loadProgress]);

    useEffect(() => {
        if(dicomApp && fileIds && loadProgress && loadProgress === 100 && dbDICOMStates) {
            if(dbDICOMStates && dbDICOMStates.length > 0) {
                applyCorrectState(fileIds, dbDICOMStates)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomApp, fileIds, loadProgress, dbDICOMStates]);

    const applyCorrectState = async (fIds, dStates) => {
        let selectedState = null;
        await Promise.all(fIds.map(async(id) => {
            await Promise.all(dStates.map((dState) => {
                // console.log(`${id} === ${dState.id} => ${id === dState.id}`);
                if(id === dState.id) {
                    selectedState = dState;
                }
                return true;
            }))
            return true;
        }));

        if(selectedState) {
            dicomApp.applyJsonState(selectedState.dicomAppState);
        }
    };

    return (
        <div>
            {/* DICOM Control Interface */}
            {files ? (
                <div style={{ "display": "flex", "justifyContent": "center" }}>
                    {Object.keys(fullTools).map((tool) => {
                        return (
                            <button 
                                key={tool}
                                className="dwv-button"
                                style={{ "padding": "16px", "display": "flex", "alignItems": "center", "marginRight": "16px" }} 
                                onClick={() => {
                                    if(getObjectValue(fullTools[tool], "onChange")) {
                                        fullTools[tool].onChange(dicomApp);
                                    } else {
                                        handleChangeTool(tool);
                                    }
                                }} 
                                title={tool} 
                                disabled={!dataLoaded || (getObjectValue(tool, "can") && !canUseTool(dicomApp, tool.can))}
                            >
                                {fullTools[tool].icon}
                            </button>
                        );
                    })}
                </div>
            ) : null}
            {/* DICOM Viewer Window */}
            <div id="dwv" style={{ "height": "600px", "display": "flex", "alignItems": "center" }}>
                <div id="layerGroup0" style={{ "width": "100%" }} className="layerGroup" />
            </div>
        </div>
    );
}

DICOM.propTypes = {
    isMobile: PropTypes.bool,
    files: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object
    ]),
    setIsInitialized: PropTypes.func
};
  
export default DICOM;