import React, { useEffect, useState } from "react";
import { App } from 'dwv';
import PropTypes from 'prop-types';

function DICOM({ isMobile, files, setIsInitialized }) {
    const [dicomApp, setDicomApp] = useState(null);
    const [loadProgress, setLoadProgress] = useState(0);
    const [metaData, setMetaData] = useState({});
    const [dataLoaded, setDataLoaded] = useState(false);
    const tools = {
        Scroll: {},
        ZoomAndPan: {},
        WindowLevel: {},
        Draw: {
            options: ['Ruler']
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
                // this.onChangeTool(selectedTool);
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
        if(dicomApp && files) {
            dicomApp.loadFiles(files);
        }
    }, [dicomApp, files]);

    useEffect(() => {
        if(dicomApp) {
            setIsInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomApp]);

    return (
        <div id="dwv" style={{ "height": "600px" }}>
            <div id="layerGroup0" className="layerGroup" />
        </div>
    );
}

DICOM.propTypes = {
    isMobile: PropTypes.bool,
    files: PropTypes.object,
    setIsInitialized: PropTypes.func
};
  
export default DICOM;