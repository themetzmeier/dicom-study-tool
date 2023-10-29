import React, { useEffect, useState } from 'react';
import DropZone from '../components/DropZone';
import DICOM from '../components/DICOM';

function DICOMTest() {
    const [dicomFile, setDicomFile] = useState(null);
    const [dropZoneVisible, setDropZoneVisible] = useState(false);
    const [dicomAppIsInitialized, setDicomAppIsInitialized] = useState(false);

    const handleFileUpload = (files) => {
        setDicomFile(files);
    }

    useEffect(() => {
        if(dicomAppIsInitialized) {
            setDropZoneVisible(true);
        }
    }, [dicomAppIsInitialized]);

    return (
        <div className="container" >
            <div className="content" >
                <DropZone visible={dropZoneVisible} updateParent={handleFileUpload} />
                <div style={{ "marginTop": "64px" }}>
                    <DICOM files={dicomFile} setIsInitialized={setDicomAppIsInitialized} />
                </div>
            </div>
        </div>
    );
}

export default DICOMTest;