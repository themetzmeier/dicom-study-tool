import React, { useEffect } from "react";
import RemovalButton from "./RemovalButton";
import PropTypes from 'prop-types';
import { convertFilesToArray } from "../utils/utils";

function DropZone({ display, isMobile, files, visible, updateParent }) {
    const dropZoneId = 'dropZone';
    const hoverClassName = 'hover';

    useEffect(() => {
        // Add Event Listener for on file dragover of dropzone
        window.addEventListener('dragover', onDragOver);
        return () => {
            // Remove the Event Listener for on file dragover of dropzone when component finishes
            window.removeEventListener('dragover', onDragOver);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onDragOver = (e) => {
        preventDefaultBehavior(e);

        // Change border color to denote dragging in a file
        const dropZoneElement = document.getElementById(dropZoneId);
        if (dropZoneElement && dropZoneElement.className.indexOf(hoverClassName) === -1) {
            dropZoneElement.className += ` ${hoverClassName}`;
        }
    };

    useEffect(() => {
        // Add Event Listener for on file dragleave of dropzone
        window.addEventListener('dragleave', onDragLeave);
        return () => {
            // Remove the Event Listener for on file dragleave of dropzone when component finishes
            window.removeEventListener('dragleave', onDragLeave);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onDragLeave = (e) => {
        preventDefaultBehavior(e);
        // Change border color to denote no longer dragging in a file
        const dropZoneElement = document.getElementById(dropZoneId);
        if (dropZoneElement && dropZoneElement.className.indexOf(hoverClassName) !== -1) {
            dropZoneElement.className = dropZoneElement.className.replace(` ${hoverClassName}`, '');
        }
    }

    useEffect(() => {
        // Add Event Listener for on file dragleave of dropzone
        window.addEventListener('drop', onDrop);
        return () => {
            // Remove the Event Listener for on file dragleave of dropzone when component finishes
            window.removeEventListener('drop', onDrop);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onDrop = (e) => {
        preventDefaultBehavior(e);

        // Polymorphism for handling both drag and drop events and file browse events
        let files = e.dataTransfer ? e.dataTransfer.files : e.target.files;

        // Prop Drilling, update parent with new file
        updateParent(files);

        // Change border color to denote no longer dragging in a file
        const dropZoneElement = document.getElementById(dropZoneId);
        if (dropZoneElement && dropZoneElement.className.indexOf(hoverClassName) !== -1) {
            dropZoneElement.className = dropZoneElement.className.replace(` ${hoverClassName}`, '');
        }
    };

    const preventDefaultBehavior = (e) => {
        // Do not take event default action as it will be explicitly handled
        e.preventDefault();

        // Prevents propogation to other event handlers of the same element
        e.stopPropagation();
    };

    const openFileBrowser = () => {
        // Create invisible input element
        let input = document.createElement('input');

        // Set input element type to file to initiate file browser mode
        input.type = 'file';

        // Set input element to include multiple files
        input.multiple = true;

        // Set on change function to onDrop
        input.onchange = onDrop;

        // Translate click of button element to click of input element
        input.click();
    };

    return (
        <div>
            {visible ? (
                <button onClick={() => { openFileBrowser() }} id={dropZoneId} style={{ "width": "100%" }} className="hidden-btn dropZone dropZoneBorder">
                    <p style={{ "margin": "0px" }}>Drag and drop your DICOM file here or click to browse</p>
                </button>
            ) : null}
            {display && files && files.length > 0 ? (
                <React.Fragment>
                    <h4>Files</h4>
                    <ul style={{ "whiteSpace":"nowrap" }}>
                        {convertFilesToArray(files).map((file) => {
                            if(typeof file === "string") {
                                let title = file.split("/");
                                let id = title[5];
                                title = title[6];
                                return (<li style={isMobile ? { "maxWidth": "250px", "wordBreak": "break-word", "whiteSpace": "normal", "display": "flex", "alignItems": "center" } : { "display": "flex", "alignItems": "center" }} key={id}>{title}<RemovalButton updateParent={updateParent} deleteObject={file} /></li>);
                            } else if(file && file.path) {
                                return (<li style={isMobile ? { "maxWidth": "250px", "wordBreak": "break-word", "whiteSpace": "normal", "display": "flex", "alignItems": "center" } : { "display": "flex", "alignItems": "center" }} key={file.path}>{file.path}<RemovalButton updateParent={updateParent} deleteObject={file} /></li>);
                            } else if(file && file.name) {
                                return (<li style={isMobile ? { "maxWidth": "250px", "wordBreak": "break-word", "whiteSpace": "normal", "display": "flex", "alignItems": "center" } : { "display": "flex", "alignItems": "center" }} key={file.name}>{file.name}<RemovalButton updateParent={updateParent} deleteObject={file} /></li>);
                            } else {
                                return false;
                            }
                        })}
                    </ul>
                </React.Fragment>
            ) : null}
        </div>
    );
}

DropZone.propTypes = {
    isMobile: PropTypes.bool,
    updateParent: PropTypes.func.isRequired,
    visible: PropTypes.bool.isRequired
};
  
export default DropZone;